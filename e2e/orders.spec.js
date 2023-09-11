const {
  fetch,
  fetchAsTestUser,
  fetchAsAdmin,
} = process;

describe('POST /orders', () => {
  it('should fail with 401 when no auth', () => (
    fetch('/orders', { method: 'POST' })
      .then((resp) => expect(resp.status).toBe(401))
  ));

  it('should fail with 400 when bad props', () => (
    fetchAsTestUser('/orders', { method: 'POST', body: {} })
      .then((resp) => expect(resp.status).toBe(400))
  ));

  it('should fail with 400 when empty items', () => (
    fetchAsTestUser('/orders', {
      method: 'POST',
      body: { products: [] },
    })
      .then((resp) => {
        expect(resp.status).toBe(400);
      })
  ));

  it('should create order as user (own order)', () => (
    Promise.all([
      fetchAsAdmin('/products', {
        method: 'POST',
        body: {
          name: 'Test', price: 10, image: 'image.url', type: 'Desayuno',
        },
      }),
      fetchAsTestUser('/users/ejemplo@email.com'),
    ])
      .then((resp) => {
        expect(resp[0].status).toBe(200);
        expect(resp[1].status).toBe(200);
        return Promise.all([resp[0].json(), resp[1].json()]);
      })
      .then(([product, user]) => fetchAsTestUser('/orders', {
        method: 'POST',
        body: {
          client: 'client',
          table: 5,
          products: [{
            _id: product._id,
            name: product.name,
            qty: 5,
            price: product.price,
            image: product.image,
            type: product.type,
            dateEntry: product.dateEntry,
          }],
        },
      }))
      .then((resp) => {
        expect(resp.status).toBe(200);
        return resp.json();
      })
      .then((json) => {
        expect(typeof json.id).toBe('string');
        expect(json.client).toBe('client');
        expect(typeof json.dateEntry).toBe('string');
        expect(Array.isArray(json.products)).toBe(true);
        expect(json.products.length).toBe(1);
        expect(json.products[0].product.name).toBe('Test');
        expect(json.products[0].product.price).toBe(10);
      })
  ));

  it('should create order as admin', () => (
    Promise.all([
      fetchAsAdmin('/products', {
        method: 'POST',
        body: {
          name: 'Test1', price: 25, image: 'image.url', type: 'Desayuno',
        },
      }),
      fetchAsTestUser('/users/ejemplo@email.com'),
    ])
      .then((resp) => {
        expect(resp[0].status).toBe(200);
        expect(resp[1].status).toBe(200);
        return Promise.all([resp[0].json(), resp[1].json()]);
      })
      .then(([product, user]) => fetchAsAdmin('/orders', {
        method: 'POST',
        body: {
          client: 'Test',
          table: 5,
          products: [{
            _id: product._id,
            name: product.name,
            qty: 25,
            price: product.price,
            image: product.image,
            type: product.type,
            dateEntry: product.dateEntry,
          }],
        },
      }))
      .then((resp) => {
        expect(resp.status).toBe(200);
        return resp.json();
      })
      .then((json) => {
        expect(typeof json.id).toBe('string');
        expect(typeof json.dateEntry).toBe('string');
        expect(Array.isArray(json.products)).toBe(true);
        expect(json.products.length).toBe(1);
        expect(json.products[0].product.name).toBe('Test1');
        expect(json.products[0].product.price).toBe(25);
      })
  ));
});

