---
description: Repair a failing case whose cause has already been established
argument-hint: <TC-nn> <classification from triage-flake>
---

Repair **$1**, whose cause was classified as **$2**.

If $2 is empty, or is not one of `application changed`, `test raced the UI`, `state left behind` or
`third party noise`, stop and run `/triage-flake $1`first. A case classified`application is broken`is parked with`test.fixme()`and written up in`specs/STATUS.md`, not repaired.

Use the test-healer agent and follow the flake-policy skill. Retries, raised timeouts, weakened
assertions and `waitForTimeout` are all forbidden.

Prove the repair the way the case failed:

```
npx playwright test --grep "$1" --repeat-each 5 --workers 1
npx playwright test --grep "$1" --repeat-each 3 --workers 4
yarn typecheck && yarn lint
```

Report the numbers. If the repair narrows what the case checks, say so in the report rather than
leaving a reviewer to notice.
