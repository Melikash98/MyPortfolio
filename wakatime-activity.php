<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store, max-age=0, must-revalidate');
header('X-Content-Type-Options: nosniff');

const WAKATIME_ACTIVITY_CACHE_TTL = 1200;
const WAKATIME_ACTIVITY_DAYS = 365;
const WAKATIME_API_BASE = 'https://api.wakatime.com/api/v1';
const PORTFOLIO_FIREBASE_DATABASE_URL = 'https://portfolio-f66fb-default-rtdb.firebaseio.com';

function wakatimeRespond(int $status, array $payload): void
{
    http_response_code($status);
    $json = json_encode($payload, JSON_UNESCAPED_SLASHES | JSON_INVALID_UTF8_SUBSTITUTE);
    echo $json === false ? '{"error":"Unable to encode WakaTime activity response."}' : $json;
    exit;
}

function wakatimeReadCache(string $path): ?array
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
        || !isset($data['projectId'], $data['updatedAt'], $data['days'], $data['mappingFingerprint'])
        || !is_array($data['days'])
    ) {
        return null;
    }

    return $data;
}

function wakatimeCacheIsFresh(?array $data): bool
{
    if ($data === null || !isset($data['updatedAt'])) {
        return false;
    }

    $updatedAt = strtotime((string) $data['updatedAt']);
    if ($updatedAt === false) {
        return false;
    }

    $age = time() - $updatedAt;
    return $age >= 0 && $age < WAKATIME_ACTIVITY_CACHE_TTL;
}

function wakatimeReplyWithCache(array $cached, string $cacheStatus, string $requestedProjectId, array $currentProject): void
{
    unset($cached['mappingFingerprint']);
    $cached['requestedProjectId'] = $requestedProjectId;
    $cached['project'] = $currentProject;
    $cached['cacheStatus'] = $cacheStatus;
    $cached['statusMessage'] = $cacheStatus === 'stale'
        ? 'WakaTime could not be refreshed. Showing the last successfully synced activity.'
        : 'Showing the last successfully synced WakaTime activity.';
    wakatimeRespond(200, $cached);
}

function wakatimeGetString(array $record, array $keys): string
{
    foreach ($keys as $key) {
        if (!array_key_exists($key, $record) || !is_scalar($record[$key])) {
            continue;
        }
        $value = trim((string) $record[$key]);
        if ($value !== '') {
            return $value;
        }
    }
    return '';
}

function wakatimeNormalizeName(string $value): string
{
    $value = trim($value);
    if (function_exists('mb_strtolower')) {
        $value = mb_strtolower($value, 'UTF-8');
    } else {
        $value = strtolower($value);
    }

    $normalized = preg_replace('/[^\p{L}\p{N}]+/u', '', $value);
    if (is_string($normalized)) {
        return $normalized;
    }

    return preg_replace('/[^a-z0-9]+/i', '', strtolower($value)) ?? '';
}

function wakatimeAddCandidate(array &$items, $value): void
{
    if (!is_string($value) && !is_numeric($value)) {
        return;
    }
    $value = trim((string) $value);
    if ($value !== '' && !in_array($value, $items, true)) {
        $items[] = $value;
    }
}

function wakatimeRepoNameFromUrl(string $value): string
{
    $value = trim($value);
    if ($value === '') {
        return '';
    }

    if (preg_match('/^[^@\s]+@github\.com:([^\/]+)\/([^\/\s]+)$/i', $value, $match) === 1) {
        $repository = $match[2];
    } else {
        $parts = parse_url($value);
        $host = strtolower((string) ($parts['host'] ?? ''));
        if ($host !== 'github.com' && $host !== 'www.github.com') {
            return '';
        }
        $segments = array_values(array_filter(explode('/', trim((string) ($parts['path'] ?? ''), '/')), 'strlen'));
        if (count($segments) < 2) {
            return '';
        }
        $repository = rawurldecode($segments[1]);
    }

    return preg_replace('/\.git$/i', '', trim($repository)) ?? '';
}

