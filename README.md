# inngest-report-api

A small Express API whose slow work happens in a **background job**. The endpoint answers instantly with `202 Accepted`, a status endpoint reports progress, and one **cron job** runs on the clock alone. Background jobs, retries and the cron schedule are handled by [Inngest](https://www.inngest.com/), with its local Dev Server and dashboard.

This is FlyRank Internship, Backend Track, Week 4, Assignment A7 ("Your first background job"). The pattern is: **accept fast, work in the background, report status.**

## How it works

1. `POST /reports` saves the report as `pending`, sends a `report/requested` event and returns `202` straight away.
2. The `make-report` function (started by that event) waits 8 seconds, standing in for a slow task such as an AI call, then builds the report and marks it `done`.
3. `GET /reports/:id` reports the current state, so a client can poll: first `pending`, later `done` (or `failed`).
4. The `heartbeat` function is started by a cron schedule, with no request involved, and logs how many reports are `pending`, `done` and `failed`.

Reports are kept in memory, so they disappear when the API restarts.

## Run it

Tested with Node v24.18.0 and npm 12 on Windows. You need two terminals, one for the API and one for the Inngest Dev Server, and both must stay open.

**Install** (once):

```
npm install
```

**Terminal 1: the API** (port 3000). Set `INNGEST_DEV=1` first, so the app connects to the local Dev Server.

PowerShell:

```
$env:INNGEST_DEV = "1"
node server.js
```

macOS, Linux or Git Bash:

```
INNGEST_DEV=1 node server.js
```

**Terminal 2: the Inngest Dev Server** (dashboard at http://localhost:8288):

```
npx inngest-cli dev -u http://localhost:3000/api/inngest
```

Then check it works:

```
curl -i http://localhost:3000/health
```

On Windows PowerShell, use `curl.exe` instead of `curl`.

If the Dev Server says "Inngest CLI binary not found", the package's install script was skipped. Run `npm rebuild --ignore-scripts=false inngest-cli` and start it again.

## Endpoints

| Method and path | What it does | Responses |
|---|---|---|
| `GET /health` | Confirms the server is alive | `200` with `{ "status": "ok" }` |
| `POST /reports` | Accepts `{ "topic": "cats" }`, saves the report as `pending` and sends the `report/requested` event | `202` with `{ "id": "...", "status": "pending" }`; `400` if `topic` is missing or empty |
| `GET /reports/:id` | Returns the saved report: `pending`, then `done` with a `result`, or `failed` with an `error` | `200` with the report; `404` for an unknown id |
| `/api/inngest` | Serves the Inngest functions so the Dev Server can find and run them (not for direct use) | n/a |

## Functions

| Function | Trigger | What it does |
|---|---|---|
| `say-hello` | Event `test/hello` | Sleeps 5 seconds, then returns "Hello from the background!" (used to prove Inngest is connected) |
| `make-report` | Event `report/requested` | Step `do-the-slow-work` sleeps 8 seconds, then step `build-report` saves the result with status `done`. A topic of `"fail"` throws on purpose to demonstrate retries. It has `retries: 2` (3 attempts in total), and an `onFailure` handler marks the report `failed` once the retries are used up |
| `heartbeat` | Cron `* * * * *` (every minute, for testing only) | Logs one line: `[heartbeat] pending: N, done: N, failed: N` |

## Proof: 202 now, done later

One request, then two polls of the same report. The `POST` took 0.021 seconds, even though the work takes about 8 seconds.

```
HTTP/1.1 202 Accepted
X-Powered-By: Express
Content-Type: application/json; charset=utf-8
Content-Length: 64
ETag: W/"40-br9a7P4DoZ9YH9VT7tm05Dikmg4"
Date: Sat, 17 Oct 2026 00:47:35 GMT
Connection: keep-alive
Keep-Alive: timeout=5

{"id":"59e8f3cc-94b4-4af6-886a-8aadb132129c","status":"pending"}
Total time: 0.021090s
```

Poll right away, status `pending`:

```
{"id":"59e8f3cc-94b4-4af6-886a-8aadb132129c","topic":"cats","status":"pending"}
```

Poll again 10 seconds later, status `done`:

```
{"id":"59e8f3cc-94b4-4af6-886a-8aadb132129c","topic":"cats","status":"done","result":"Report about cats: generated in the background."}
```

## Stage 3: retries versus bad input

A missing topic gets a 400 Bad Request because invalid input must be rejected immediately, whereas a valid request with a temporary background-processing failure deserves a retry, since a wrong input will fail the same way every time, but a wrong moment may pass on the next attempt.

A request with topic `"fail"` still returns `202`, because the endpoint cannot know the job will fail. In the dashboard the `build-report` step shows Attempt 0, Attempt 1 and Attempt 2 with growing waits between them (backoff), and the run ends as Failed.

![make-report run that failed after 3 attempts](stage-tests/stage3/build-report-failed-3-attempts.png)

![400 Bad Request for a missing topic](stage-tests/stage3/bad-input-400.png)

## Stage 4: the cron heartbeat

I checked `0 8 * * *` on Crontab.guru; it runs every day at 08:00, subject to the server's timezone.

I checked `0 22 * * 0` on Crontab.guru; it runs every Sunday at 22:00, subject to the server's timezone.

The heartbeat in this project uses `* * * * *` (every minute) only so it is easy to watch. The dashboard shows one run per minute, each logging its summary line.

![heartbeat runs one minute apart](stage-tests/stage4/heartbeat-runs.png)

![heartbeat log lines in the API terminal](stage-tests/stage4/heartbeat-log-lines.png)

## Dashboard screenshot

One Runs view showing a completed `make-report`, a failed `make-report` (with its `onFailure` run) and the `heartbeat` cron runs:

![Inngest dashboard with all runs](stage-tests/stage5/dashboard-all-runs.png)

Screenshots and output for every stage are collected in [EVIDENCE.md](EVIDENCE.md), with the images in the `stage-tests/` folder.

## Project files

| File | Purpose |
|---|---|
| `server.js` | Express app: `/health`, `POST /reports`, `GET /reports/:id` and the Inngest route |
| `inngest-client.js` | The Inngest client and the three functions |
| `reports-store.js` | The in-memory map of reports shared by the API and the functions |
| `EVIDENCE.md` | Every stage's checkpoint, commit and screenshots in one place |
| `stage-tests/` | The screenshots, one folder per stage |
