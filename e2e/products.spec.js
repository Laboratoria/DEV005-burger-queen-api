const {
  fetch,
  fetchAsTestUser,
  fetchAsAdmin,
} = process;

describe('POST /products', () => {
  it('should fail with 401 when no auth', () => (
    fetch('/products', { method: 'POST' })
      .then((resp) => expect(resp.status).toBe(401))
  ));

  it('should fail with 403 when not admin', () => (
    fetchAsTestUser('/products', { method: 'POST' })
      .then((resp) => expect(resp.status).toBe(403))
  ));

  it('should fail with 400 when bad props', () => (
    fetchAsAdmin('/products', { method: 'POST' })
      .then((resp) => expect(resp.status).toBe(400))
  ));

  it('should create product as admin', () => (
    fetchAsAdmin('/products', {
      method: 'POST',
      body: {
        name: 'Test', price: 5, image: 'url.test', type: 'Desayuno',
      },
    })
      .then((resp) => {
        expect(resp.status).toBe(200);
        return resp.json();
      })
      .then((json) => {
        expect(typeof json.id).toBe('string');
        expect(typeof json.name).toBe('string');
        expect(typeof json.price).toBe('number');
      })
  ));
});

describe('GET /products', () => {
  it('should get products with Auth', () => (
    fetchAsTestUser('/products')
      .then((resp) => {
        expect(resp.status).toBe(200);
        return resp.json();
      })
      .then((json) => {
        expect(Array.isArray(json)).toBe(true);
        json.forEach((product) => {
          expect(typeof product._id).toBe('string');
          expect(typeof product.name).toBe('string');
          expect(typeof product.price).toBe('number');
        });
      })
  ));
});

describe('GET /products/:productid', () => {
  it('should fail with 404 when not found', () => (
    fetchAsTestUser('/products/notarealproduct')
      .then((resp) => expect(resp.status).toBe(404))
  ));

  it('should get product with Auth', () => (
    fetchAsTestUser('/products')
      .then((resp) => {
        console.log(resp, '11111111111111');
        console.log(resp.json(), '222222222');
        expect(resp.status).toBe(200);
        return resp.json();
      })
      .then((json) => {
        expect(Array.isArray(json)).toBe(true);
        expect(json.length > 0).toBe(true);
        console.log(json, '333333333333333');
        json.forEach((product) => {
          expect(typeof product.id).toBe('string');
          expect(typeof product.name).toBe('string');
          expect(typeof product.price).toBe('number');
        });
        return fetchAsTestUser(`/products/${json[0]._id}`)
          .then((resp) => ({ resp, product: json[0] }));
      })
      .then(({ resp, product }) => {
        console.log(resp, '444444444');
        console.log(resp.json(), '55555555');
        expect(resp.status).toBe(200);
        return resp.json().then((json) => ({ json, product }));
      })
      .then(({ json, product }) => {
        console.log(json, '66666');
        expect(json).toEqual(product);
      })
  ));
});

describe('PATCH /products/:productid', () => {
  it('should fail with 401 when no auth', () => (
    fetch('/products/xxx', { method: 'PATCH' })
      .then((resp) => expect(resp.status).toBe(401))
  ));

  it('should fail with 403 when not admin', () => (
    fetchAsAdmin('/products', {
      method: 'POST',
      body: {
        name: 'Sopita', price: 10, image: 'url.test', type: 'Desayuno',
      },
    })
      .then((resp) => {
        expect(resp.status).toBe(200);
        return resp.json();
      })
      .then((json) => fetchAsTestUser(`/products/${json._id}`, {
        method: 'PATCH',
        body: { price: 20 },
      }))
      .then((resp) => expect(resp.status).toBe(403))
  ));

  it('should fail with 404 when admin and not found', () => (
    fetchAsAdmin('/products/12345678901', {
      method: 'PATCH',
      body: { price: 1 },
    })
      .then((resp) => expect(resp.status).toBe(404))
  ));

  it('should fail with 400 when bad props', () => (
    fetchAsAdmin('/products', {
      method: 'POST',
      body: {
        name: 'Test1', price: 10, image: 'url.test', type: 'Desayuno',
      },
    })
      .then((resp) => {
        expect(resp.status).toBe(200);
        return resp.json();
      })
      .then((json) => fetchAsAdmin(`/products/${json._id}`, {
        method: 'PATCH',
        body: { price: 'abc' },
      }))
      .then((resp) => expect(resp.status).toBe(400))
  ));

  it('should update product as admin', () => (
    fetchAsAdmin('/products', {
      method: 'POST',
      body: {
        name: 'Test2', price: 10, image: 'url.test', type: 'Desayuno',
      },
    })
      .then((resp) => {
        expect(resp.status).toBe(200);
        return resp.json();
      })
      .then((json) => fetchAsAdmin(`/products/${json.id}`, {
        method: 'PATCH',
        body: { price: 20 },
      }))
      .then((resp) => {
        expect(resp.status).toBe(200);
        return resp.json();
      })
      .then((json) => expect(json.price).toBe(20))
  ));
});

describe('DELETE /products/:productid', () => {
  it('should fail with 401 when no auth', () => (
    fetch('/products/xxx', { method: 'DELETE' })
      .then((resp) => expect(resp.status).toBe(401))
  ));

  it('should fail with 403 when not admin', () => (
    fetchAsAdmin('/products', {
      method: 'POST',
      body: {
        name: 'NewTest', price: 10, image: 'https://danzadefogones.com/6.jpg', type: 'Desayuno',
      },
    })
      .then((resp) => {
        expect(resp.status).toBe(200);
        return resp.json().then((json) => json);
      })
      .then((json) => fetchAsTestUser(`/products/${json.id}`, { method: 'DELETE' }))
      .then((resp) => expect(resp.status).toBe(403))
  ));

  it('should fail with 404 when admin and not found', () => (
    fetchAsAdmin('/products/64f760b91ca45c829414984e', { method: 'DELETE' })
      .then((resp) => {
        expect(resp.status).toBe(404);
      })
  ));

  it('should delete other product as admin', () => (
    fetchAsAdmin('/products', {
      method: 'POST',
      body: {
        name: 'Pepino', price: 10, image: 'https://danzadefogones.jpg', type: 'Desayuno',
      },
    })
      .then((resp) => {
        expect(resp.status).toBe(200);
        return resp.json().then((json) => json);
      })
      .then((json) => fetchAsAdmin(`/products/${json.id}`, { method: 'DELETE' }))
      .then((resp) => {
        expect(resp.status).toBe(200);
        return resp.json().then((json) => json);
      })
      .then((json) => fetchAsAdmin(`/products/${json.id}`, { method: 'GET' }))
      .then((resp) => {
        expect(resp.status).toBe(404);
      })
  ));
});