describe('GET /orders', () => {
  it('should fail with 401 when no auth', () => (
    fetch('/orders')
      .then((resp) => expect(resp.status).toBe(401))
  ));

  it('should get orders as user', () => (
    Promise.all([
      fetchAsAdmin('/products', {
        method: 'POST',
        body: {
          name: 'Test2', price: 10, image: 'image.url', type: 'Desayuno',
        },
      }),
      fetchAsTestUser('/users/ejemplo@email.com'),
    ])
      .then((responses) => {
        expect(responses[0].status).toBe(200);
        expect(responses[1].status).toBe(200);
        return Promise.all([responses[0].json(), responses[1].json()]);
      })
      .then(([product, user]) => (
        Promise.all([
          fetchAsTestUser('/orders', {
            method: 'POST',
            body: {
              client: 'Test',
              table: 5,
              products: [{
                _id: product._id,
                name: product.name,
                qty: 50,
                price: product.price,
                image: product.image,
                type: product.type,
                dateEntry: product.dateEntry,
              }],
            },
          }),
          fetchAsAdmin('/orders', {
            method: 'POST',
            body: {
              client: 'Test',
              table: 5,
              products: [{
                _id: product._id,
                name: product.name,
                qty: 25,
                price: product.price,
                image: product.image,
                type: product.type,
                dateEntry: product.dateEntry,
              }],
            },
          }),
        ])
          .then((responses) => {
            expect(responses[0].status).toBe(200);
            expect(responses[1].status).toBe(200);
            return fetchAsTestUser('/orders');
          })
          .then((resp) => {
            expect(resp.status).toBe(200);
            return resp.json();
          })
      ))
      .then((orders) => {
        expect(Array.isArray(orders)).toBe(true);
        expect(orders.length > 0);
        const userIds = orders.reduce((memo, order) => (
          (memo.indexOf(order.userId) === -1)
            ? [...memo, order.userId]
            : memo
        ), []);
        expect(userIds.length >= 1).toBe(true);
      })
  ));

  it('should get orders as admin', () => (
    Promise.all([
      fetchAsAdmin('/products', {
        method: 'POST',
        body: {
          name: 'Test3', price: 10, image: 'image.url', type: 'Desayuno',
        },
      }),
      fetchAsTestUser('/users/ejemplo@email.com'),
    ])
      .then((responses) => {
        expect(responses[0].status).toBe(200);
        expect(responses[1].status).toBe(200);
        return Promise.all([responses[0].json(), responses[1].json()]);
      })
      .then(([product, user]) => (
        Promise.all([
          fetchAsTestUser('/orders', {
            method: 'POST',
            body: {
              client: 'Test',
              table: 5,
              products: [{
                _id: product._id,
                name: product.name,
                qty: 50,
                price: product.price,
                image: product.image,
                type: product.type,
                dateEntry: product.dateEntry,
              }],
            },
          }),
          fetchAsAdmin('/orders', {
            method: 'POST',
            body: {
              client: 'Test',
              table: 5,
              products: [{
                _id: product._id,
                name: product.name,
                qty: 25,
                price: product.price,
                image: product.image,
                type: product.type,
                dateEntry: product.dateEntry,
              }],
            },
          }),
        ])
          .then((responses) => {
            expect(responses[0].status).toBe(200);
            expect(responses[1].status).toBe(200);
            return fetchAsAdmin('/orders');
          })
          .then((resp) => {
            expect(resp.status).toBe(200);
            return resp.json();
          })
      ))
      .then((orders) => {
        expect(Array.isArray(orders)).toBe(true);
        expect(orders.length > 0);
        const userIds = orders.reduce((memo, order) => (
          (memo.indexOf(order.userId) === -1)
            ? [...memo, order.userId]
            : memo
        ), []);
        expect(userIds.length >= 1).toBe(true);
      })
  ));
});

describe('GET /orders/:orderId', () => {
  it('should fail with 401 when no auth', () => (
    fetch('/orders/64f9439a261b7b55d146d254')
      .then((resp) => expect(resp.status).toBe(401))
  ));

  it('should fail with 404 when admin and not found', () => (
    fetchAsAdmin('/orders/64f9439a261b7b55d146d254')
      .then((resp) => expect(resp.status).toBe(404))
  ));

  it('should get order as user', () => (
    Promise.all([
      fetchAsAdmin('/products', {
        method: 'POST',
        body: {
          name: 'Test4', price: 99, image: 'image.url', type: 'Desayuno',
        },
      }),
      fetchAsTestUser('/users/ejemplo@email.com'),
    ])
      .then((responses) => {
        expect(responses[0].status).toBe(200);
        expect(responses[1].status).toBe(200);
        return Promise.all([responses[0].json(), responses[1].json()]);
      })
      .then(([product, user]) => fetchAsTestUser('/orders', {
        method: 'POST',
        body: {
          client: 'Test',
          table: 5,
          products: [{
            _id: product._id,
            name: product.name,
            qty: 5,
            price: product.price,
            image: product.image,
            type: product.type,
            dateEntry: product.dateEntry,
          }],
        },
      }))
      .then((resp) => {
        expect(resp.status).toBe(200);
        return resp.json();
      })
      .then((json) => fetchAsTestUser(`/orders/${json.id}`))
      .then((resp) => {
        expect(resp.status).toBe(200);
        return resp.json();
      })
      .then((json) => {
        expect(json.products.length).toBe(1);
        expect(json.products[0].product.name).toBe('Test4');
        expect(json.products[0].product.price).toBe(99);
      })
  ));

  it('should get order as admin', () => (
    Promise.all([
      fetchAsAdmin('/products', {
        method: 'POST',
        body: {
          name: 'Test5', price: 10, image: 'image.url', type: 'Desayuno',
        },
      }),
      fetchAsTestUser('/users/ejemplo@email.com'),
    ])
      .then((responses) => {
        expect(responses[0].status).toBe(200);
        expect(responses[1].status).toBe(200);
        return Promise.all([responses[0].json(), responses[1].json()]);
      })
      .then(([product, user]) => fetchAsTestUser('/orders', {
        method: 'POST',
        body: {
          client: 'Test',
          table: 5,
          products: [{
            _id: product._id,
            name: product.name,
            qty: 5,
            price: product.price,
            image: product.image,
            type: product.type,
            dateEntry: product.dateEntry,
          }],
        },
      }))
      .then((resp) => {
        expect(resp.status).toBe(200);
        return resp.json();
      })
      .then((json) => fetchAsAdmin(`/orders/${json.id}`))
      .then((resp) => {
        expect(resp.status).toBe(200);
        return resp.json();
      })
      .then((json) => {
        expect(json.products.length).toBe(1);
        expect(json.products[0].product.name).toBe('Test5');
        expect(json.products[0].product.price).toBe(10);
      })
  ));
});