function wakatimeProjectMetadata(array $project, string $firebaseKey): array
{
    $page = is_array($project['page'] ?? null) ? $project['page'] : [];
    $popup = is_array($project['popup'] ?? null) ? $project['popup'] : [];
    $wakatime = is_array($project['wakatime'] ?? null) ? $project['wakatime'] : [];
    $projectId = wakatimeGetString($project, ['id', 'recordId', 'cardId']) ?: $firebaseKey;

    $title = wakatimeGetString($project, ['title', 'projectTitle', 'projectName', 'name']);
    if ($title === '') {
        $title = wakatimeGetString($page, ['appName', 'title']);
    }
    if ($title === '') {
        $title = wakatimeGetString($popup, ['title']);
    }
    if ($title === '') {
        $title = 'Project coding activity';
    }

    $names = [];
    foreach ([
        wakatimeGetString($project, ['title', 'projectTitle', 'projectName', 'name']),
        wakatimeGetString($page, ['appName', 'title']),
        wakatimeGetString($popup, ['title']),
        wakatimeGetString($project, ['slug']),
        wakatimeGetString($page, ['slug', 'projectSlug'])
    ] as $candidate) {
        wakatimeAddCandidate($names, $candidate);
    }

    $mainTitle = trim(
        wakatimeGetString($page, ['titleMain']) . ' ' . wakatimeGetString($page, ['titleAccent'])
    );
    wakatimeAddCandidate($names, $mainTitle);

    $repositories = [];
    foreach ([$project, $page, $popup] as $record) {
        foreach (['repoName', 'repositoryName', 'repository', 'repo'] as $field) {
            $repository = $record[$field] ?? null;
            if (is_string($repository)) {
                wakatimeAddCandidate($repositories, preg_replace('/\.git$/i', '', trim($repository)));
            } elseif (is_array($repository)) {
                wakatimeAddCandidate($repositories, wakatimeGetString($repository, ['name', 'fullName', 'full_name']));
            }
        }
    }

    $repositoryUrls = [
        wakatimeGetString($project, ['githubLink', 'sourceCodeUrl', 'repositoryUrl']),
        wakatimeGetString($page, ['githubLink', 'sourceCodeUrl', 'repositoryUrl']),
        wakatimeGetString($popup, ['githubLink'])
    ];
    foreach ($repositoryUrls as $repositoryUrl) {
        wakatimeAddCandidate($repositories, wakatimeRepoNameFromUrl($repositoryUrl));
    }

    foreach ([$project['githubLink'] ?? null, $page['projectLinks'] ?? null] as $linkCollection) {
        if (!is_array($linkCollection)) {
            continue;
        }
        $iterator = isset($linkCollection['url']) || isset($linkCollection['href'])
            ? [$linkCollection]
            : $linkCollection;
        foreach ($iterator as $link) {
            if (!is_array($link)) {
                continue;
            }
            $url = wakatimeGetString($link, ['githubLink', 'sourceCodeUrl', 'repositoryUrl', 'url', 'href']);
            wakatimeAddCandidate($repositories, wakatimeRepoNameFromUrl($url));
        }
    }

    $aliases = [];
    foreach ([
        $project['wakatimeProjectAliases'] ?? null,
        $wakatime['aliases'] ?? null
    ] as $aliasList) {
        if (is_string($aliasList)) {
            wakatimeAddCandidate($aliases, $aliasList);
        } elseif (is_array($aliasList)) {
            foreach ($aliasList as $alias) {
                wakatimeAddCandidate($aliases, $alias);
            }
        }
    }

    $explicitWakaId = wakatimeGetString($project, ['wakatimeProjectId', 'wakaTimeProjectId']);
    if ($explicitWakaId === '') {
        $explicitWakaId = wakatimeGetString($wakatime, ['projectId', 'id']);
    }

    sort($names, SORT_STRING);
    sort($repositories, SORT_STRING);
    sort($aliases, SORT_STRING);

    $fingerprintSource = $explicitWakaId !== ''
        ? ['projectId' => $projectId, 'wakatimeProjectId' => $explicitWakaId]
        : ['projectId' => $projectId, 'names' => $names, 'repositories' => $repositories, 'aliases' => $aliases];

    return [
        'id' => $projectId,
        'title' => $title,
        'names' => $names,
        'repositories' => $repositories,
        'aliases' => $aliases,
        'wakatimeProjectId' => $explicitWakaId,
        'mappingFingerprint' => hash('sha256', json_encode($fingerprintSource, JSON_UNESCAPED_SLASHES) ?: '')
    ];
}

