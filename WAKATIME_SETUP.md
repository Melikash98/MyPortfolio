# WakaTime project activity

The portfolio export currently stores projects at `webdatabase/projects/{firebaseKey}`. Each record has an internal `id`, `title`, `githubLink`, and nested `page.appName` / `page.sourceCodeUrl`; the supplied export has no WakaTime mapping field. The backend reads the current Firebase collection for every request and never accepts a WakaTime name from the browser.

## Firebase project mapping

The resolver first uses the stable WakaTime project ID, then exact and normalized project-name matches, explicit aliases, and exact/normalized repository matches as a fallback. If any matching stage resolves to more than one WakaTime project, the activity is unavailable until the record is mapped explicitly.

WakaTime's summaries endpoint filters by project name. If two WakaTime projects have the same normalized name, activity stays unavailable even when an ID mapping exists, because the summary request cannot safely separate those projects by ID. Rename one of the WakaTime projects to make its daily activity unambiguous.

After an automatically matched project has been synced, a later automatic match to a different WakaTime ID is rejected. Add `wakatimeProjectId` to explicitly confirm that reassignment. This prevents a renamed or edited portfolio record from silently switching to an unrelated project while its server cache is present.

Add this optional field to a Firebase project record when automatic matching is not unique or when a portfolio title may change:

```json
{
  "wakatimeProjectId": "<id from the WakaTime projects API>"
}
```

The smallest schema addition is `wakatimeProjectId`. An optional `wakatimeProjectAliases` string array is also supported for exact aliases:

```json
{
  "wakatimeProjectId": "<id from the WakaTime projects API>",
  "wakatimeProjectAliases": ["<exact WakaTime project name>"]
}
```

Both fields are additive, so existing records remain valid. The WakaTime project ID is read from the `id` field returned by `GET /api/v1/users/current/projects`. Do not use the portfolio's own `id` as the WakaTime ID.

## Server configuration

The PHP endpoint requires a server-side WakaTime OAuth access token with `read_summaries` and `read_stats.projects` scopes. WakaTime documents API keys as write-only and recommends OAuth access tokens for integrations. Never place the token in HTML, JavaScript, Firebase, or a publicly served config file.

Configure either:

- `WAKATIME_OAUTH_TOKEN` in the PHP server environment; or
- `wakatime-config.php` one directory above the web document root, returning `['wakatime_oauth_token' => '...']`.

Optional server settings:

- `FIREBASE_DATABASE_URL` overrides the existing portfolio database URL.
- `FIREBASE_DATABASE_AUTH_TOKEN` is used only if Firebase rules require authenticated server reads.
- `WAKATIME_TIMEZONE` sets the IANA timezone used for the rolling 365-day period; the default is `UTC`.

The server needs PHP cURL. `wakatime-activity.php` accepts only a portfolio `projectId` (or exact database slug), resolves the record from Firebase, maps it to WakaTime, and then requests that project's daily summaries. Successful responses are cached in the server temporary directory for 20 minutes. If WakaTime is temporarily unavailable, the endpoint can return the last successfully synced response with `cacheStatus: "stale"`; the frontend labels live, cached, and stale responses separately.

