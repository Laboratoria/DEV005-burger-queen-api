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
        name: 'fideos1', price: 5, image: 'url.test', type: 'Desayuno',
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
    fetchAsAdmin('/products/64fcaa53058d3c44a9f73d4a', { method: 'GET' })
      .then((resp) => expect(resp.status).toBe(404))
  ));

  it('should get product with Auth', () => (
    fetchAsTestUser('/products')
      .then((resp) => {
        expect(resp.status).toBe(200);
        return resp.json().then((json) => json);
      })
      .then((json) => {
        expect(Array.isArray(json)).toBe(true);
        expect(json.length > 0).toBe(true);
        const productId = json[0]._id;
        return fetchAsTestUser(`/products/${productId}`, { method: 'GET' });
      })
      .then((resp) => {
        expect(resp.status).toBe(200);
        return resp.json().then((json) => json);
      })
      .then((json) => {
        expect(typeof json.id).toBe('string');
        expect(typeof json.name).toBe('string');
        expect(typeof json.price).toBe('number');
        expect(json).toHaveProperty('dateEntry');
      })
      .catch((error) => {
        throw error;
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
    fetchAsAdmin('/products/64fcaa53058d3c44a9f73d4a', {
      method: 'PATCH',
      body: { name: 'carne', price: 1 },
    })
      .then((resp) => {
        expect(resp.status).toBe(404);
      })
  ));

  it('should fail with 400 when bad props', () => (
    fetchAsAdmin('/products', {
      method: 'POST',
      body: {
        name: 'Test11', price: 10, image: 'url.test', type: 'Desayuno',
      },
    })
      .then((resp) => {
        expect(resp.status).toBe(200);
        return resp.json();
      })
      .then((json) => fetchAsAdmin(`/products/${json.id}`, {
        method: 'PATCH',
        body: { price: 'abc' },
      }))
      .then((resp) => expect(resp.status).toBe(400))
  ));

  it('should update product as admin', () => (
    fetchAsAdmin('/products', {
      method: 'POST',
      body: {
        name: 'Test21', price: 10, image: 'url.test', type: 'Desayuno',
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