function wakatimeFindPortfolioProject(array $projects, string $requestedId): array
{
    $matches = [];
    foreach ($projects as $key => $project) {
        if (!is_array($project)) {
            continue;
        }
        $page = is_array($project['page'] ?? null) ? $project['page'] : [];
        $identifiers = [
            (string) $key,
            wakatimeGetString($project, ['id', 'recordId', 'cardId']),
            wakatimeGetString($project, ['slug']),
            wakatimeGetString($page, ['projectId', 'slug', 'projectSlug'])
        ];
        if (in_array($requestedId, $identifiers, true)) {
            $matches[(string) $key] = $project;
        }
    }

    if (count($matches) === 0) {
        return ['status' => 'missing'];
    }
    if (count($matches) > 1) {
        return ['status' => 'ambiguous'];
    }

    $key = (string) array_key_first($matches);
    return ['status' => 'matched', 'key' => $key, 'record' => $matches[$key]];
}

function wakatimeUniqueMatch(array $matches): array
{
    $unique = [];
    foreach ($matches as $project) {
        if (!is_array($project)) {
            continue;
        }
        $id = wakatimeGetString($project, ['id']);
        $name = wakatimeGetString($project, ['name']);
        if ($id === '' || $name === '') {
            continue;
        }
        $unique[$id] = $project;
    }

    if (count($unique) === 0) {
        return ['status' => 'missing'];
    }
    if (count($unique) > 1) {
        return ['status' => 'ambiguous'];
    }

    $project = reset($unique);
    return ['status' => 'matched', 'project' => $project];
}

function wakatimeProjectNameIsUnique(array $projects, string $name, string $projectId): bool
{
    $normalizedName = wakatimeNormalizeName($name);
    foreach ($projects as $project) {
        if (!is_array($project)) {
            continue;
        }
        $candidateId = wakatimeGetString($project, ['id']);
        $candidateName = wakatimeGetString($project, ['name']);
        if (
            $candidateId !== ''
            && $candidateId !== $projectId
            && $candidateName !== ''
            && wakatimeNormalizeName($candidateName) === $normalizedName
        ) {
            return false;
        }
    }
    return true;
}

