---
name: flake-policy
description: What to do when a test passes on one run and fails on the next - the order of investigation, the four permitted classifications, and the changes that are forbidden. Load whenever a failure is intermittent or is about to be called flaky.
---

# Flake policy

A flaky test is a defect in the test code. It is not weather, and it is not noise to be retried away.

`retries` is zero in the config, deliberately. A retry turns a flaky test into a green tick and throws
away the only run that had anything to say.

## Forbidden, whatever the pressure

- Adding a retry, globally or on a case.
- Raising a timeout to get past a failure. A timeout is raised only when the operation is genuinely
  slower than the limit, and the commit says how much slower and how that was measured.
- Loosening an assertion so it stops noticing.
- `waitForTimeout`. The lint rules reject it. Wanting one means the signal to wait for has not been
  found yet.

## The order

1. **Reproduce.** `--repeat-each 5 --workers 1` first. If it will not fail alone, reproduce it under
   the load it fails under. A case that only fails under parallel load has a different cause, and
   that distinction is most of the answer.
2. **Read the trace.** `npx playwright show-trace test-results/<dir>/trace.zip`. The DOM at the
   failing step, the network, the console.
3. **Ask the live page.** Drive the flow over Playwright MCP. Is something covering the element? Is
   the handler bound? Does the accessible name still match? Is a third party writing into it?
4. **Classify**, as exactly one of:
   - `application changed` — update the suite to the new truth.
   - `test raced the UI` — wait for the component's own signal, never a duration.
   - `state left behind` — fix the fixture, not the case.
   - `third party noise` — say what, with evidence.
   - `application is broken` — **do not repair**. Park with `test.fixme()` naming the defect, and
     write it up in `specs/STATUS.md`.

## The budget

Above one percent flaky rate, no new coverage is added until it is back under. The suite health page
publishes that number against the threshold on every push to main.

## Parking is not skipping

`test.skip` hides a case. `test.fixme` says this case is expected to fail because the application is
wrong, names the defect, and keeps it visible in every report and on the suite health page. The lint
rules allow the second and reject the first.
