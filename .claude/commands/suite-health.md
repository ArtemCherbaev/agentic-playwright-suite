---
description: Report the suite's health against its stated thresholds
---

Run the functional suite, regenerate the health page, and report what it says.

```
yarn test:e2e
yarn metrics
```

Then read `site/metrics/metrics.json` and report, in one short table: pass rate, flaky rate, p50, p95
and wall clock, each against its threshold, plus any parked cases and what they are parked for.

If the flaky rate is above one percent, say explicitly that no new coverage is to be added until it
is back under, and name the cases responsible.
