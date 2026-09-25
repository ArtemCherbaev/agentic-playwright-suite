import { test, expect } from '@fixtures/api';
import { newUser } from '@utils/testData';

/**
 * The account endpoints, over their whole lifecycle: create, log in, read,
 * update, delete. Each case gets its own account from the fixture, which also
 * deletes it, so no case depends on another having run first.
 */
test.describe('Account API', { tag: ['@api', '@account'] }, () => {
  test('API-07 an account created over the API can log in', async ({ api }) => {
    const user = newUser();

    const created = await api.createAccount(user);
    try {
      expect(created.http).toBe(200);
      expect(created.body).toEqual({ responseCode: 201, message: 'User created!' });

      const login = await api.verifyLogin({ email: user.email, password: user.password });
      expect(login.body).toEqual({ responseCode: 200, message: 'User exists!' });
    } finally {
      await api.deleteAccount(user.email, user.password);
    }
  });

  test('API-08 the same email cannot register twice', async ({ api, apiAccount }) => {
    const again = await api.createAccount(apiAccount);

    expect(again.http).toBe(200);
    expect(again.body).toEqual({ responseCode: 400, message: 'Email already exists!' });
  });

  test('API-09 the wrong password is refused without saying which field was wrong', async ({
    api,
    apiAccount,
  }) => {
    const { http, body } = await api.verifyLogin({
      email: apiAccount.email,
      password: `${apiAccount.password}-wrong`,
    });

    expect(http).toBe(200);
    // Same answer as an unknown email: the API does not confirm that an
    // account exists to someone who does not hold its password.
    expect(body).toEqual({ responseCode: 404, message: 'User not found!' });
  });

  test('API-10 a login without an email is refused with 400, a DELETE with 405', async ({
    api,
  }) => {
    const missing = await api.verifyLogin({ password: 'irrelevant' });
    expect(missing.http).toBe(200);
    expect(missing.body).toEqual({
      responseCode: 400,
      message: 'Bad request, email or password parameter is missing in POST request.',
    });

    const wrongVerb = await api.send('DELETE', 'verifyLogin');
    expect(wrongVerb.http).toBe(200);
    expect(wrongVerb.body).toEqual({
      responseCode: 405,
      message: 'This request method is not supported.',
    });
  });

  test('API-11 an update is visible in the account details straight away', async ({
    api,
    apiAccount,
  }) => {
    const before = await api.userByEmail(apiAccount.email);
    expect(before.body.responseCode).toBe(200);
    expect(before.body.user).toMatchObject({
      email: apiAccount.email,
      city: apiAccount.city,
      company: apiAccount.company,
    });

    const moved = {
      ...apiAccount,
      city: 'Vancouver',
      state: 'British Columbia',
      company: 'Moved Co',
    };
    const updated = await api.updateAccount(moved);
    expect(updated.http).toBe(200);
    expect(updated.body).toEqual({ responseCode: 200, message: 'User updated!' });

    const after = await api.userByEmail(apiAccount.email);
    expect(after.body.user).toMatchObject({
      id: before.body.user?.id,
      city: 'Vancouver',
      state: 'British Columbia',
      company: 'Moved Co',
    });
  });

  test('API-12 a deleted account can no longer log in or be looked up', async ({
    api,
    apiAccount,
  }) => {
    const deleted = await api.deleteAccount(apiAccount.email, apiAccount.password);
    expect(deleted.http).toBe(200);
    expect(deleted.body).toEqual({ responseCode: 200, message: 'Account deleted!' });

    const login = await api.verifyLogin({ email: apiAccount.email, password: apiAccount.password });
    expect(login.body).toEqual({ responseCode: 404, message: 'User not found!' });

    const lookup = await api.userByEmail(apiAccount.email);
    expect(lookup.body).toEqual({
      responseCode: 404,
      message: 'Account not found with this email, try another email!',
    });
  });
});
