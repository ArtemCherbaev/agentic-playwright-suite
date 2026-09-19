---
description: Write one new functional case, driving the real application first
argument-hint: <what the case should prove>
---

Write a new functional case that proves: **$1**

Before writing anything, ask coverage-strategist which of the existing twenty cases this one
replaces. The cap is the point; if nothing should be replaced, the case should not be written.

Then use the test-author agent:

1. Drive the flow over Playwright MCP against the live application and record what you actually saw.
2. Write the case against what you saw, following the playwright-conventions skill.
3. Run it five times in isolation and report the result.
4. Ask locator-auditor to review the locators before handing it back.

Update `specs/TEST-PLAN.md` with the new case and remove the one it replaced.