describe('PATCH /orders/:orderId', () => {
  it('should fail with 401 when no auth', () => (
    fetch('/orders/64f9439a261b7b55d146d254', { method: 'PATCH' })
      .then((resp) => expect(resp.status).toBe(401))
  ));

  it('should fail with 404 when not found', () => (
    fetchAsAdmin('/orders/64f9439a261b7b55d146d254', {
      method: 'PATCH',
      body: { status: 'Entregado' },
    })
      .then((resp) => expect(resp.status).toBe(404))
  ));

  it('should fail with 400 when bad props', () => (
    Promise.all([
      fetchAsAdmin('/products', {
        method: 'POST',
        body: {
          name: 'Test6', price: 66, image: 'image.url', type: 'Desayuno',
        },
      }),
      fetchAsTestUser('/users/ejemplo@email.com'),
    ])
      .then((responses) => {
        expect(responses[0].status).toBe(200);
        expect(responses[1].status).toBe(200);
        return Promise.all([responses[0].json(), responses[1].json()]);
      })
      .then(([product, user]) => fetchAsTestUser('/orders', {
        method: 'POST',
        body: {
          client: 'Test',
          table: 5,
          products: [{
            _id: product._id,
            name: product.name,
            qty: 5,
            price: product.price,
            image: product.image,
            type: product.type,
            dateEntry: product.dateEntry,
          }],
        },
      }))
      .then((resp) => {
        expect(resp.status).toBe(200);
        return resp.json();
      })
      .then((json) => fetchAsTestUser(`/orders/${json.id}`))
      .then((resp) => resp.json())
      .then((json) => fetchAsAdmin(`/orders/${json.id}`, { method: 'PATCH' }))
      .then((resp) => expect(resp.status).toBe(400))
  ));

  it('should fail with 400 when bad status', () => (
    Promise.all([
      fetchAsAdmin('/products', {
        method: 'POST',
        body: {
          name: 'Test7', price: 66, image: 'image.url', type: 'Desayuno',
        },
      }),
      fetchAsTestUser('/users/ejemplo@email.com'),
    ])
      .then((resp) => {
        expect(resp[0].status).toBe(200);
        expect(resp[1].status).toBe(200);
        return Promise.all([resp[0].json(), resp[1].json()]);
      })
      .then(([product, user]) => fetchAsTestUser('/orders', {
        method: 'POST',
        body: {
          client: 'Test',
          table: 5,
          products: [{
            _id: product._id,
            name: product.name,
            qty: 5,
            price: product.price,
            image: product.image,
            type: product.type,
            dateEntry: product.dateEntry,
          }],
        },
      }))
      .then((resp) => {
        expect(resp.status).toBe(200);
        return resp.json();
      })
      .then((json) => fetchAsAdmin(`/orders/${json.id}`, {
        method: 'PATCH',
        body: { status: 'oh yeah!' },
      }))
      .then((resp) => expect(resp.status).toBe(400))
  ));

  it('should update order (set status to "En preparación")', () => (
    Promise.all([
      fetchAsAdmin('/products', {
        method: 'POST',
        body: {
          name: 'Test8', price: 10, image: 'image.url', type: 'Desayuno',
        },
      }),
      fetchAsTestUser('/users/ejemplo@email.com'),
    ])
      .then((responses) => {
        expect(responses[0].status).toBe(200);
        expect(responses[1].status).toBe(200);
        return Promise.all([responses[0].json(), responses[1].json()]);
      })
      .then(([product, user]) => fetchAsTestUser('/orders', {
        method: 'POST',
        body: {
          client: 'Test',
          table: 5,
          products: [{
            _id: product._id,
            name: product.name,
            qty: 50,
            price: product.price,
            image: product.image,
            type: product.type,
            dateEntry: product.dateEntry,
          }],
          status: 'Listo en barra',
        },
      }))
      .then((resp) => {
        expect(resp.status).toBe(200);
        return resp.json();
      })
      .then((json) => {
        expect(json.status).toBe('Listo en barra');
        return fetchAsAdmin(`/orders/${json.id}`, {
          method: 'PATCH',
          body: { status: 'En preparación' },
        });
      })
      .then((resp) => {
        expect(resp.status).toBe(200);
        return resp.json();
      })
      .then((json) => expect(json.status).toBe('En preparación'))
  ));

  it('should update order (set status to "Listo en barra")', () => (
    Promise.all([
      fetchAsAdmin('/products', {
        method: 'POST',
        body: {
          name: 'Test9', price: 66, image: 'image.url', type: 'Desayuno',
        },
      }),
      fetchAsTestUser('/users/ejemplo@email.com'),
    ])
      .then((responses) => {
        expect(responses[0].status).toBe(200);
        expect(responses[1].status).toBe(200);
        return Promise.all([responses[0].json(), responses[1].json()]);
      })
      .then(([product, user]) => fetchAsTestUser('/orders', {
        method: 'POST',
        body: {
          client: 'Test',
          table: 5,
          products: [{
            _id: product._id,
            name: product.name,
            qty: 5,
            price: product.price,
            image: product.image,
            type: product.type,
            dateEntry: product.dateEntry,
          }],
        },
      }))
      .then((resp) => {
        expect(resp.status).toBe(200);
        return resp.json();
      })
      .then((json) => {
        expect(json.status).toBe('En preparación');
        return fetchAsAdmin(`/orders/${json.id}`, {
          method: 'PATCH',
          body: { status: 'Listo en barra' },
        });
      })
      .then((resp) => {
        expect(resp.status).toBe(200);
        return resp.json();
      })
      .then((json) => expect(json.status).toBe('Listo en barra'))
  ));

  it('should update order (set status to "Entregado")', () => (
    Promise.all([
      fetchAsAdmin('/products', {
        method: 'POST',
        body: {
          name: 'Testa', price: 66, image: 'image.url', type: 'Desayuno',
        },
      }),
      fetchAsTestUser('/users/ejemplo@email.com'),
    ])
      .then((responses) => {
        expect(responses[0].status).toBe(200);
        expect(responses[1].status).toBe(200);
        return Promise.all([responses[0].json(), responses[1].json()]);
      })
      .then(([product, user]) => fetchAsTestUser('/orders', {
        method: 'POST',
        body: {
          client: 'Test',
          table: 5,
          products: [{
            _id: product._id,
            name: product.name,
            qty: 5,
            price: product.price,
            image: product.image,
            type: product.type,
            dateEntry: product.dateEntry,
          }],
        },
      }))
      .then((resp) => {
        expect(resp.status).toBe(200);
        return resp.json();
      })
      .then((json) => {
        expect(json.status).toBe('En preparación');
        return fetchAsAdmin(`/orders/${json.id}`, {
          method: 'PATCH',
          body: { status: 'Entregado' },
        });
      })
      .then((resp) => {
        expect(resp.status).toBe(200);
        return resp.json();
      })
      .then((json) => {
        expect(json.status).toBe('Entregado');
        // expect(typeof json.dateProcessed).toBe('string');
      })
  ));
});

