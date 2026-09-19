#!/usr/bin/env node
/**
 * Suite health.
 *
 * Allure answers "did this run pass". This answers "is this suite worth
 * believing", which is a different question and the one that decides whether
 * new coverage gets added this week.
 *
 * Every number is printed against a stated threshold. A dashboard of numbers
 * with nothing to compare them to trains people to glance at it and move on.
 *
 *   node utils/scripts/suite-health.mjs [--out site/metrics] [--in .]
 */
import { readFile, writeFile, mkdir, readdir, stat } from 'node:fs/promises';
import { join, resolve } from 'node:path';

/** What the suite holds itself to. Changing one of these is a decision, so they live in the open. */
const THRESHOLDS = {
  passRate: {
    min: 100,
    unit: '%',
    note: 'every case, every run. A known failure is parked, not tolerated.',
  },
  flakyRate: {
    max: 1,
    unit: '%',
    note: 'above this, no new coverage is added until it is back under.',
  },
  p95Duration: {
    max: 45,
    unit: 's',
    note: 'a case slower than this is doing more than one thing.',
  },
  suiteDuration: {
    max: 300,
    unit: 's',
    note: 'longer than five minutes and it stops being run before a push.',
  },
};

const args = process.argv.slice(2);
const argOf = (flag, fallback) => {
  const i = args.indexOf(flag);
  return i >= 0 && args[i + 1] ? args[i + 1] : fallback;
};

const OUT = resolve(argOf('--out', 'site/metrics'));
const IN = resolve(argOf('--in', '.'));

/** Every Playwright JSON report under the input directory, however it got there. */
async function findReports(dir, found = []) {
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    return found;
  }
  for (const entry of entries) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (['node_modules', '.git', 'site', 'allure-report'].includes(entry.name)) continue;
      await findReports(full, found);
    } else if (entry.name === 'results.json') {
      const info = await stat(full);
      if (info.size > 0) found.push(full);
    }
  }
  return found;
}

/** Flatten Playwright's nested suite tree into one list of cases. */
function collectCases(json) {
  const cases = [];
  const walk = (suites) => {
    for (const suite of suites ?? []) {
      for (const spec of suite.specs ?? []) {
        for (const test of spec.tests ?? []) {
          const results = test.results ?? [];
          const last = results[results.length - 1];
          cases.push({
            title: spec.title,
            file: suite.file ?? spec.file ?? 'unknown',
            project: test.projectName ?? 'unknown',
            status: last?.status ?? 'unknown',
            expected: test.expectedStatus ?? 'passed',
            duration: (last?.duration ?? 0) / 1000,
            // Playwright calls a case flaky when it failed and then passed
            // inside the same run. Retries are off here, so this stays zero
            // unless someone turns them on, which is the point of showing it.
            attempts: results.length,
            annotations: test.annotations ?? [],
          });
        }
      }
      walk(suite.suites);
    }
  };
  walk(json.suites);
  return cases;
}

const percentile = (values, p) => {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.min(sorted.length - 1, Math.ceil((p / 100) * sorted.length) - 1);
  return sorted[Math.max(0, index)];
};

const reports = await findReports(IN);
const cases = [];
let wallClock = 0;

for (const path of reports) {
  try {
    const json = JSON.parse(await readFile(path, 'utf8'));
    cases.push(...collectCases(json));
    wallClock = Math.max(wallClock, (json.stats?.duration ?? 0) / 1000);
  } catch {
    // A report that cannot be parsed is reported as one, rather than silently
    // lowering the denominator and making the pass rate look better.
    cases.push({
      title: `unreadable report: ${path}`,
      file: path,
      project: 'n/a',
      status: 'broken',
      expected: 'passed',
      duration: 0,
      attempts: 0,
      annotations: [],
    });
  }
}

