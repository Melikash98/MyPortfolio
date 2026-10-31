<?php
declare(strict_types=1);

define('WAKATIME_ACTIVITY_LIBRARY_ONLY', true);
require_once dirname(__DIR__) . DIRECTORY_SEPARATOR . 'wakatime-activity.php';

$checks = 0;

function expectWakaMatch(string $label, array $portfolioRecord, string $expectedWakaId, array $wakatimeProjects): void
{
    global $checks;
    $metadata = wakatimeProjectMetadata($portfolioRecord, (string) ($portfolioRecord['firebaseKey'] ?? 'fixture'));
    $result = wakatimeResolveProject($metadata, $wakatimeProjects);
    if (($result['status'] ?? '') !== 'matched' || wakatimeGetString($result['project'] ?? [], ['id']) !== $expectedWakaId) {
        throw new RuntimeException($label . ' did not resolve to the expected WakaTime project.');
    }
    $checks++;
}

function expectWakaStatus(string $label, array $portfolioRecord, string $expectedStatus, array $wakatimeProjects): void
{
    global $checks;
    $metadata = wakatimeProjectMetadata($portfolioRecord, (string) ($portfolioRecord['firebaseKey'] ?? 'fixture'));
    $result = wakatimeResolveProject($metadata, $wakatimeProjects);
    if (($result['status'] ?? '') !== $expectedStatus) {
        throw new RuntimeException($label . ' expected mapping status ' . $expectedStatus . '.');
    }
    $checks++;
}

function expectAutomaticBindingStatus(string $label, ?array $cachedRecord, array $metadata, string $resolvedWakaId, bool $expectedChanged): void
{
    global $checks;
    $changed = wakatimeAutomaticMappingChanged($cachedRecord, $metadata, $resolvedWakaId);
    if ($changed !== $expectedChanged) {
        throw new RuntimeException($label . ' returned an unexpected automatic-binding status.');
    }
    $checks++;
}

function expectWakaProjectNameUniqueness(string $label, array $projects, string $name, string $projectId, bool $expectedUnique): void
{
    global $checks;
    $unique = wakatimeProjectNameIsUnique($projects, $name, $projectId);
    if ($unique !== $expectedUnique) {
        throw new RuntimeException($label . ' returned an unexpected summary-name uniqueness result.');
    }
    $checks++;
}

function expectPortfolioLookup(string $label, array $records, string $requestedId, string $expectedRecordId): void
{
    global $checks;
    $result = wakatimeFindPortfolioProject($records, $requestedId);
    $actualRecordId = wakatimeGetString($result['record'] ?? [], ['id']);
    if (($result['status'] ?? '') !== 'matched' || $actualRecordId !== $expectedRecordId) {
        throw new RuntimeException($label . ' did not resolve to the expected Firebase record.');
    }
    $checks++;
}

$postGap = [
    'id' => 'project-postgap',
    'title' => 'PostGap',
    'githubLink' => 'https://github.com/Melikash98/PostGap.git',
    'page' => ['appName' => 'PostGap', 'sourceCodeUrl' => 'https://github.com/Melikash98/PostGap.git']
];
$brewBite = [
    'id' => 'project-brewbite',
    'title' => 'BrewBite',
    'githubLink' => 'https://github.com/Melikash98/BrewBiteApp',
    'page' => ['appName' => 'BrewBite', 'sourceCodeUrl' => 'https://github.com/Melikash98/BrewBiteApp']
];
$portfolio = [
    'id' => 'project-portfolio-website-2',
    'title' => 'Portfolio',
    'githubLink' => 'https://github.com/Melikash98/MyPortfolio',
    'page' => ['appName' => 'Portfolio', 'sourceCodeUrl' => 'https://github.com/Melikash98/MyPortfolio']
];
$wakatimeProjects = [
    ['id' => 'waka-postgap', 'name' => 'PostGap'],
    ['id' => 'waka-brewbite', 'name' => 'BrewBiteApp'],
    ['id' => 'waka-portfolio', 'name' => 'MyPortfolio'],
    ['id' => 'waka-unrelated', 'name' => 'PostGap Archive']
];

expectPortfolioLookup(
    'Firebase node key resolves separately from the record internal ID',
    ['project1' => $postGap],
    'project1',
    'project-postgap'
);

expectWakaMatch('PostGap repository match', $postGap, 'waka-postgap', $wakatimeProjects);
expectWakaMatch('BrewBite repository match', $brewBite, 'waka-brewbite', $wakatimeProjects);
expectWakaMatch('Portfolio repository match', $portfolio, 'waka-portfolio', $wakatimeProjects);

$renamedProject = $postGap;
$renamedProject['title'] = 'A renamed portfolio title';
$renamedProject['wakatimeProjectId'] = 'waka-postgap';
expectWakaMatch('Explicit mapping survives a portfolio title rename', $renamedProject, 'waka-postgap', $wakatimeProjects);

$renamedWithoutExplicitMapping = [
    'id' => 'project-postgap',
    'title' => 'PostGap Archive',
    'githubLink' => 'https://github.com/Melikash98/PostGapArchive'
];
$renamedMetadata = wakatimeProjectMetadata($renamedWithoutExplicitMapping, 'project10');
$newAutomaticMatch = wakatimeResolveProject($renamedMetadata, $wakatimeProjects);
expectAutomaticBindingStatus(
    'A changed automatic match requires explicit confirmation',
    ['projectId' => 'project-postgap', 'wakatimeProjectId' => 'waka-postgap'],
    $renamedMetadata,
    wakatimeGetString($newAutomaticMatch['project'] ?? [], ['id']),
    true
);

$ambiguousProject = ['id' => 'project-shared', 'title' => 'Shared Project'];
$ambiguousWakaProjects = [
    ['id' => 'waka-shared-one', 'name' => 'Shared Project'],
    ['id' => 'waka-shared-two', 'name' => 'Shared Project']
];
expectWakaStatus('Ambiguous exact name', $ambiguousProject, 'ambiguous', $ambiguousWakaProjects);
expectWakaStatus('Missing exact match', ['id' => 'project-new', 'title' => 'Unknown project'], 'missing', $wakatimeProjects);
expectWakaProjectNameUniqueness(
    'Explicit ID cannot make a duplicate WakaTime summary name safe',
    $ambiguousWakaProjects,
    'Shared Project',
    'waka-shared-one',
    false
);
expectWakaProjectNameUniqueness(
    'Distinct project names remain separately queryable',
    $wakatimeProjects,
    'PostGap',
    'waka-postgap',
    true
);

fwrite(STDOUT, 'WakaTime project mapping checks passed: ' . $checks . PHP_EOL);