describe('DELETE /orders/:orderId', () => {
  it('should fail with 401 when no auth', () => (
    fetch('/orders/64f9439a261b7b55d146d254', { method: 'DELETE' })
      .then((resp) => expect(resp.status).toBe(401))
  ));

  it('should fail with 404 when not found', () => (
    fetchAsAdmin('/orders/64f9439a261b7b55d146d254', { method: 'DELETE' })
      .then((resp) => expect(resp.status).toBe(404))
  ));

  it('should delete other order as admin', () => (
    Promise.all([
      fetchAsAdmin('/products', {
        method: 'POST',
        body: {
          name: 'Teste', price: 25, image: 'image.url', type: 'Desayuno',
        },
      }),
      fetchAsTestUser('/users/ejemplo@email.com'),
    ])
      .then((responses) => {
        expect(responses[0].status).toBe(200);
        expect(responses[1].status).toBe(200);
        return Promise.all([responses[0].json(), responses[1].json()]);
      })
      .then(([product, user]) => fetchAsTestUser('/orders', {
        method: 'POST',
        body: {
          client: 'Test',
          table: 5,
          products: [{
            _id: product._id,
            name: product.name,
            qty: 5,
            price: product.price,
            image: product.image,
            type: product.type,
            dateEntry: product.dateEntry,
          }],
        },
      }))
      .then((resp) => {
        expect(resp.status).toBe(200);
        return resp.json();
      })
      .then(
        ({ id }) => fetchAsAdmin(`/orders/${id}`, { method: 'DELETE' })
          .then((resp) => ({ resp, id })),
      )
      .then(({ resp, id }) => {
        expect(resp.status).toBe(200);
        return fetchAsAdmin(`/orders/${id}`);
      })
      .then((resp) => expect(resp.status).toBe(404))
  ));
});
