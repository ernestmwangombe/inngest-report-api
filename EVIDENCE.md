# Evidence

Proof for each stage of the Inngest report API (FlyRank A7, "Your first background job"): what the checkpoint asked for, and the screenshots that show it. All images are in the `stage-tests/` folder. See the [README](README.md) for how to run the project.

## Commit history

One commit per stage, using the commit messages from the assignment.

| Stage | Commit | Message |
|---|---|---|
| 0 | `dbc362c` | Stage 0: hello server |
| 1 | `d956a3f` | Stage 1: Inngest connected, first function runs |
| 2 | `f83609c` | Stage 2: 202 + background job + status endpoint |
| 3 | `20bd90b` | Stage 3: retries seen, bad input rejected |
| 4 | `32834a9` | Stage 4: cron heartbeat |
| 5 | | The commit that adds the README and this file |

## Stage 0: Hello, server

**Checkpoint:** `curl -i http://localhost:3000/health` returns status `200` and `{"status":"ok"}`.

Evidence: there is no screenshot for this stage. The terminal output was:

```
HTTP/1.1 200 OK
X-Powered-By: Express
Content-Type: application/json; charset=utf-8
Content-Length: 15
ETag: W/"f-VaSQ4oDUiZblZNAEkkN+sX+q3Sg"
Date: Fri, 16 Oct 2026 00:14:57 GMT
Connection: keep-alive
Keep-Alive: timeout=5

{"status":"ok"}
```

## Stage 1: Connect Inngest

**Checkpoint:** the dashboard shows a run of `say-hello` with the 5-second sleep step, ending Completed.

![Inngest Dev Server running](stage-tests/stage1/inngest-dev-server-running.png)
The Inngest Dev Server started with `npx inngest-cli dev -u http://localhost:3000/api/inngest`. It reports "Inngest Dev Server online" on port 8288 and then "apps synced".

![Node API server running](stage-tests/stage1/node-server-running.png)
The Express API started with `$env:INNGEST_DEV = "1"` and `node server.js`, printing "Server running on http://localhost:3000". The earlier lines are previous restarts of the same server.

![say-hello function registered](stage-tests/stage1/say-hello-function-registered.png)
The dashboard's Apps page: the `report-api` app was found at `http://localhost:3000/api/inngest` (Express, JavaScript SDK v4.24.0) with "1 function found: say-hello".

![say-hello run completed](stage-tests/stage1/say-hello-run-completed.png)
A `say-hello` run (started with the Invoke button) ending Completed. The trace shows the `wait-five-seconds` step taking 5.000 seconds.

## Stage 2: The fast door

**Checkpoint:** `POST /reports` returns `202` in well under a second; `GET /reports/:id` says `pending`, then about 10 seconds later `done`; an unknown id returns `404`.

![report/requested event](stage-tests/stage2/report-requested-event.png)
The `report/requested` event sent by the endpoint, carrying the report `id` and `topic`, with `make-report` triggered by it.

![make-report run in progress](stage-tests/stage2/make-report-run-in-progress.png)
The `make-report` run while it is still working: the `do-the-slow-work` step is counting.

![make-report run completed](stage-tests/stage2/make-report-run-completed.png)
The same kind of run completed, with `do-the-slow-work` (about 8 seconds) followed by `build-report`.

The `202`, `pending` and `done` responses are pasted in the README under "Proof: 202 now, done later".

## Stage 3: Retries, and bad input rejected

**Checkpoint:** a run with topic `"fail"` shows 3 attempts and ends Failed; a request with no topic returns `400` and creates no job.

![build-report failed after 3 attempts](stage-tests/stage3/build-report-failed-3-attempts.png)
The failed run: `build-report` with Attempt 0, Attempt 1 and Attempt 2, the error `The report oven is broken!`, and the run ending Failed.

![400 Bad Request](stage-tests/stage3/bad-input-400.png)
`POST /reports` with an empty body returns `400 Bad Request` and `{"error":"topic is required"}`.

![Runs list during the Stage 3 tests](stage-tests/stage3/build-report-runs.png)
The dashboard Runs list during the Stage 3 tests.

## Stage 4: The cron heartbeat

**Checkpoint:** the dashboard shows two `heartbeat` runs, one minute apart, each with the summary line.

![heartbeat runs](stage-tests/stage4/heartbeat-runs.png)
`heartbeat` runs triggered by the cron schedule `* * * * *`, one per minute, all Completed.

![heartbeat log lines](stage-tests/stage4/heartbeat-log-lines.png)
The summary lines in the API terminal: `[heartbeat] pending: N, done: N, failed: N`.

![report status done and failed](stage-tests/stage4/report-status-done-and-failed.png)
`GET /reports/:id` for two reports: the `cats` report is `done` with its result, and the `fail` report is `failed` with its error. The `onFailure` handler records the failed status, which is what the heartbeat counts.

![make-report run completed](stage-tests/stage4/make-report-run-completed.png)
A completed `make-report` run for the `cats` report (8.379 seconds).

![make-report run failed](stage-tests/stage4/make-report-run-failed.png)
A failed `make-report` run for the `fail` report, with the input payload showing `"topic": "fail"`.

**README questions on cron expressions**, checked on Crontab.guru:

![Crontab.guru: daily at 08:00](stage-tests/stage4/crontab-daily-0800.png)
`0 8 * * *` reads "At 08:00."

![Crontab.guru: Sundays at 22:00](stage-tests/stage4/crontab-sunday-2200.png)
`0 22 * * 0` reads "At 22:00 on Sunday."

![Dashboard UTC versus local time](stage-tests/stage4/dashboard-utc-vs-local-time.png)
The dashboard shows each event in both UTC and local time, which is why the README says the schedules are subject to the timezone.

## Stage 5: Publish and docs

**Checkpoint:** a stranger with the README can run both terminals and get a report in under 5 minutes.

![Dashboard with all runs](stage-tests/stage5/dashboard-all-runs.png)
One Runs view with a completed `make-report`, a failed `make-report` (and its `make-report (failure)` run started by `onFailure`), and the `heartbeat` cron runs.

## Fresh-clone test

To check that the README works for someone starting from nothing, the repo was cloned into an empty folder, installed with `npm install` (about 2 minutes), and started with the two commands from the README. Then reports were created and polled.

![Dev Server started from the fresh clone](stage-tests/stage5/clone-test-dev-server-output.png)
The Dev Server in the clone: "Inngest Dev Server online" on port 8288, "apps synced" about 7 seconds after it started, then one scheduled event per minute for the heartbeat.

![Creating and polling a report in the fresh clone](stage-tests/stage5/clone-test-create-report-and-runs.png)
The terminal shows the new report as `pending`, and the poll shows `"status":"done"` with its result. The dashboard Runs list beside it shows a Completed `make-report` and Completed `heartbeat` runs.

![202 and poll in the fresh clone](stage-tests/stage5/clone-test-202-and-poll.png)
`curl -i` returns `HTTP/1.1 202 Accepted` with a `pending` body, and a poll of the earlier report returns `done`. The dashboard shows the `report/requested` event with `"topic": "cats"`.

![Heartbeat counts in the fresh clone](stage-tests/stage5/clone-test-heartbeat-counts.png)
The API terminal: the heartbeat counts start at zero, move to `done: 1`, show `pending: 1` while a `fail` report is being retried (with the "The report oven is broken!" errors), and end at `pending: 0, done: 2, failed: 1`.