const ran = cases.filter((c) => c.status !== 'skipped');
const passed = ran.filter((c) => c.status === 'passed');
const failed = ran.filter((c) => c.status === 'failed' || c.status === 'timedOut');
const broken = ran.filter((c) => c.status === 'broken' || c.status === 'interrupted');
const parked = cases.filter((c) => c.status === 'skipped');
const flaky = ran.filter((c) => c.attempts > 1 && c.status === 'passed');

const durations = ran.map((c) => c.duration);
const metrics = {
  passRate: ran.length ? (passed.length / ran.length) * 100 : 0,
  flakyRate: ran.length ? (flaky.length / ran.length) * 100 : 0,
  p50Duration: percentile(durations, 50),
  p95Duration: percentile(durations, 95),
  suiteDuration: wallClock,
};

const verdicts = {
  passRate: metrics.passRate >= THRESHOLDS.passRate.min,
  flakyRate: metrics.flakyRate <= THRESHOLDS.flakyRate.max,
  p95Duration: metrics.p95Duration <= THRESHOLDS.p95Duration.max,
  suiteDuration: metrics.suiteDuration <= THRESHOLDS.suiteDuration.max,
};

const slowest = [...ran].sort((a, b) => b.duration - a.duration).slice(0, 5);

const escape = (value) =>
  String(value).replace(
    /[&<>"]/g,
    (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[ch],
  );

const tile = (label, value, ok, threshold) => `
  <div class="tile ${ok ? 'ok' : 'bad'}">
    <div class="value">${escape(value)}</div>
    <div class="label">${escape(label)}</div>
    <div class="threshold">${escape(threshold)}</div>
  </div>`;

const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Suite health, agentic Playwright suite</title>
<style>
  :root{
    --ink:#12222b; --soft:#4a5f6a; --paper:#f3f5f4; --card:#fff; --line:#dde4e2;
    --ok:#0f6e63; --bad:#a3271b; --amber:#b4620f;
    --mono:ui-monospace,SFMono-Regular,Menlo,monospace;
  }
  *{box-sizing:border-box}
  body{margin:0;background:var(--paper);color:var(--ink);
       font:16px/1.65 system-ui,-apple-system,"Segoe UI",sans-serif;}
  .wrap{max-width:1000px;margin:0 auto;padding:48px 24px 72px}
  h1{font-size:1.75rem;margin:0 0 6px;letter-spacing:-.02em}
  .sub{color:var(--soft);margin:0 0 36px}
  .grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(190px,1fr));gap:16px}
  .tile{background:var(--card);border:1px solid var(--line);border-radius:12px;padding:20px;border-top:3px solid var(--ok)}
  .tile.bad{border-top-color:var(--bad)}
  .tile .value{font-size:2rem;font-weight:700;line-height:1}
  .tile.ok .value{color:var(--ok)}
  .tile.bad .value{color:var(--bad)}
  .tile .label{margin-top:8px;font-size:.875rem}
  .tile .threshold{margin-top:6px;font-family:var(--mono);font-size:.6875rem;color:var(--soft)}
  h2{font-size:1.125rem;margin:44px 0 12px}
  table{width:100%;border-collapse:collapse;background:var(--card);border:1px solid var(--line);border-radius:12px;overflow:hidden}
  th,td{text-align:left;padding:12px 16px;border-bottom:1px solid var(--line);font-size:.9375rem}
  th{font-family:var(--mono);font-size:.6875rem;letter-spacing:.1em;text-transform:uppercase;color:var(--soft)}
  tr:last-child td{border-bottom:0}
  td.num{font-family:var(--mono);white-space:nowrap}
  .status-failed{color:var(--bad);font-weight:600}
  .status-skipped{color:var(--amber)}
  .note{color:var(--soft);font-size:.875rem;max-width:70ch}
  footer{margin-top:48px;color:var(--soft);font-family:var(--mono);font-size:.75rem}
