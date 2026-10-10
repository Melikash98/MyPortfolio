<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store, max-age=0, must-revalidate');
header('X-Content-Type-Options: nosniff');

const GITHUB_ACTIVITY_LOGIN = 'Melikash98';
const GITHUB_ACTIVITY_CACHE_TTL = 1800;

function githubActivityRespond(int $status, array $payload): void
{
    http_response_code($status);
    $json = json_encode(
        $payload,
        JSON_UNESCAPED_SLASHES | JSON_INVALID_UTF8_SUBSTITUTE
    );

    echo $json === false
        ? '{"error":"Unable to encode GitHub activity response."}'
        : $json;
    exit;
}

function githubActivityReadCache(string $path): ?array
{
    if (!is_file($path) || !is_readable($path)) {
        return null;
    }

    $contents = @file_get_contents($path);
    if (!is_string($contents) || $contents === '') {
        return null;
    }

    $data = json_decode($contents, true);
    if (
        !is_array($data)
        || !isset($data['updatedAt'], $data['weeks'])
        || !is_array($data['weeks'])
    ) {
        return null;
    }

    return $data;
}

function githubActivityIsFresh(?array $data): bool
{
    if ($data === null || !isset($data['updatedAt'])) {
        return false;
    }

    $updatedAt = strtotime((string) $data['updatedAt']);
    if ($updatedAt === false) {
        return false;
    }

    $age = time() - $updatedAt;
    return $age >= 0 && $age < GITHUB_ACTIVITY_CACHE_TTL;
}

function githubActivityFail(?array $stale, string $message, int $status = 502): void
{
    if ($stale !== null) {
        $stale['cacheStatus'] = 'stale';
        githubActivityRespond(200, $stale);
    }

    githubActivityRespond($status, ['error' => $message]);
}

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'GET') {
    header('Allow: GET');
    githubActivityRespond(405, ['error' => 'Only GET requests are supported.']);
}

$cacheKey = hash('sha256', __DIR__ . ':' . GITHUB_ACTIVITY_LOGIN);
$cachePath = rtrim(sys_get_temp_dir(), DIRECTORY_SEPARATOR)
    . DIRECTORY_SEPARATOR
    . 'github-activity-' . $cacheKey . '.json';

$cached = githubActivityReadCache($cachePath);
if (githubActivityIsFresh($cached)) {
    $cached['cacheStatus'] = 'cached';
    githubActivityRespond(200, $cached);
}

$lockHandle = @fopen($cachePath . '.lock', 'c');
if (is_resource($lockHandle)) {
    @flock($lockHandle, LOCK_EX);
}

// Another request may have refreshed the data while this request waited for the lock.
$cached = githubActivityReadCache($cachePath);
if (githubActivityIsFresh($cached)) {
    $cached['cacheStatus'] = 'cached';
    githubActivityRespond(200, $cached);
}

$token = getenv('GITHUB_TOKEN');
$token = is_string($token) ? trim($token) : '';

// cPanel alternative: keep this file one directory above the website document root.
$privateConfigPath = dirname(__DIR__) . DIRECTORY_SEPARATOR . 'github-activity-config.php';
if ($token === '' && is_file($privateConfigPath) && is_readable($privateConfigPath)) {
    $privateConfig = require $privateConfigPath;
    if (is_array($privateConfig) && isset($privateConfig['github_token'])) {
        $token = trim((string) $privateConfig['github_token']);
    }
}

if ($token === '' || preg_match('/[\r\n]/', $token) === 1) {
    githubActivityFail(
        $cached,
        'GitHub activity is not configured on the server.',
        503
    );
}

if (!function_exists('curl_init')) {
    githubActivityFail(
        $cached,
        'The server does not have the PHP cURL extension enabled.',
        503
    );
}

$query = <<<'GRAPHQL'
query ContributionsCalendar($login: String!, $from: DateTime!, $to: DateTime!) {
  user(login: $login) {
    contributionsCollection(from: $from, to: $to) {
      contributionCalendar {
        totalContributions
        colors
        weeks {
          firstDay
          contributionDays {
            date
            weekday
            contributionCount
            color
          }
        }
      }
    }
  }
}
GRAPHQL;

$to = gmdate('Y-m-d\TH:i:s\Z');
$from = gmdate('Y-m-d\TH:i:s\Z', strtotime('-1 year'));
$requestBody = json_encode(
    [
        'query' => $query,
        'variables' => [
            'login' => GITHUB_ACTIVITY_LOGIN,
            'from' => $from,
            'to' => $to,
        ],
    ],
    JSON_UNESCAPED_SLASHES
);

