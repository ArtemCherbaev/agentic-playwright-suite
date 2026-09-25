# Pipeline

Three workflows. `ci.yml` tests and publishes, `update-vr-baselines.yml` regenerates the visual
baselines on request, and `image.yml` is the building block both of them start from.

## What runs when

| Trigger                   | Runs                                                                       |
| ------------------------- | -------------------------------------------------------------------------- |
| Pull request              | Image, static checks, functional, WebKit, visual, API, gate                |
| Push to `main`            | The same, then the reports, the suite health page and the run feed publish |
| `Update visual baselines` | Manual: regenerate in the image, verify the new set reproduces, commit it  |

## The jobs

### `image`

Resolves the image reference from `package.json`, the lockfile and the Dockerfile: the Playwright
release is the tag's prefix, a hash of those files its suffix. If the registry already holds that tag,
the build is skipped, so a commit that only changes tests costs a manifest lookup rather than a build.

The Dockerfile does not name a Playwright version. The job passes the one in `package.json` as a build
argument, so the browser build and the client library cannot disagree, and the Dockerfile fails the
build if the lockfile resolves anything else. `@playwright/test` is therefore pinned exactly; a range
is rejected before anything is built.

The image holds the environment only: the operating system, the browsers and `node_modules` at
`/suite`. Every job checks out the commit under test and points at those dependencies with a symlink,
so the code that runs is always the code in front of the job, never whatever was copied into an image
last week.

### `static`

`yarn check`: typecheck, lint, format check. The lint rules are not decoration — they reject
`waitForTimeout`, focused tests, plain `test.skip`, and assertions nobody awaits.

### `functional`, `webkit`, `visual`, `api`

Four test jobs in parallel against one shared host, each on a small worker budget. The visual job runs
the only suite whose baselines are platform specific, which is why every job runs in the same image
rather than on the runner.

Each uploads its Allure results and its JSON report; the functional job adds the Playwright HTML
report with its traces.

### `publish`

Only on `main`, and whatever the test jobs finished as, because a failing run is exactly the run whose
report someone wants to read. It does not run when a test job never started — an image that failed to
build leaves nothing new to show, and the last report stays up.

It restores the published site from the `gh-pages` branch first, for three things: the Allure trend
history of each report, the run history the feed appends to, and the number of the run that site came
from. Two runs on `main` can finish out of order; a run older than the one already published stops
there rather than replacing a newer report with an older one.

Then it generates four Allure reports — combined, functional with the WebKit split, visual, API —
each with failure categories and a link back to the run, copies the Playwright report for its traces,
builds the suite health page and the run feed, and force-pushes the lot to `gh-pages` as a single
commit. History lives in the reports, not in the branch, so the branch never grows.

### `ci-gate`

It reads the result of every other job, so a job that stops running cannot quietly stop being
enforced: delete the visual job and the gate fails on a missing result rather than passing on an
absent one. It is the one check a branch protection rule needs to require.

## The published site

| Path                  | Answers                                                                                   |
| --------------------- | ----------------------------------------------------------------------------------------- |
| `/`                   | Every suite in one Allure dashboard, with its trend across runs                           |
| `/functional/`        | The end to end suite alone, Chromium and WebKit side by side                              |
| `/visual/`            | The screenshot suite alone, with expected, actual and diff for any failure                |
| `/api/`               | The REST API suite alone                                                                  |
| `/playwright-report/` | Every step of every functional case, replayable, with network and DOM at each step        |
| `/metrics/`           | Pass rate, flaky rate, p50 and p95, slowest cases, parked cases, each against a threshold |
| `/feed/latest.json`   | The run feed: every case of the last run, timed, for the portfolio's replay               |
| `/feed/history.json`  | One line per run for the last sixty runs                                                  |

## The run feed

`utils/scripts/build-feed.mjs` turns the four JSON reports into one document, schema `apw-feed/1`:
the run (number, commit, links, wall time, conclusion), totals, and one lane per project with every
case — id, title, area, status, duration, start offset within its lane, and the worker it ran on.

The portfolio's [runner page](https://artemcherbaev.github.io/qa-suite.html) replays a run from it. It
exists so that page depends on a format this repository owns and versions, rather than on the
internal data files of a report generator, which can change shape in any release. The script checks
the feed against its own contract before writing it and fails the publish if it does not hold, which
leaves the previous feed in place: stale is readable, malformed is not. A lane whose job died before
reporting is published as missing, and the run is marked failed, rather than the lane disappearing.

## Regenerating the visual baselines

Baselines are Chromium on Linux, captured in the execution image.

**Without Docker.** Run the `Update visual baselines` workflow with a reason. It regenerates the set
in the image, immediately re-runs the suite against it, and commits it only if that run passes. The
set is also uploaded as an artefact for review.

**With Docker locally.** `yarn docker:vr:update`, then `yarn docker:vr` to prove they reproduce, then
commit them.

The verification run is not optional politeness. The first set this suite generated contained two
captures taken before the fonts had painted; they disagreed with every run afterwards and looked like a
regression in the application.

## When something looks broken

**The whole functional suite fails at the same step.** Look at the other engine in that run. If WebKit
passed the same twenty cases, the demo host was overloaded by parallel jobs. Re-run with that
hypothesis rather than editing a test.

**Visual cases fail locally with no obvious diff.** Baselines are Chromium on Linux. A local run on
Windows or macOS compares against a set that was never committed. Use `yarn docker:vr`.

**The image build fails on the version check.** The lockfile and the Playwright version in
`package.json` have drifted apart. That check exists so the drift fails the build rather than the
suite.

**`publish` fails at the feed.** The contract check found a problem and printed every one of them. The
previous feed is still published; fix the script or the reports, not the check.

**`yarn` is missing or the wrong version.** Yarn 4 is pinned through Corepack in `packageManager`. Run
`corepack enable` once; there is nothing to install globally.

**No report after a local run.** The HTML report is written by the run itself: run the suite, then
`yarn test:e2e:report`.
