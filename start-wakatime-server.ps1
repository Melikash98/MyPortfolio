param(
    [ValidateRange(1024, 65535)]
    [int] $Port = 8000
)

$ErrorActionPreference = 'Stop'

$temporaryPhp = Join-Path ([System.IO.Path]::GetTempPath()) 'codex-wakatime-php-8.5.12\php.exe'
if (Test-Path -LiteralPath $temporaryPhp) {
    $phpPath = $temporaryPhp
} else {
    $phpCommand = Get-Command php -ErrorAction SilentlyContinue
    if ($null -eq $phpCommand) {
        throw 'PHP was not found. Install PHP with the cURL extension, then run this script again.'
    }
    $phpPath = $phpCommand.Source
}

$phpModules = & $phpPath -m 2>&1
if ($LASTEXITCODE -ne 0 -or $phpModules -notcontains 'curl') {
    throw 'PHP cURL is required. Enable the curl extension in php.ini, then run this script again.'
}

$tokenText = [Environment]::GetEnvironmentVariable('WAKATIME_OAUTH_TOKEN', 'Process')
$tokenWasEnteredHere = $false
$tokenBuffer = [IntPtr]::Zero

if ([string]::IsNullOrWhiteSpace($tokenText)) {
    $secureToken = Read-Host 'Enter WakaTime OAuth token (input is hidden)' -AsSecureString
    if ($secureToken.Length -eq 0) {
        throw 'A WakaTime OAuth token is required to load live project activity.'
    }

    $tokenBuffer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secureToken)
    try {
        $tokenText = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($tokenBuffer)
    } finally {
        [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($tokenBuffer)
        $tokenBuffer = [IntPtr]::Zero
    }

    [Environment]::SetEnvironmentVariable('WAKATIME_OAUTH_TOKEN', $tokenText, 'Process')
    $tokenWasEnteredHere = $true
}

try {
    Write-Host "PHP server listening at http://127.0.0.1:$Port/"
    Write-Host 'Open html/projects.html with the project id in the query string.'
    & $phpPath -S "127.0.0.1:$Port" -t $PSScriptRoot
} finally {
    if ($tokenWasEnteredHere) {
        [Environment]::SetEnvironmentVariable('WAKATIME_OAUTH_TOKEN', $null, 'Process')
        $tokenText = $null
    }
}