function wakatimeResolveProject(array $portfolio, array $wakatimeProjects): array
{
    $explicitId = (string) ($portfolio['wakatimeProjectId'] ?? '');
    if ($explicitId !== '') {
        $matches = array_values(array_filter($wakatimeProjects, static function ($project) use ($explicitId): bool {
            return is_array($project) && wakatimeGetString($project, ['id']) === $explicitId;
        }));
        $result = wakatimeUniqueMatch($matches);
        $result['source'] = 'explicit_id';
        return $result;
    }

    $exactNameMatches = [];
    foreach ($wakatimeProjects as $project) {
        if (!is_array($project)) {
            continue;
        }
        $wakaName = wakatimeGetString($project, ['name']);
        foreach ($portfolio['names'] as $candidate) {
            if (strcasecmp(trim($candidate), $wakaName) === 0) {
                $exactNameMatches[] = $project;
                break;
            }
        }
    }
    if ($exactNameMatches !== []) {
        $result = wakatimeUniqueMatch($exactNameMatches);
        $result['source'] = 'name_exact';
        return $result;
    }

    $normalizedNameMatches = [];
    foreach ($wakatimeProjects as $project) {
        if (!is_array($project)) {
            continue;
        }
        $wakaName = wakatimeGetString($project, ['name']);
        foreach ($portfolio['names'] as $candidate) {
            $normalizedCandidate = wakatimeNormalizeName($candidate);
            if ($normalizedCandidate !== '' && $normalizedCandidate === wakatimeNormalizeName($wakaName)) {
                $normalizedNameMatches[] = $project;
                break;
            }
        }
    }
    if ($normalizedNameMatches !== []) {
        $result = wakatimeUniqueMatch($normalizedNameMatches);
        $result['source'] = 'name_normalized';
        return $result;
    }

    foreach ([false, true] as $normalized) {
        $aliasMatches = [];
        foreach ($wakatimeProjects as $project) {
            if (!is_array($project)) {
                continue;
            }
            $wakaName = wakatimeGetString($project, ['name']);
            foreach ($portfolio['aliases'] as $alias) {
                $matches = $normalized
                    ? wakatimeNormalizeName($alias) !== ''
                        && wakatimeNormalizeName($alias) === wakatimeNormalizeName($wakaName)
                    : strcasecmp(trim($alias), $wakaName) === 0;
                if ($matches) {
                    $aliasMatches[] = $project;
                    break;
                }
            }
        }
        if ($aliasMatches !== []) {
            $result = wakatimeUniqueMatch($aliasMatches);
            $result['source'] = $normalized ? 'alias_normalized' : 'alias_exact';
            return $result;
        }
    }

    $repoMatches = [];
    $normalizedRepoMatches = [];
    foreach ($wakatimeProjects as $project) {
        if (!is_array($project)) {
            continue;
        }
        $wakaName = wakatimeGetString($project, ['name']);
        $wakaRepository = wakatimeGetString($project, ['repository']);
        $wakaRepoName = wakatimeRepoNameFromUrl($wakaRepository);
        $targets = array_values(array_filter([$wakaName, $wakaRepository, $wakaRepoName], 'strlen'));
        foreach ($portfolio['repositories'] as $candidate) {
            foreach ($targets as $target) {
                if (strcasecmp(trim($candidate), trim($target)) === 0) {
                    $repoMatches[] = $project;
                    continue 3;
                }
            }
        }
        foreach ($portfolio['repositories'] as $candidate) {
            $normalizedCandidate = wakatimeNormalizeName($candidate);
            if ($normalizedCandidate === '') {
                continue;
            }
            foreach ($targets as $target) {
                if ($normalizedCandidate === wakatimeNormalizeName($target)) {
                    $normalizedRepoMatches[] = $project;
                    continue 3;
                }
            }
        }
    }
    if ($repoMatches !== []) {
        $result = wakatimeUniqueMatch($repoMatches);
        $result['source'] = 'repository_exact';
        return $result;
    }
    if ($normalizedRepoMatches !== []) {
        $result = wakatimeUniqueMatch($normalizedRepoMatches);
        $result['source'] = 'repository_normalized';
        return $result;
    }

    return ['status' => 'missing'];
}

function wakatimeHttpGet(string $url, array $headers): array
{
    if (!function_exists('curl_init')) {
        return ['ok' => false, 'status' => 0, 'json' => null, 'reason' => 'PHP cURL is not available.'];
    }

    $curl = curl_init($url);
    if ($curl === false) {
        return ['ok' => false, 'status' => 0, 'json' => null, 'reason' => 'Unable to initialize the HTTP client.'];
    }

    curl_setopt_array($curl, [
        CURLOPT_HTTPGET => true,
        CURLOPT_HTTPHEADER => array_merge(['Accept: application/json'], $headers),
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_CONNECTTIMEOUT => 5,
        CURLOPT_TIMEOUT => 20,
        CURLOPT_FOLLOWLOCATION => false,
        CURLOPT_SSL_VERIFYPEER => true,
        CURLOPT_SSL_VERIFYHOST => 2
    ]);

    $body = curl_exec($curl);
    $status = (int) curl_getinfo($curl, CURLINFO_HTTP_CODE);
    $error = curl_error($curl);

    $json = is_string($body) ? json_decode($body, true) : null;
    $ok = is_array($json) && $status >= 200 && $status < 300;
    return [
        'ok' => $ok,
        'status' => $status,
        'json' => is_array($json) ? $json : null,
        'reason' => $ok ? '' : ($error !== '' ? $error : 'Remote service returned HTTP ' . $status . '.')
    ];
}

