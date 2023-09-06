const config = require('../config');

const { fetch, fetchWithAuth } = process;

describe('POST /auth', () => {
  it('should respond with 400 when email and password missing', () => (
    fetch('/auth', { method: 'POST' })
      .then((resp) => expect(resp.status).toBe(400))
  ));

  it('should respond with 400 when email is missing', () => (
    fetch('/auth', {
      method: 'POST',
      body: { email: '', password: 'xxxx' },
    })
      .then((resp) => expect(resp.status).toBe(400))
  ));

  it('should respond with 400 when password is missing', () => (
    fetch('/auth', {
      method: 'POST',
      body: { email: 'foo@bar.baz' },
    })
      .then((resp) => expect(resp.status).toBe(400))
  ));

  it('fail with 404 credentials dont match', () => (
    fetch('/auth', {
      method: 'POST',
      body: { email: `foo-${Date.now()}@bar.baz`, password: 'xxxx' },
    })
      .then((resp) => expect(resp.status).toBe(404))
  ));

  it('should create new auth token and allow access using it', () => (
    fetch('/auth', {
      method: 'POST',
      body: { email: config.adminEmail, password: config.adminPassword },
    })
      .then((resp) => {
        console.log(config.adminEmail, config.adminPassword, 'nueeeeeeeevo', resp);
        expect(resp.status).toBe(200);
        return resp.json();
      })
      .then(({ accessToken }) => fetchWithAuth(accessToken)(`/users/${config.adminEmail}`))
      .then((resp) => {
        console.log(resp, 'laaaaast');
        expect(resp.status).toBe(200);
        return resp.json();
      })
      .then((json) => expect(json.email).toBe(config.adminEmail))
  ));
});
