---
description: Investigate an intermittent failure and classify its cause without repairing it
argument-hint: <TC-nn or test name>
---

Investigate the intermittent failure of **$1**.

Use the flake-investigator agent. Do not repair anything in this command; the classification is the
deliverable.

Work in this order and report what you actually ran:

1. Reproduce in isolation: `npx playwright test --grep "$1" --repeat-each 5 --workers 1`
2. If it will not fail alone, reproduce under load: `--repeat-each 3 --workers 4`
3. Read the trace for a failing run rather than describing what you expect to be in it.
4. Drive the flow over Playwright MCP and interrogate the live DOM.

Finish with: the classification, the evidence, the failure count out of the runs attempted, and what
would have to be true for the classification to be wrong.