function wakatimeGetDatabaseUrl(): string
{
    $configured = getenv('FIREBASE_DATABASE_URL');
    $url = is_string($configured) && trim($configured) !== ''
        ? trim($configured)
        : PORTFOLIO_FIREBASE_DATABASE_URL;
    return rtrim($url, '/');
}

function wakatimeFetchPortfolioProjects(): array
{
    $url = wakatimeGetDatabaseUrl() . '/webdatabase/projects.json';
    $databaseToken = getenv('FIREBASE_DATABASE_AUTH_TOKEN');
    if (is_string($databaseToken) && trim($databaseToken) !== '') {
        $url .= '?' . http_build_query(['auth' => trim($databaseToken)], '', '&', PHP_QUERY_RFC3986);
    }

    $response = wakatimeHttpGet($url, []);
    if (!$response['ok'] || !is_array($response['json'])) {
        error_log(
            'WakaTime activity could not read the Portfolio project collection. HTTP '
            . $response['status'] . '. ' . $response['reason']
        );
        return ['ok' => false, 'projects' => []];
    }

    return ['ok' => true, 'projects' => $response['json']];
}

function wakatimeGetOAuthToken(array $privateConfig): string
{
    $token = getenv('WAKATIME_OAUTH_TOKEN');
    if (is_string($token) && trim($token) !== '') {
        return trim($token);
    }

    $token = $privateConfig['wakatime_oauth_token'] ?? '';
    return is_string($token) ? trim($token) : '';
}

function wakatimeLoadPrivateConfig(): array
{
    $privatePath = dirname(__DIR__) . DIRECTORY_SEPARATOR . 'wakatime-config.php';
    if (!is_file($privatePath) || !is_readable($privatePath)) {
        return [];
    }

    $config = require $privatePath;
    return is_array($config) ? $config : [];
}

function wakatimeFetchProjectList(string $oauthToken): array
{
    $response = wakatimeHttpGet(
        WAKATIME_API_BASE . '/users/current/projects',
        ['Authorization: Bearer ' . $oauthToken, 'User-Agent: portfolio-wakatime-activity']
    );
    $projects = $response['json']['data'] ?? null;
    if (!$response['ok'] || !is_array($projects)) {
        error_log('WakaTime project list request failed with HTTP ' . $response['status'] . '.');
        return ['ok' => false, 'projects' => []];
    }

    return ['ok' => true, 'projects' => $projects];
}

