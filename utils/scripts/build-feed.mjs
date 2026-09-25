#!/usr/bin/env node
/**
 * The run feed.
 *
 * One small JSON document describing the run CI has just finished: every case,
 * its outcome, when it started within its lane and how long it took. The
 * portfolio's runner page replays the run from it, lane by lane, at the pace
 * it actually ran.
 *
 * It exists so that page depends on a format this repository owns and
 * versions, rather than on the internal data files of a report generator,
 * which can change shape in any release. The feed is checked against its own
 * contract before anything is written: a feed that does not match fails the
 * publish and leaves the previous one in place, instead of breaking the page
 * that reads it.
 *
 *   node utils/scripts/build-feed.mjs --in incoming --out site/feed \
 *     [--previous previous/feed/history.json] [--site https://owner.github.io/repo/]
 *
 * Run details come from the GitHub Actions environment when it is there, and
 * from placeholders for a local run.
 */
import { readFile, writeFile, mkdir, readdir, stat } from 'node:fs/promises';
import { join, resolve } from 'node:path';

export const SCHEMA = 'apw-feed/1';
const HISTORY_SCHEMA = 'apw-history/1';
const HISTORY_LIMIT = 60;

/** Which lane each Playwright project is, and where its report is published. */
const LANES = {
  chromium: {
    suite: 'functional',
    label: 'Functional E2E',
    engine: 'Chromium',
    report: 'functional/',
  },
  webkit: { suite: 'functional', label: 'Functional E2E', engine: 'WebKit', report: 'functional/' },
  visual: { suite: 'visual', label: 'Visual regression', engine: 'Chromium', report: 'visual/' },
  api: { suite: 'api', label: 'REST API', engine: 'HTTP', report: 'api/' },
};
const STATUSES = ['passed', 'failed', 'flaky', 'skipped', 'parked'];
const CASE_ID = /^((?:TC|VR|API)-\d+)\s+/;
const SUITE_TAGS = new Set(['functional', 'visual', 'api']);

const args = process.argv.slice(2);
const argOf = (flag, fallback) => {
  const i = args.indexOf(flag);
  return i >= 0 && args[i + 1] ? args[i + 1] : fallback;
};

const IN = resolve(argOf('--in', '.'));
const OUT = resolve(argOf('--out', 'site/feed'));
const PREVIOUS = argOf('--previous', '');
const EXPECT = argOf('--expect', Object.keys(LANES).join(',')).split(',').filter(Boolean);

const env = process.env;
const repository = env.GITHUB_REPOSITORY ?? 'local/agentic-playwright-suite';
const [owner, repo] = repository.split('/');
const server = env.GITHUB_SERVER_URL ?? 'https://github.com';
const SITE = argOf('--site', `https://${owner.toLowerCase()}.github.io/${repo}/`);

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
    } else if (entry.name === 'results.json' && (await stat(full)).size > 0) {
      found.push(full);
    }
  }
  return found;
}

const ANSI = new RegExp(`${String.fromCharCode(27)}\\[[0-9;]*m`, 'g');
const stripAnsi = (text) => text.replace(ANSI, '');

/** The first line of an error that says something, short enough for a log line. */
function headline(message) {
  if (!message) return undefined;
  const line = stripAnsi(message)
    .split('\n')
    .map((l) => l.trim())
    .find((l) => l.length > 0);
  return line ? line.slice(0, 240) : undefined;
}

function areaOf(spec) {
  const tag = (spec.tags ?? []).map((t) => t.replace(/^@/, '')).find((t) => !SUITE_TAGS.has(t));
  if (tag) return tag;
  const parts = (spec.file ?? '').split(/[\\/]/);
  return parts.length > 2 ? parts[1] : (parts.at(-1) ?? 'unknown').replace(/\..*$/, '');
}

function statusOf(test, last) {
  const parked = (test.annotations ?? []).some((a) => a.type === 'fixme');
  if (test.status === 'skipped' || last?.status === 'skipped') return parked ? 'parked' : 'skipped';
  if (test.status === 'flaky') return 'flaky';
  if (test.status === 'expected') return 'passed';
  return 'failed';
}