</style>
</head>
<body>
<div class="wrap">
  <h1>Suite health</h1>
  <p class="sub">Generated ${escape(new Date().toISOString())} from ${reports.length} report${
    reports.length === 1 ? '' : 's'
  }, ${cases.length} case result${cases.length === 1 ? '' : 's'}.</p>

  <div class="grid">
    ${tile('pass rate', `${metrics.passRate.toFixed(1)}%`, verdicts.passRate, `target ${THRESHOLDS.passRate.min}%`)}
    ${tile('flaky rate', `${metrics.flakyRate.toFixed(1)}%`, verdicts.flakyRate, `max ${THRESHOLDS.flakyRate.max}%`)}
    ${tile('p50 case', `${metrics.p50Duration.toFixed(1)}s`, true, 'no threshold, context only')}
    ${tile('p95 case', `${metrics.p95Duration.toFixed(1)}s`, verdicts.p95Duration, `max ${THRESHOLDS.p95Duration.max}s`)}
    ${tile('suite wall clock', `${metrics.suiteDuration.toFixed(0)}s`, verdicts.suiteDuration, `max ${THRESHOLDS.suiteDuration.max}s`)}
  </div>

  <h2>What the thresholds mean</h2>
  <p class="note">Pass rate: ${escape(THRESHOLDS.passRate.note)}<br>
     Flaky rate: ${escape(THRESHOLDS.flakyRate.note)}<br>
     p95: ${escape(THRESHOLDS.p95Duration.note)}<br>
     Wall clock: ${escape(THRESHOLDS.suiteDuration.note)}</p>

  <h2>Failures in this run</h2>
  ${
    failed.length + broken.length === 0
      ? '<p class="note">None.</p>'
      : `<table><thead><tr><th>Case</th><th>Project</th><th>Status</th></tr></thead><tbody>${[
          ...failed,
          ...broken,
        ]
          .map(
            (c) =>
              `<tr><td>${escape(c.title)}</td><td class="num">${escape(c.project)}</td><td class="status-failed">${escape(c.status)}</td></tr>`,
          )
          .join('')}</tbody></table>`
  }

  <h2>Parked cases</h2>
  <p class="note">A case parked with <code>test.fixme()</code> names a defect in the application and is
     recorded in <code>specs/STATUS.md</code>. Parked is not the same as passing, and it is not the same
     as deleted.</p>
  ${
    parked.length === 0
      ? '<p class="note">None.</p>'
      : `<table><thead><tr><th>Case</th><th>Project</th></tr></thead><tbody>${parked
          .map(
            (c) => `<tr><td>${escape(c.title)}</td><td class="num">${escape(c.project)}</td></tr>`,
          )
          .join('')}</tbody></table>`
  }

  <h2>Slowest five</h2>
  <table><thead><tr><th>Case</th><th>Project</th><th>Duration</th></tr></thead><tbody>
    ${slowest
      .map(
        (c) =>
          `<tr><td>${escape(c.title)}</td><td class="num">${escape(c.project)}</td><td class="num">${c.duration.toFixed(1)}s</td></tr>`,
      )
      .join('')}
  </tbody></table>

  <footer>agentic-playwright-suite &middot; regenerated by the pipeline on every push to main</footer>
</div>
</body>
</html>
`;

await mkdir(OUT, { recursive: true });
await writeFile(join(OUT, 'index.html'), html, 'utf8');
await writeFile(
  join(OUT, 'metrics.json'),
  JSON.stringify({ metrics, verdicts, THRESHOLDS }, null, 2),
  'utf8',
);

const failedThresholds = Object.entries(verdicts).filter(([, ok]) => !ok);
process.stdout.write(
  `suite health written to ${OUT}\n` +
    `  pass ${metrics.passRate.toFixed(1)}%  flaky ${metrics.flakyRate.toFixed(1)}%  ` +
    `p50 ${metrics.p50Duration.toFixed(1)}s  p95 ${metrics.p95Duration.toFixed(1)}s\n` +
    (failedThresholds.length
      ? `  below threshold: ${failedThresholds.map(([k]) => k).join(', ')}\n`
      : '  every threshold met\n'),
);

// The page is a report, not a gate. The suites themselves decide whether the
// pipeline is red; failing here as well would fail the build twice for one
// cause and make the second failure the one people look at.