if (!is_string($requestBody)) {
    githubActivityFail($cached, 'Unable to prepare the GitHub request.');
}

$curl = curl_init('https://api.github.com/graphql');
if ($curl === false) {
    githubActivityFail($cached, 'Unable to connect to GitHub.');
}

curl_setopt_array($curl, [
    CURLOPT_POST => true,
    CURLOPT_POSTFIELDS => $requestBody,
    CURLOPT_HTTPHEADER => [
        'Accept: application/vnd.github+json',
        'Authorization: Bearer ' . $token,
        'Content-Type: application/json',
        'User-Agent: resume-portfolio-github-activity',
    ],
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_CONNECTTIMEOUT => 5,
    CURLOPT_TIMEOUT => 15,
    CURLOPT_FOLLOWLOCATION => false,
    CURLOPT_SSL_VERIFYPEER => true,
    CURLOPT_SSL_VERIFYHOST => 2,
]);

$responseBody = curl_exec($curl);
$httpStatus = (int) curl_getinfo($curl, CURLINFO_HTTP_CODE);
$curlError = curl_error($curl);
curl_close($curl);

if (!is_string($responseBody) || $httpStatus < 200 || $httpStatus >= 300) {
    error_log('GitHub activity request failed with HTTP status ' . $httpStatus . '. ' . $curlError);
    githubActivityFail($cached, 'GitHub activity could not be refreshed.');
}

$response = json_decode($responseBody, true);
if (!is_array($response) || !empty($response['errors'])) {
    error_log('GitHub activity GraphQL response was invalid or contained errors.');
    githubActivityFail($cached, 'GitHub returned an invalid activity response.');
}

$user = $response['data']['user'] ?? null;
if (!is_array($user)) {
    githubActivityFail($cached, 'The configured GitHub account could not be found.', 404);
}

$calendar = $user['contributionsCollection']['contributionCalendar'] ?? null;
if (!is_array($calendar) || !isset($calendar['weeks']) || !is_array($calendar['weeks'])) {
    githubActivityFail($cached, 'GitHub did not return a contribution calendar.');
}

$weeks = [];
foreach ($calendar['weeks'] as $week) {
    $days = [];
    foreach (($week['contributionDays'] ?? []) as $day) {
        if (!is_array($day)) {
            continue;
        }

        $date = (string) ($day['date'] ?? '');
        $weekday = filter_var($day['weekday'] ?? null, FILTER_VALIDATE_INT);
        if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $date) || $weekday === false || $weekday < 0 || $weekday > 6) {
            continue;
        }

        $color = (string) ($day['color'] ?? '');
        $days[] = [
            'date' => $date,
            'weekday' => $weekday,
            'contributionCount' => max(0, (int) ($day['contributionCount'] ?? 0)),
            'color' => preg_match('/^#[0-9a-fA-F]{6}$/', $color) === 1 ? $color : null,
        ];
    }

    if ($days !== []) {
        $weeks[] = [
            'firstDay' => (string) ($week['firstDay'] ?? $days[0]['date']),
            'contributionDays' => $days,
        ];
    }
}

if ($weeks === []) {
    githubActivityFail($cached, 'GitHub returned an empty contribution calendar.');
}

$colors = [];
foreach (($calendar['colors'] ?? []) as $color) {
    if (is_string($color) && preg_match('/^#[0-9a-fA-F]{6}$/', $color) === 1) {
        $colors[] = $color;
    }
}

$payload = [
    'login' => GITHUB_ACTIVITY_LOGIN,
    'totalContributions' => max(0, (int) ($calendar['totalContributions'] ?? 0)),
    'colors' => $colors,
    'weeks' => $weeks,
    'updatedAt' => gmdate('c'),
    'cacheStatus' => 'live',
];

$encodedCache = json_encode(
    $payload,
    JSON_UNESCAPED_SLASHES | JSON_INVALID_UTF8_SUBSTITUTE
);
if (is_string($encodedCache)) {
    $temporaryPath = $cachePath . '.tmp.' . getmypid();
    if (@file_put_contents($temporaryPath, $encodedCache, LOCK_EX) !== false) {
        if (!@rename($temporaryPath, $cachePath)) {
            @unlink($temporaryPath);
        }
    }
}

githubActivityRespond(200, $payload);