function wakatimeFetchSummaries(string $oauthToken, string $projectName, DateTimeImmutable $start, DateTimeImmutable $end, string $timezoneName): array
{
    $query = http_build_query([
        'start' => $start->format('Y-m-d'),
        'end' => $end->format('Y-m-d'),
        'project' => $projectName,
        'timezone' => $timezoneName,
        'writes_only' => 'false'
    ], '', '&', PHP_QUERY_RFC3986);
    $url = WAKATIME_API_BASE . '/users/current/summaries?' . $query;
    $response = wakatimeHttpGet(
        $url,
        ['Authorization: Bearer ' . $oauthToken, 'User-Agent: portfolio-wakatime-activity']
    );

    $summaries = $response['json']['data'] ?? null;
    if (!$response['ok'] || !is_array($summaries)) {
        error_log('WakaTime project summaries request failed with HTTP ' . $response['status'] . '.');
        return ['ok' => false, 'days' => []];
    }

    $dailySeconds = [];
    $validRows = 0;
    foreach ($summaries as $summary) {
        if (!is_array($summary)) {
            continue;
        }
        $range = is_array($summary['range'] ?? null) ? $summary['range'] : [];
        $date = (string) ($range['date'] ?? $summary['date'] ?? '');
        if (preg_match('/^\d{4}-\d{2}-\d{2}$/', $date) !== 1) {
            continue;
        }
        $validRows++;

        $grandTotal = is_array($summary['grand_total'] ?? null) ? $summary['grand_total'] : [];
        $seconds = max(0.0, (float) ($grandTotal['total_seconds'] ?? 0));
        $projectBreakdown = is_array($summary['projects'] ?? null) ? $summary['projects'] : [];
        if ($projectBreakdown === [] && $seconds > 0) {
            return ['ok' => false, 'days' => [], 'reason' => 'WakaTime did not provide a project breakdown for a non-zero daily total.'];
        }
        if ($projectBreakdown !== []) {
            $matchedSeconds = 0.0;
            $matchedProject = false;
            foreach ($projectBreakdown as $projectItem) {
                if (!is_array($projectItem)) {
                    continue;
                }
                $returnedName = wakatimeGetString($projectItem, ['name']);
                if ($returnedName !== '' && strcasecmp(trim($returnedName), $projectName) === 0) {
                    $matchedProject = true;
                    $matchedSeconds += max(0.0, (float) ($projectItem['total_seconds'] ?? 0));
                }
            }

            if ($matchedProject) {
                $seconds = $matchedSeconds;
            } elseif ($seconds > 0) {
                return ['ok' => false, 'days' => [], 'reason' => 'The returned summaries did not match the resolved WakaTime project.'];
            }
        }

        $dailySeconds[$date] = $seconds;
    }

    if ($summaries !== [] && $validRows === 0) {
        return ['ok' => false, 'days' => [], 'reason' => 'WakaTime returned malformed daily summaries.'];
    }

    $days = [];
    for ($offset = 0; $offset < WAKATIME_ACTIVITY_DAYS; $offset++) {
        $day = $start->modify('+' . $offset . ' days');
        $date = $day->format('Y-m-d');
        $days[] = [
            'date' => $date,
            'seconds' => round((float) ($dailySeconds[$date] ?? 0), 2)
        ];
    }

    return ['ok' => true, 'days' => $days];
}

function wakatimeCacheMatches(?array $cache, array $metadata): bool
{
    return $cache !== null
        && (string) ($cache['projectId'] ?? '') === (string) $metadata['id']
        && hash_equals((string) $metadata['mappingFingerprint'], (string) ($cache['mappingFingerprint'] ?? ''));
}

function wakatimeAutomaticMappingChanged(?array $cache, array $metadata, string $resolvedWakatimeId): bool
{
    if ($cache === null || (string) ($metadata['wakatimeProjectId'] ?? '') !== '') {
        return false;
    }

    $cachedWakatimeId = (string) ($cache['wakatimeProjectId'] ?? '');
    return (string) ($cache['projectId'] ?? '') === (string) ($metadata['id'] ?? '')
        && $cachedWakatimeId !== ''
        && $cachedWakatimeId !== $resolvedWakatimeId;
}

function wakatimeGetCurrentTimezone(): string
{
    $configured = getenv('WAKATIME_TIMEZONE');
    $timezoneName = is_string($configured) && trim($configured) !== '' ? trim($configured) : 'UTC';
    try {
        new DateTimeZone($timezoneName);
    } catch (Exception $error) {
        return 'UTC';
    }
    return $timezoneName;
}

if (defined('WAKATIME_ACTIVITY_LIBRARY_ONLY') && WAKATIME_ACTIVITY_LIBRARY_ONLY === true) {
    return;
}

if (strtoupper((string) ($_SERVER['REQUEST_METHOD'] ?? 'GET')) !== 'GET') {
    header('Allow: GET');
    wakatimeRespond(405, ['errorCode' => 'method_not_allowed', 'message' => 'Only GET requests are supported.']);
}

