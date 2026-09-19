# Agents

The tests in this repository are authored and repaired through Claude Code agents working over
Playwright MCP. **The pipeline runs no model.** A suite that needs a model at runtime produces a
result that cannot be reproduced, and reproducibility is the only reason to trust one.

So the division is: agents write and repair the tests, and the tests run deterministically in CI. The
agent is a colleague who writes code, not a component of the system under test.

## The seven

| Agent                 | Does                                                                  | Deliberately cannot                             |
| --------------------- | --------------------------------------------------------------------- | ----------------------------------------------- |
| `flake-investigator`  | Establishes why a case failed intermittently and classifies the cause | Edit anything                                   |
| `test-healer`         | Repairs a case whose cause is already classified                      | Repair one that has not been investigated       |
| `test-author`         | Writes one new case, driving the live application first               | Add a case without one coming out               |
| `locator-auditor`     | Reviews locators against the policy                                   | Run the suite or rewrite tests                  |
| `visual-baseline`     | Decides whether a diff is a regression or a stale baseline            | Regenerate baselines; that permission is denied |
| `coverage-strategist` | Decides what earns a place in the suite and what comes out            | Write tests                                     |
| `pipeline-doctor`     | Separates a broken pipeline from a broken application                 | Edit tests                                      |

The separations matter more than the agents. An investigator who can also repair stops investigating
the moment a repair looks plausible, and an agent that can regenerate a baseline will regenerate it
rather than explain the difference.

## Why investigation and repair are two agents

The single most common way a Playwright suite rots is a green tick bought with a retry. Splitting the
work means the classification is written down before anyone touches the test, and the repair has to
name which of the five causes it is addressing. `test-healer` refuses a failure it has no
classification for.

## The three skills

Skills carry the rules; agents carry the roles. Both the agents and a person working here load the
same ones, so the standard does not depend on who is doing the work.

| Skill                    | Covers                                                                           |
| ------------------------ | -------------------------------------------------------------------------------- |
| `playwright-conventions` | Locator policy, page object boundaries, naming, test data, comments              |
| `flake-policy`           | The order of investigation, the five classifications, the four forbidden changes |
| `visual-regression`      | Capturing against an advertising supported target, and reading a diff            |

## The four commands

| Command                        | Runs                                                            |
| ------------------------------ | --------------------------------------------------------------- |
| `/triage-flake <TC-nn>`        | Investigation only, ending in a classification and its evidence |
| `/heal <TC-nn> <cause>`        | Repair, refusing to start without a cause                       |
| `/author-case <what to prove>` | Strategy, then authoring, then a locator review                 |
| `/suite-health`                | Runs the suite and reports every number against its threshold   |

## MCP

`.mcp.json` declares one server: Playwright MCP, Chromium, isolated. It is how an agent reaches the
live application to check that a locator resolves and an assertion is true before either is written
down.

That is the part that earns its place. Authoring a test from the specification produces a test that
asserts what the application was supposed to do; this suite is only useful because it asserts what
the application does.

## What the agents are not allowed to do

`.claude/settings.json` denies:

- `git push` — a suite that pushes its own repairs is a suite nobody reviews.
- `yarn test:vr:update` and its Docker equivalent — regenerating a baseline is a reviewed change,
  and the agent that most wants to do it is the one that should not be able to.

## Where this has actually paid

Every entry in the second half of `docs/decisions.md` came out of this loop: a failure, an
investigation against the live page rather than against an assumption, and a repair that names its
cause. The `exact: true` race, the empty product name that matched every cart row, and the two
baselines that were photographs of the fallback font were all found by driving the real application
and asking it, rather than by reading the test and guessing.