/** Flatten one report into lanes keyed by project, each case timed against its lane's start. */
function lanesFrom(json) {
  const laneStart = Date.parse(json.stats?.startTime ?? '') || 0;
  const lanes = new Map();
  const walk = (suites) => {
    for (const suite of suites ?? []) {
      for (const spec of suite.specs ?? []) {
        for (const test of spec.tests ?? []) {
          const project = test.projectName ?? 'unknown';
          if (!lanes.has(project)) {
            lanes.set(project, {
              startedAt: json.stats?.startTime ?? null,
              durationMs: Math.round(json.stats?.duration ?? 0),
              cases: [],
            });
          }
          const results = test.results ?? [];
          const last = results.at(-1);
          const status = statusOf(test, last);
          const started = Date.parse(last?.startTime ?? '');
          const match = CASE_ID.exec(spec.title);
          const fixme = (test.annotations ?? []).find((a) => a.type === 'fixme');
          lanes.get(project).cases.push({
            id: match ? match[1] : null,
            title: match ? spec.title.slice(match[0].length) : spec.title,
            area: areaOf(spec),
            file: (spec.file ?? '').replace(/\\/g, '/'),
            line: spec.line ?? 0,
            status,
            durationMs: Math.max(0, Math.round(last?.duration ?? 0)),
            startMs: Number.isFinite(started) && laneStart ? Math.max(0, started - laneStart) : 0,
            // A case that never ran (parked, skipped) reports worker -1.
            worker: Math.max(0, last?.parallelIndex ?? 0),
            attempts: results.length,
            ...(status === 'failed' || status === 'flaky'
              ? { error: headline(last?.errors?.[0]?.message ?? last?.error?.message) }
              : {}),
            ...(fixme?.description ? { note: fixme.description } : {}),
          });
        }
      }
      walk(suite.suites);
    }
  };
  walk(json.suites);
  return lanes;
}

function tally(cases) {
  const totals = { cases: cases.length, passed: 0, failed: 0, flaky: 0, skipped: 0, parked: 0 };
  for (const c of cases) totals[c.status] += 1;
  return totals;
}

/** The contract the portfolio reads against. Returns every problem, not just the first. */
export function checkFeed(feed) {
  const problems = [];
  const isCount = (n) => Number.isInteger(n) && n >= 0;
  const need = (ok, what) => {
    if (!ok) problems.push(what);
  };
  need(feed?.schema === SCHEMA, `schema is ${SCHEMA}`);
  need(typeof feed?.generatedAt === 'string', 'generatedAt is a string');
  need(isCount(feed?.run?.number), 'run.number is a count');
  need(typeof feed?.run?.commit === 'string', 'run.commit is a string');
  need(typeof feed?.run?.url === 'string', 'run.url is a string');
  need(['passed', 'failed'].includes(feed?.run?.conclusion), 'run.conclusion is passed or failed');
  need(isCount(feed?.run?.wallMs), 'run.wallMs is a count');
  need(Array.isArray(feed?.lanes) && feed.lanes.length > 0, 'lanes is a non-empty array');
  for (const key of ['cases', ...STATUSES]) {
    need(isCount(feed?.totals?.[key]), `totals.${key} is a count`);
  }
  let counted = 0;
  for (const lane of feed?.lanes ?? []) {
    const where = `lane ${lane?.key}`;
    need(Object.hasOwn(LANES, lane?.key), `${where}: key is a known lane`);
    need(typeof lane?.label === 'string' && typeof lane?.engine === 'string', `${where}: labelled`);
    need(typeof lane?.missing === 'boolean', `${where}: missing is a boolean`);
    need(isCount(lane?.durationMs), `${where}: durationMs is a count`);
    need(Array.isArray(lane?.cases), `${where}: cases is an array`);
    for (const c of lane?.cases ?? []) {
      counted += 1;
      need(typeof c.title === 'string' && c.title.length > 0, `${where}: every case has a title`);
      need(STATUSES.includes(c.status), `${where}: ${c.title} has a known status`);
      need(isCount(c.durationMs) && isCount(c.startMs), `${where}: ${c.title} is timed`);
      need(isCount(c.worker), `${where}: ${c.title} names its worker`);
    }
  }
  need(counted === feed?.totals?.cases, 'totals.cases equals the cases listed');
  need(typeof feed?.links?.dashboard === 'string', 'links.dashboard is a string');
  return [...new Set(problems)];
}

// ---------------------------------------------------------------------------