$requestedProjectId = trim((string) ($_GET['projectId'] ?? $_GET['slug'] ?? ''));
if ($requestedProjectId === '' || preg_match('/^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$/', $requestedProjectId) !== 1) {
    wakatimeRespond(400, ['errorCode' => 'invalid_project_id', 'message' => 'A valid Portfolio project ID or slug is required.']);
}

$database = wakatimeFetchPortfolioProjects();
if (!$database['ok']) {
    wakatimeRespond(502, ['errorCode' => 'database_unavailable', 'message' => 'Portfolio project data is temporarily unavailable.']);
}

$recordResult = wakatimeFindPortfolioProject($database['projects'], $requestedProjectId);
if ($recordResult['status'] === 'missing') {
    wakatimeRespond(404, ['errorCode' => 'project_not_found', 'message' => 'No Portfolio project matches this ID or slug.']);
}
if ($recordResult['status'] === 'ambiguous') {
    wakatimeRespond(409, ['errorCode' => 'portfolio_id_ambiguous', 'message' => 'This Portfolio project ID or slug is not unique.']);
}

$metadata = wakatimeProjectMetadata($recordResult['record'], $recordResult['key']);
$responseProject = ['id' => $metadata['id'], 'title' => $metadata['title']];
$cacheKey = hash('sha256', __DIR__ . ':' . $metadata['id']);
$cachePath = rtrim(sys_get_temp_dir(), DIRECTORY_SEPARATOR)
    . DIRECTORY_SEPARATOR . 'wakatime-activity-' . $cacheKey . '.json';
$cached = wakatimeReadCache($cachePath);
$cacheMatches = wakatimeCacheMatches($cached, $metadata);

if ($cacheMatches && wakatimeCacheIsFresh($cached)) {
    wakatimeReplyWithCache($cached, 'cached', $requestedProjectId, $responseProject);
}

$lockHandle = @fopen($cachePath . '.lock', 'c');
if (is_resource($lockHandle)) {
    @flock($lockHandle, LOCK_EX);
}

$cached = wakatimeReadCache($cachePath);
$cacheMatches = wakatimeCacheMatches($cached, $metadata);
if ($cacheMatches && wakatimeCacheIsFresh($cached)) {
    wakatimeReplyWithCache($cached, 'cached', $requestedProjectId, $responseProject);
}

$privateConfig = wakatimeLoadPrivateConfig();
$oauthToken = wakatimeGetOAuthToken($privateConfig);
if ($oauthToken === '' || preg_match('/[\r\n]/', $oauthToken) === 1) {
    if ($cacheMatches) {
        wakatimeReplyWithCache($cached, 'stale', $requestedProjectId, $responseProject);
    }
    wakatimeRespond(503, [
        'errorCode' => 'wakatime_not_configured',
        'message' => 'The server WakaTime OAuth token is not configured.',
        'project' => $responseProject
    ]);
}

$wakatimeProjectList = wakatimeFetchProjectList($oauthToken);
if (!$wakatimeProjectList['ok']) {
    if ($cacheMatches) {
        wakatimeReplyWithCache($cached, 'stale', $requestedProjectId, $responseProject);
    }
    wakatimeRespond(502, [
        'errorCode' => 'wakatime_projects_unavailable',
        'message' => 'WakaTime project information is temporarily unavailable.',
        'project' => $responseProject
    ]);
}

$mapping = wakatimeResolveProject($metadata, $wakatimeProjectList['projects']);
if ($mapping['status'] !== 'matched') {
    $ambiguous = $mapping['status'] === 'ambiguous';
    wakatimeRespond($ambiguous ? 409 : 404, [
        'errorCode' => $ambiguous ? 'wakatime_mapping_ambiguous' : 'wakatime_mapping_missing',
        'message' => $ambiguous
            ? 'More than one WakaTime project matches this Portfolio record. Add its wakatimeProjectId in Firebase.'
            : 'No WakaTime project matches this Portfolio record. Add wakatimeProjectId or a verified exact alias in Firebase.',
        'project' => $responseProject
    ]);
}

