import type { BrowserContext, TestInfo } from '@playwright/test';

/**
 * Tells a failure caused by the target being down apart from a failure in the
 * suite.
 *
 * The target is a shared public demo behind Cloudflare, and under load it
 * answers with its own "under heavy load (queue full)" page as HTTP 503, or
 * Cloudflare answers 520 for it. Neither is an error the suite can see from the
 * locator that then fails: a 503 on `/add_to_cart` shows up as a cart modal that
 * never opened, and a 520 on a form post shows up as a header that never said
 * "Logged in as". Both were filed as WebKit failures before anyone opened the
 * trace and found the host's error page in it.
 *
 * This records every 5xx the target's own host returns while a case runs. When
 * the case fails and the host has answered 5xx, the failure gets a
 * `host-unavailable` annotation and a second error naming each request, so the
 * CI log and every report say so beside the original error. Nothing is retried
 * and nothing is skipped: the case still fails, because the run did not show
 * the application working. The classification is the flake policy's
 * `third party noise`, with the evidence attached.
 */

export const HOST_UNAVAILABLE = 'host-unavailable';

interface HostError {
  status: number;
  method: string;
  path: string;
}

/** Cloudflare's own beacon on the target; its answers say nothing about the application. */
const IGNORED_PATH = /^\/cdn-cgi\//;

export class HostOutageRecorder {
  private readonly errors: HostError[] = [];

  constructor(
    context: BrowserContext,
    private readonly host: string,
  ) {
    context.on('response', (response) => {
      if (response.status() < 500) return;
      const url = new URL(response.url());
      if (url.hostname !== this.host || IGNORED_PATH.test(url.pathname)) return;
      this.errors.push({
        status: response.status(),
        method: response.request().method(),
        path: url.pathname + url.search,
      });
    });
  }

  /**
   * Called in teardown. Returns the error to raise when a failed case met a
   * host that was answering 5xx, after annotating the case; null otherwise.
   */
  async verdict(testInfo: TestInfo): Promise<Error | null> {
    if (testInfo.status === testInfo.expectedStatus || this.errors.length === 0) return null;

    const lines = this.errors.map((e) => `HTTP ${e.status} on ${e.method} ${e.path}`);
    const summary =
      lines.length === 1 ? lines[0] : `${lines[0]} and ${lines.length - 1} more 5xx from the host`;

    testInfo.annotations.push({ type: HOST_UNAVAILABLE, description: `${this.host}: ${summary}` });
    await testInfo.attach('host-errors', {
      body: JSON.stringify(this.errors, null, 2),
      contentType: 'application/json',
    });

    return new Error(
      `${this.host} was unavailable during this case, so its failure is not evidence ` +
        `against the suite or the application:\n  ${lines.join('\n  ')}`,
    );
  }
}