const reports = await findReports(IN);
const byProject = new Map();
for (const path of reports) {
  const json = JSON.parse(await readFile(path, 'utf8'));
  for (const [project, lane] of lanesFrom(json)) {
    const existing = byProject.get(project);
    if (existing) {
      existing.cases.push(...lane.cases);
      existing.durationMs = Math.max(existing.durationMs, lane.durationMs);
    } else {
      byProject.set(project, lane);
    }
  }
}

const keys = [...new Set([...EXPECT, ...byProject.keys()])].filter((k) => Object.hasOwn(LANES, k));
const lanes = keys.map((key) => {
  const found = byProject.get(key);
  const cases = (found?.cases ?? []).sort((a, b) => a.startMs - b.startMs);
  return {
    key,
    ...LANES[key],
    // A lane expected but absent is a job that died before it could report.
    // It is shown as missing, and it fails the run, rather than vanishing.
    missing: !found,
    startedAt: found?.startedAt ?? null,
    durationMs: found?.durationMs ?? 0,
    workers: new Set(cases.map((c) => c.worker)).size,
    totals: tally(cases),
    cases,
  };
});

const allCases = lanes.flatMap((l) => l.cases);
const totals = tally(allCases);
const starts = lanes.map((l) => Date.parse(l.startedAt ?? '')).filter(Number.isFinite);
const runId = env.GITHUB_RUN_ID ?? '';
const sha = env.GITHUB_SHA ?? 'local';

const feed = {
  schema: SCHEMA,
  generatedAt: new Date().toISOString(),
  run: {
    number: Number(env.GITHUB_RUN_NUMBER ?? 0),
    id: runId,
    url: runId ? `${server}/${repository}/actions/runs/${runId}` : '',
    commit: sha.slice(0, 7),
    commitUrl: env.GITHUB_SHA ? `${server}/${repository}/commit/${sha}` : '',
    branch: env.GITHUB_REF_NAME ?? 'local',
    event: env.GITHUB_EVENT_NAME ?? 'local',
    startedAt: starts.length ? new Date(Math.min(...starts)).toISOString() : null,
    wallMs: Math.max(0, ...lanes.map((l) => l.durationMs)),
    conclusion: totals.failed > 0 || lanes.some((l) => l.missing) ? 'failed' : 'passed',
  },
  totals,
  lanes,
  links: {
    dashboard: SITE,
    functional: `${SITE}functional/`,
    visual: `${SITE}visual/`,
    api: `${SITE}api/`,
    health: `${SITE}metrics/`,
    traces: `${SITE}playwright-report/`,
    repository: `${server}/${repository}`,
  },
};

const problems = checkFeed(feed);
if (problems.length) {
  console.error(`the feed does not meet its contract (${SCHEMA}):`);
  for (const p of problems) console.error(`  - ${p}`);
  process.exit(1);
}

let history = [];
if (PREVIOUS) {
  try {
    const previous = JSON.parse(await readFile(resolve(PREVIOUS), 'utf8'));
    if (previous.schema === HISTORY_SCHEMA && Array.isArray(previous.runs)) history = previous.runs;
  } catch {
    // No history yet, or an unreadable one: this run starts it again.
  }
}
history = [
  ...history.filter((r) => r.id !== feed.run.id || !feed.run.id),
  {
    number: feed.run.number,
    id: feed.run.id,
    url: feed.run.url,
    commit: feed.run.commit,
    startedAt: feed.run.startedAt,
    wallMs: feed.run.wallMs,
    conclusion: feed.run.conclusion,
    totals,
  },
]
  .sort((a, b) => a.number - b.number)
  .slice(-HISTORY_LIMIT);

await mkdir(OUT, { recursive: true });
await writeFile(join(OUT, 'latest.json'), JSON.stringify(feed, null, 2) + '\n', 'utf8');
await writeFile(
  join(OUT, 'history.json'),
  JSON.stringify({ schema: HISTORY_SCHEMA, runs: history }, null, 2) + '\n',
  'utf8',
);

console.log(
  `feed written to ${OUT}: run #${feed.run.number} ${feed.run.conclusion}, ` +
    `${totals.cases} cases (${totals.passed} passed, ${totals.failed} failed, ` +
    `${totals.parked} parked) across ${lanes.length} lanes, ${history.length} runs of history`,
);