$wakatimeProject = $mapping['project'];
$wakatimeProjectId = wakatimeGetString($wakatimeProject, ['id']);
$wakatimeProjectName = wakatimeGetString($wakatimeProject, ['name']);
if ($wakatimeProjectId === '' || $wakatimeProjectName === '') {
    wakatimeRespond(502, [
        'errorCode' => 'wakatime_project_invalid',
        'message' => 'The matched WakaTime project did not include a valid project ID and name.',
        'project' => $responseProject
    ]);
}

if (!wakatimeProjectNameIsUnique($wakatimeProjectList['projects'], $wakatimeProjectName, $wakatimeProjectId)) {
    wakatimeRespond(409, [
        'errorCode' => 'wakatime_activity_name_ambiguous',
        'message' => 'Multiple WakaTime projects share this name. Rename them so project summaries can be isolated safely.',
        'project' => $responseProject
    ]);
}

if (wakatimeAutomaticMappingChanged($cached, $metadata, $wakatimeProjectId)) {
    wakatimeRespond(409, [
        'errorCode' => 'wakatime_mapping_changed',
        'message' => 'This Portfolio record now matches a different WakaTime project. Add its wakatimeProjectId in Firebase to confirm the new mapping.',
        'project' => $responseProject
    ]);
}

if (
    $cacheMatches
    && (string) ($cached['wakatimeProjectId'] ?? '') === $wakatimeProjectId
    && !wakatimeCacheIsFresh($cached)
) {
    $cachedForFallback = $cached;
} else {
    $cachedForFallback = null;
}

$timezoneName = wakatimeGetCurrentTimezone();
$timezone = new DateTimeZone($timezoneName);
$endDate = new DateTimeImmutable('today', $timezone);
$startDate = $endDate->modify('-' . (WAKATIME_ACTIVITY_DAYS - 1) . ' days');
$summaryResult = wakatimeFetchSummaries(
    $oauthToken,
    $wakatimeProjectName,
    $startDate,
    $endDate,
    $timezoneName
);

if (!$summaryResult['ok']) {
    if ($cachedForFallback !== null) {
        wakatimeReplyWithCache($cachedForFallback, 'stale', $requestedProjectId, $responseProject);
    }
    wakatimeRespond(502, [
        'errorCode' => 'wakatime_summaries_unavailable',
        'message' => 'Activity for this WakaTime project is temporarily unavailable.',
        'project' => $responseProject
    ]);
}

$payload = [
    'projectId' => $metadata['id'],
    'requestedProjectId' => $requestedProjectId,
    'project' => $responseProject,
    'wakatimeProjectId' => $wakatimeProjectId,
    'wakatimeProjectName' => $wakatimeProjectName,
    'mappingSource' => $mapping['source'] ?? 'unknown',
    'period' => [
        'startDate' => $startDate->format('Y-m-d'),
        'endDate' => $endDate->format('Y-m-d'),
        'timezone' => $timezoneName
    ],
    'days' => $summaryResult['days'],
    'updatedAt' => gmdate('c'),
    'cacheStatus' => 'live',
    'mappingFingerprint' => $metadata['mappingFingerprint']
];

$encodedCache = json_encode($payload, JSON_UNESCAPED_SLASHES | JSON_INVALID_UTF8_SUBSTITUTE);
if (is_string($encodedCache)) {
    $temporaryPath = $cachePath . '.tmp.' . getmypid();
    if (@file_put_contents($temporaryPath, $encodedCache, LOCK_EX) !== false) {
        if (!@rename($temporaryPath, $cachePath)) {
            @unlink($temporaryPath);
        }
    }
}

if (is_resource($lockHandle)) {
    @flock($lockHandle, LOCK_UN);
    @fclose($lockHandle);
}

unset($payload['mappingFingerprint']);
$payload['statusMessage'] = 'Live activity received from WakaTime.';
wakatimeRespond(200, $payload);
