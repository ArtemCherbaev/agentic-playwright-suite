import type { APIRequestContext, APIResponse } from '@playwright/test';
import type { NewUser } from '../testData.js';

/**
 * The public REST API of the target, as the suite talks to it.
 *
 * Two things about this API shape every method here:
 *
 * 1. The HTTP status is 200 for everything, including refusals. The real
 *    outcome is the `responseCode` field of the body, so every call returns
 *    both and the cases assert on both (see AE-6 in specs/STATUS.md).
 * 2. The body is JSON served as `text/html` (AE-7), so `response.json()` is not
 *    trusted to be the parser; the text is parsed here, and a body that is not
 *    JSON fails with the text in the message rather than a bare SyntaxError.
 *
 * The client acts and reports. It never asserts: that is the case's job.
 */

export interface ApiResult<T> {
  /** The HTTP status line, which on this target says almost nothing. */
  http: number;
  contentType: string;
  body: T;
}

export interface Envelope {
  responseCode: number;
  message?: string;
}

export interface Product {
  id: number;
  name: string;
  price: string;
  brand: string;
  category: { usertype: { usertype: string }; category: string };
}

export interface Brand {
  id: number;
  brand: string;
}

export interface UserDetail {
  id: number;
  name: string;
  email: string;
  title: string;
  birth_day: string;
  birth_month: string;
  birth_year: string;
  first_name: string;
  last_name: string;
  company: string;
  address1: string;
  address2: string;
  country: string;
  state: string;
  city: string;
  zipcode: string;
}

export type ProductList = Envelope & { products: Product[] };
export type BrandList = Envelope & { brands: Brand[] };
export type UserLookup = Envelope & { user?: UserDetail };

export class AutomationExerciseApi {
  constructor(private readonly request: APIRequestContext) {}

  productsList() {
    return this.call<ProductList>(this.request.get('api/productsList'));
  }

  brandsList() {
    return this.call<BrandList>(this.request.get('api/brandsList'));
  }

  /** Omit the term to send the request without the parameter at all. */
  searchProducts(term?: string) {
    return this.call<ProductList>(
      this.request.post(
        'api/searchProduct',
        term === undefined ? {} : { form: { search_product: term } },
      ),
    );
  }

  /** Either field may be left out, to exercise the missing parameter path. */
  verifyLogin(credentials: { email?: string; password?: string }) {
    return this.call<Envelope>(
      this.request.post('api/verifyLogin', { form: compact(credentials) }),
    );
  }

  createAccount(user: NewUser) {
    return this.call<Envelope>(this.request.post('api/createAccount', { form: accountForm(user) }));
  }

  updateAccount(user: NewUser) {
    return this.call<Envelope>(this.request.put('api/updateAccount', { form: accountForm(user) }));
  }

  userByEmail(email: string) {
    return this.call<UserLookup>(
      this.request.get('api/getUserDetailByEmail', { params: { email } }),
    );
  }

  deleteAccount(email: string, password: string) {
    return this.call<Envelope>(
      this.request.delete('api/deleteAccount', { form: { email, password } }),
    );
  }

  /** Any verb against any endpoint, for the cases about verbs an endpoint refuses. */
  send(method: 'GET' | 'POST' | 'PUT' | 'DELETE', path: string) {
    return this.call<Envelope>(this.request.fetch(`api/${path}`, { method }));
  }

  private async call<T>(pending: Promise<APIResponse>): Promise<ApiResult<T>> {
    const response = await pending;
    const text = await response.text();
    let body: T;
    try {
      body = JSON.parse(text) as T;
    } catch {
      throw new Error(
        `${response.url()} answered HTTP ${response.status()} with a body that is not JSON: ${text.slice(0, 200)}`,
      );
    }
    return { http: response.status(), contentType: response.headers()['content-type'] ?? '', body };
  }
}

/** The form the account endpoints take. Field names are the API's, not ours. */
function accountForm(user: NewUser): Record<string, string> {
  return {
    name: user.name,
    email: user.email,
    password: user.password,
    title: 'Mr',
    birth_date: user.day,
    birth_month: user.month,
    birth_year: user.year,
    firstname: user.firstName,
    lastname: user.lastName,
    company: user.company,
    address1: user.address,
    address2: user.address2,
    country: user.country,
    zipcode: user.zipcode,
    state: user.state,
    city: user.city,
    mobile_number: user.mobile,
  };
}

function compact(fields: Record<string, string | undefined>): Record<string, string> {
  return Object.fromEntries(
    Object.entries(fields).filter((entry): entry is [string, string] => entry[1] !== undefined),
  );
}
