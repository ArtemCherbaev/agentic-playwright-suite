# Agentic Playwright Suite

End to end and visual regression tests for [Automation Exercise](https://automationexercise.com),
written in Playwright and TypeScript, authored and healed through Claude Code agents over Playwright
MCP, and published from a containerised CI pipeline.

[![CI](https://github.com/artemcherbaev/agentic-playwright-suite/actions/workflows/ci.yml/badge.svg)](https://github.com/artemcherbaev/agentic-playwright-suite/actions/workflows/ci.yml)

| Live                                                                                                                                                              |                                                                             |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| [Suite health](https://artemcherbaev.github.io/agentic-playwright-suite/metrics/)                                                                                 | Pass rate, flaky rate, p50 and p95, parked cases, against stated thresholds |
| [Test results](https://artemcherbaev.github.io/agentic-playwright-suite/)                                                                                         | Both suites, Chromium and WebKit split under the functional one             |
| [Functional](https://artemcherbaev.github.io/agentic-playwright-suite/functional/) and [visual](https://artemcherbaev.github.io/agentic-playwright-suite/visual/) | Each suite with its own trend                                               |
| [Trace viewer](https://artemcherbaev.github.io/agentic-playwright-suite/playwright-report/)                                                                       | Every step of every case, replayable                                        |

**20 functional cases and 20 visual cases, both capped.** The functional cases are replayed on
WebKit, so the same coverage is proven on the engine behind Safari. Visual baselines stay Chromium on
Linux, generated in the same image CI runs. New coverage replaces an existing case rather than
growing the suite, because twenty cases that can each be justified demonstrate more than two hundred
nobody can explain.

Built with Playwright, TypeScript, Yarn, Docker, Allure and GitHub Actions, with Claude Code agents
reaching the browser over MCP.

The target is a public demo storefront, so every run crosses a real network, hits a real database,
and meets third party advertising on the page. The failures that produces are the failures a real
pipeline produces — and several of them are written up below.

## Run it

```bash
corepack enable
yarn install
yarn playwright:install:chromium
yarn test:e2e          # functional suite
yarn docker:vr         # visual suite, in the image CI uses
```

One case at a time while developing it, the suite afterwards:

```bash
npx playwright test --grep "TC-12"
yarn test:e2e
```

The full command list is in [`docs/architecture.md`](docs/architecture.md).

Where a run leaves things: `playwright-report/` for the HTML report and its traces,
`reports/junit/results.xml` for the machine readable one, `test-results/` for the artefacts of a
failure, including the expected, actual and diff images of a screenshot comparison.

## What runs when

| Trigger         | Runs                                                                  |
| --------------- | --------------------------------------------------------------------- |
| Pull request    | Static checks, functional suite, WebKit replay, visual suite          |
| Push to `main`  | The same, then the dashboards and the suite health page are published |
| Manual dispatch | Regenerate the visual baselines, verify them, upload them for review  |

Every job runs inside an image built by the first job, so browsers and dependencies install once
rather than four times, and a local run uses that same image.

`main` is protected and takes no direct pushes, including from its owner. Every change arrives
through a pull request, and the only check the protection requires is `ci-gate`, a job that reads the
result of all the others. A job that stops running therefore cannot quietly stop being enforced.

The three test jobs run in parallel under a worker budget: one each for the functional and visual
jobs, two for the WebKit job. The budget is a precaution rather than a measured limit — the shared
host's capacity varies — and it costs nothing while removing the suite as a suspect when something
times out.

## When a test goes flaky

A flaky test is a defect in the suite, not weather. The policy, in order:

1. It is never fixed by adding a retry, raising a timeout, or loosening an assertion. Those hide the
   cause and leave the case passing for the wrong reason. `retries` is zero and stays zero.
2. The cause is established first, from the trace or by driving the flow live, then classified:
   application changed, test raced the UI, state left behind, third party noise, or the application
   is genuinely broken.
3. If the application is at fault the test is not repaired. It is parked with `test.fixme()` naming
   the defect, and the defect is recorded in [`specs/STATUS.md`](specs/STATUS.md).
4. Above one percent flaky rate, no new coverage is added until it is back under.

This has been exercised. The scroll up control on the landing page does nothing on roughly one visit
in three: the control is not covered, the click is delivered, no console error follows, and retrying
for fifteen seconds does not recover it. That case is parked rather than weakened, and the
investigation is in [`docs/decisions.md`](docs/decisions.md).

## Structure

```
tests/        20 functional cases, one directory per feature area
vr-tests/     20 visual cases and their committed Linux baselines
specs/        Test plan and status report
utils/        Page objects, fixtures, test data, the capture helper, scripts
.claude/      Seven agents, three skills, four commands
env/docker/   Execution image for CI and local use
```

## When something looks broken

**The whole functional suite fails at the same step.** Look at the other engine in that run: if
WebKit passed the same twenty cases, the demo host was overloaded, not the suite. Three test jobs hit
it in parallel on `main`. Re-run with that hypothesis rather than editing a test.

**Visual cases fail locally with no obvious diff.** Baselines are Chromium on Linux. A local run on
Windows or macOS compares against a set that was never committed. Use `yarn docker:vr`, which runs in
the image CI uses.

**`yarn` is missing or the wrong version.** Yarn 4 is pinned through Corepack in `packageManager`.
Run `corepack enable` once; there is nothing to install globally.

**`corepack enable` fails with EPERM on Windows.** It writes shims into the Node installation
directory, which needs an elevated shell. Either run one, or skip the shims entirely and prefix the
scripts: `corepack yarn install`, `corepack yarn test:e2e`. Same Yarn, same lockfile, no admin.

**No report after a run.** The HTML report is written by the run itself. Run the suite, then
`yarn test:e2e:report`.

## Read further

| Document                                       | Covers                                                                     |
| ---------------------------------------------- | -------------------------------------------------------------------------- |
| [`specs/TEST-PLAN.md`](specs/TEST-PLAN.md)     | Every case, why the suite is capped, and what is deliberately not covered  |
| [`specs/STATUS.md`](specs/STATUS.md)           | Coverage per area, findings raised against the application, open decisions |
| [`docs/architecture.md`](docs/architecture.md) | Page objects, fixtures, locator policy, visual regression, reporting       |
| [`docs/pipeline.md`](docs/pipeline.md)         | The six jobs, the published reports, regenerating baselines                |
| [`docs/agents.md`](docs/agents.md)             | The seven agents, the three skills, why investigation and repair are split |
| [`docs/decisions.md`](docs/decisions.md)       | The calls a reviewer would question, and what broke while building this    |

## Licence

MIT. See [`LICENSE.md`](LICENSE.md).
