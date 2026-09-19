# Pipeline

Six jobs, one of which is the only check branch protection requires.

## What runs when

| Trigger                    | Runs                                                                    |
| -------------------------- | ----------------------------------------------------------------------- |
| Pull request               | Image, static checks, functional, WebKit, visual, gate                  |
| Push to `main`             | The same, then the dashboards and the suite health page are published   |
| Manual, `update_baselines` | The visual suite regenerates its baselines, verifies them, uploads them |

## The jobs

### `image`

Builds the execution image from `env/docker/Dockerfile` and pushes it to GHCR, tagged with the
commit. Every other job runs inside it, so the browsers and the dependencies install once rather than
four times, and a local `yarn docker:vr` uses the same image.

The base image is pinned to a Playwright release. The browser build and the client library have to
agree, and a floating base means a green pipeline turns red on a morning when nothing changed.

### `static`

`yarn check`: typecheck, lint, format check. The lint rules are not decoration — they reject
`waitForTimeout`, focused tests, plain `test.skip`, and assertions nobody awaits.

### `functional`, `webkit`, `visual`

Three test jobs in parallel against one shared host, each capped at a small worker budget. The visual
job runs the only suite whose baselines are platform specific, which is why it runs in the container
and not on the runner.

All three upload their results: Allure results, the JSON report the health page reads, and for the
functional job the HTML report with its traces.

### `publish`

Only on a push to `main`, and it runs whatever the test jobs finished as. A failing run is exactly the
run whose report someone wants to read.

It assembles four Allure reports — combined, functional including the WebKit split, visual — copies
the Playwright HTML report for its traces, and generates the suite health page. Then it deploys the
lot to Pages.

### `ci-gate`

The only required check. It reads the result of every other job, so a job that stops running cannot
quietly stop being enforced: delete the visual job and the gate fails on a missing result rather than
passing on an absent one.

`main` is protected and takes no direct pushes, including from its owner.

## The published reports

| Report       | Answers                                                                                   |
| ------------ | ----------------------------------------------------------------------------------------- |
| Suite health | Pass rate, flaky rate, p50 and p95, slowest cases, parked cases, each against a threshold |
| Test results | Both suites in one dashboard, Chromium and WebKit split under the functional one          |
| Functional   | The end to end suite alone, with its trend                                                |
| Visual       | The screenshot suite alone, with expected, actual and diff for any failure                |
| Trace viewer | Every step of every case, replayable, with network and DOM at each step                   |

## Regenerating the visual baselines

Baselines are Chromium on Linux. Two ways to produce them:

**With Docker locally.** `yarn docker:vr:update`, then `yarn docker:vr` to prove they reproduce, then
commit them.

**Without Docker.** Run the CI workflow manually with `update_baselines` set. The job regenerates the
baselines, immediately re-runs the suite against them, and uploads them as the `visual-baselines`
artefact. Download it, unzip into `vr-tests/__screenshots__/`, and commit.

The verification run is not optional politeness. The first set this suite generated contained two
captures taken before the fonts had painted; they disagreed with every run afterwards and looked like
a regression in the application.

## When something looks broken

**The whole functional suite fails at the same step.** Look at the other engine in that run. If
WebKit passed the same twenty cases, the demo host was overloaded by three parallel jobs. Re-run with
that hypothesis rather than editing a test.

**Visual cases fail locally with no obvious diff.** Baselines are Chromium on Linux. A local run on
Windows or macOS compares against a set that was never committed. Use `yarn docker:vr`.

**The image job fails on `yarn playwright --version`.** The base image and the lockfile have drifted
apart. That check exists so the drift fails the build rather than the suite.

**`yarn` is missing or the wrong version.** Yarn 4 is pinned through Corepack in `packageManager`.
Run `corepack enable` once; there is nothing to install globally.

**No report after a local run.** The HTML report is written by the run itself: run the suite, then
`yarn test:e2e:report`.
