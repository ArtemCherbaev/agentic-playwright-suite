import { randomUUID } from 'node:crypto';

/**
 * Test data.
 *
 * The target is a shared public demo with a real database, so two runs starting
 * at the same moment will collide on anything fixed. Every account this suite
 * creates is unique per call and deleted by the test that made it. Nothing here
 * is read from a file: data that lives beside the test is data a reader can see
 * without opening a second window.
 */

export interface NewUser {
  name: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  company: string;
  address: string;
  address2: string;
  country: string;
  state: string;
  city: string;
  zipcode: string;
  mobile: string;
  day: string;
  month: string;
  year: string;
}

/**
 * A fresh account. The email carries the run so an orphan left by a crashed run
 * can be told apart from one left by a bug.
 */
export function newUser(overrides: Partial<NewUser> = {}): NewUser {
  const id = randomUUID().slice(0, 8);
  return {
    name: `Suite User ${id}`,
    email: `suite.${id}@example.invalid`,
    password: `Pw-${id}-42`,
    firstName: 'Suite',
    lastName: 'User',
    company: 'Agentic Playwright Suite',
    address: '1 Pipeline Way',
    address2: 'Floor 2',
    country: 'Canada',
    state: 'Ontario',
    city: 'Toronto',
    zipcode: 'M5H 2N2',
    mobile: '+15550000000',
    day: '12',
    month: 'June',
    year: '1990',
    ...overrides,
  };
}

/** A message for the contact form, unique enough to find in a mailbox. */
export function contactMessage() {
  const id = randomUUID().slice(0, 8);
  return {
    name: `Suite ${id}`,
    email: `suite.${id}@example.invalid`,
    subject: `Automated check ${id}`,
    message: `Sent by the agentic Playwright suite, run marker ${id}. No reply needed.`,
  };
}

/**
 * Products referenced by more than one case. Ids are stable on this target; the
 * names are asserted so a silently reshuffled catalogue fails loudly here
 * rather than confusingly in a cart assertion three cases later.
 */
export const Products = {
  blueTop: { id: 1, name: 'Blue Top', price: 'Rs. 500' },
  menTshirt: { id: 2, name: 'Men Tshirt', price: 'Rs. 400' },
  sleevelessDress: { id: 3, name: 'Sleeveless Dress', price: 'Rs. 1000' },
} as const;

export const SearchTerm = {
  /** Matches several products across categories. */
  broad: 'top',
  /** Matches nothing, so the empty state is covered rather than assumed. */
  none: 'zzzznotaproduct',
} as const;
