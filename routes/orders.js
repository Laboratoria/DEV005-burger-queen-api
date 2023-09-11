const { MongoClient, ObjectId } = require('mongodb');
const {
  requireAuth,
  requireAdmin,
  isAdmin,
  isAuthenticated,
} = require('../middleware/auth');
const Order = require('../models/order');
const config = require('../config');
const { getOrders, getOrderById } = require('../controller/orders');

/** @module orders */
module.exports = (app, nextMain) => {
  /**
   * @name GET /orders
   * @description Lista órdenes
   * @path {GET} /orders
   * @query {String} [page=1] Página del listado a consultar
   * @query {String} [limit=10] Cantitad de elementos por página
   * @header {Object} link Parámetros de paginación
   * @header {String} link.first Link a la primera página
   * @header {String} link.prev Link a la página anterior
   * @header {String} link.next Link a la página siguiente
   * @header {String} link.last Link a la última página
   * @auth Requiere `token` de autenticación
   * @response {Array} orders
   * @response {String} orders[]._id Id
   * @response {String} orders[].userId Id usuaria que creó la orden
   * @response {String} orders[].client Clienta para quien se creó la orden
   * @response {Array} orders[].products Productos
   * @response {Object} orders[].products[] Producto
   * @response {Number} orders[].products[].qty Cantidad
   * @response {Object} orders[].products[].product Producto
   * @response {String} orders[].status Estado: `pending`, `canceled`, `delivering` o `delivered`
   * @response {Date} orders[].dateEntry Fecha de creación
   * @response {Date} [orders[].dateProcessed] Fecha de cambio de `status` a `delivered`
   * @code {200} si la autenticación es correcta
   * @code {401} si no hay cabecera de autenticación
   */
  app.get('/orders', requireAuth, getOrders);

  /**
   * @name GET /orders/:orderId
   * @description Obtiene los datos de una orden especifico
   * @path {GET} /orders/:orderId
   * @params {String} :orderId `id` de la orden a consultar
   * @auth Requiere `token` de autenticación
   * @response {Object} order
   * @response {String} order._id Id
   * @response {String} order.userId Id usuaria que creó la orden
   * @response {String} order.client Clienta para quien se creó la orden
   * @response {Array} order.products Productos
   * @response {Object} order.products[] Producto
   * @response {Number} order.products[].qty Cantidad
   * @response {Object} order.products[].product Producto
   * @response {String} order.status Estado: `pending`, `canceled`, `delivering` o `delivered`
   * @response {Date} order.dateEntry Fecha de creación
   * @response {Date} [order.dateProcessed] Fecha de cambio de `status` a `delivered`
   * @code {200} si la autenticación es correcta
   * @code {401} si no hay cabecera de autenticación
   * @code {404} si la orden con `orderId` indicado no existe
   */
  app.get('/orders/:orderId', requireAuth, getOrderById);

  /**
   * @name POST /orders
   * @description Crea una nueva orden
   * @path {POST} /orders
   * @auth Requiere `token` de autenticación
   * @body {String} userId Id usuaria que creó la orden
   * @body {String} client Clienta para quien se creó la orden
   * @body {Array} products Productos
   * @body {Object} products[] Producto
   * @body {String} products[].productId Id de un producto
   * @body {Number} products[].qty Cantidad de ese producto en la orden
   * @response {Object} order
   * @response {String} order._id Id
   * @response {String} order.userId Id usuaria que creó la orden
   * @response {String} order.client Clienta para quien se creó la orden
   * @response {Array} order.products Productos
   * @response {Object} order.products[] Producto
   * @response {Number} order.products[].qty Cantidad
   * @response {Object} order.products[].product Producto
   * @response {String} order.status Estado: `pending`, `canceled`, `delivering` o `delivered`
   * @response {Date} order.dateEntry Fecha de creación
   * @response {Date} [order.dateProcessed] Fecha de cambio de `status` a `delivered`
   * @code {200} si la autenticación es correcta
   * @code {400} no se indica `userId` o se intenta crear una orden sin productos
   * @code {401} si no hay cabecera de autenticación
   */
  app.post('/orders', requireAuth, async (req, res, next) => {
    try {
      const {
        client, table, products,
      } = req.body;
      const { userId } = req;

      if (!userId || !client || !table || products.length === 0) {
        return res.status(400).json({ message: 'Debe proporcionar los datos mandatorios' });
      }

      // Crear una instancia de MongoClient para conectar con la db
      const mongoClient = new MongoClient(config.dbUrl);
      await mongoClient.connect();
      const db = mongoClient.db();
      const orders = db.collection('orders');

      if (!isAuthenticated(req)) {
        return res.status(401).json({ message: 'Usuario no autenticado' });
      }

      // Obtener fecha y hora actual en formato correcto
      const getDateAndTime = () => {
        const now = new Date();
        return now.toISOString().replace(/[TZ]+/gm, ' ').substring(0, 19);
      };

      // Dar formato a products
      const formatProducts = ([...products]) => products.map(item => {
        const formatedProduct = {
          qty: item.qty,
          product: {
            id: item._id,
            name: item.name,
            price: item.price,
            image: item.image,
            type: item.type,
            dateEntry: item.dateEntry,
          },
        };
        return formatedProduct;
      });

      // Insertar estado si es que viene en la req
      const orderStatus = status => {
        if (status === 'En preparación') {
          return 'En preparación';
        }
        if (status === 'Listo en barra') {
          return 'Listo en barra';
        }
        if (status === 'Entregado') {
          return 'Entregado';
        }
      };

      // Crear nueva orden
      const newOrder = {
        userId,
        client,
        table,
        products: formatProducts(products),
        dateEntry: getDateAndTime(),
        status: 'En preparación',
      };

      if (req.body.status) {
        newOrder.status = orderStatus(req.body.status);
      }

      // Insertar nueva orden en la db
      const insertedOrder = await orders.insertOne(newOrder);
      await mongoClient.close();

      // Enviar la respuesta con los detalles de la orden creada
      res.status(200).json({
        message: 'Orden creada exitosamente',
        id: newOrder._id,
        userId: newOrder.userId,
        client: newOrder.client,
        table: newOrder.table,
        products: newOrder.products,
        status: newOrder.status,
        dateEntry: newOrder.dateEntry,
      });
    } catch (error) {
      console.error('Error al agregar producto', error);
    }
  });

  /**
   * @name PATCH /orders
   * @description Modifica una orden
   * @path {PATCH} /products
   * @params {String} :orderId `id` de la orden
   * @auth Requiere `token` de autenticación
   * @body {String} [userId] Id usuaria que creó la orden
   * @body {String} [client] Clienta para quien se creó la orden
   * @body {Array} [products] Productos
   * @body {Object} products[] Producto
   * @body {String} products[].productId Id de un producto
   * @body {Number} products[].qty Cantidad de ese producto en la orden
   * @body {String} [status] Estado: `pending`, `canceled`, `delivering` o `delivered`
   * @response {Object} order
   * @response {String} order._id Id
   * @response {String} order.userId Id usuaria que creó la orden
   * @response {Array} order.products Productos
   * @response {Object} order.products[] Producto
   * @response {Number} order.products[].qty Cantidad
   * @response {Object} order.products[].product Producto
   * @response {String} order.status Estado: `pending`, `canceled`, `delivering` o `delivered`
   * @response {Date} order.dateEntry Fecha de creación
   * @response {Date} [order.dateProcessed] Fecha de cambio de `status` a `delivered`
   * @code {200} si la autenticación es correcta
   * @code {400} si no se indican ninguna propiedad a modificar o la propiedad `status` no es valida
   * @code {401} si no hay cabecera de autenticación
   * @code {404} si la orderId con `orderId` indicado no existe
   */
  app.patch('/orders/:orderId', requireAuth, async (req, res, next) => {
    try {
      // Obtener los datos desde la req
      const {
        client, table, products, status,
      } = req.body; // nueva data para la orden
      const { orderId } = req.params; // id de orden a cambiar
      const { userId } = req.userId; // usuario haciendo el cambio

      if (!isAuthenticated(req)) {
        return res.status(401).json({ error: 'Sin autorización' });
      }
      if (!client && !products && !table && !status) {
        return res.status(400).json({ message: 'Debe proporcionar información para actulizar orden' });
      }
      if ((client && typeof client !== 'string') || (table && typeof table !== 'number') || (status && typeof status !== 'string') || (products && typeof products !== 'object')) {
        return res.status(400).json({ message: 'Debe proporcionar datos válidos' });
      }

      const validStatus = ['En preparación', 'Listo en barra', 'Entregado'].includes(status);

      if (!validStatus) {
        return res.status(400).json({ message: 'Debe proporcionar datos válidos' });
      }

      const order = await Order.findOne({ _id: orderId });

      if (!order) {
        return res.status(404).json({ error: 'Orden no encontrada' });
      }
      if (client) {
        order.client = client;
      }
      if (table) {
        order.table = table;
      }
      if (status && validStatus) {
        order.status = status;
      }
      if (products) {
        const formatProducts = (products) => products.map(item => {
          const formatedProduct = {
            qty: item.qty,
            product: {
              id: item._id,
              name: item.name,
              price: item.price,
              image: item.image,
              type: item.type,
              dateEntry: item.dateEntry,
            },
          };
          return formatedProduct;
        });
        order.products = formatProducts(products);
      }
      await order.save();

      // Enviar la respuesta con los detalles actualizados
      res.status(200).json({
        message: 'Orden actualizada exitosamente',
        _id: orderId,
        client: order.client,
        table: order.table,
        products: order.products,
        status: order.status,
        dateEntry: order.dateEntry,
      });
    } catch (error) {
      console.error('Error al actulizar orden', error);
    }
  });

  /**
   * @name DELETE /orders
   * @description Elimina una orden
   * @path {DELETE} /orders
   * @params {String} :orderId `id` del producto
   * @auth Requiere `token` de autenticación
   * @response {Object} order
   * @response {String} order._id Id
   * @response {String} order.userId Id usuaria que creó la orden
   * @response {String} order.client Clienta para quien se creó la orden
   * @response {Array} order.products Productos
   * @response {Object} order.products[] Producto
   * @response {Number} order.products[].qty Cantidad
   * @response {Object} order.products[].product Producto
   * @response {String} order.status Estado: `pending`, `canceled`, `delivering` o `delivered`
   * @response {Date} order.dateEntry Fecha de creación
   * @response {Date} [order.dateProcessed] Fecha de cambio de `status` a `delivered`
   * @code {200} si la autenticación es correcta
   * @code {401} si no hay cabecera de autenticación
   * @code {404} si el producto con `orderId` indicado no existe
   */
  app.delete('/orders/:orderId', requireAdmin, async (req, res, next) => {
    try {
      // Obtener el ID o correo de la orden a eliminar desde params
      const { orderId } = req.params;

      // Buscar orden en la db
      const order = await Order.findOne({ _id: orderId });

      // Si usuario no es admin devolver error 403
      if (!isAdmin(req)) {
        return res.status(403).json({ error: 'No tienes autorización para eliminar esta orden' });
      }

      // Si no se encuentra orden, devolver un error 404
      if (!order) {
        return res.status(404).json({ error: 'La orden que intentas eliminar no existe' });
      }

      if (!isAuthenticated) {
        return res.status(401).json({ message: 'Sin autorización' });
      }

      // Eliminar orden de la db
      await order.deleteOne({ _id: order._id });

      // Devolver una respuesta exitosa
      return res.status(200).json({
        message: 'Orden eliminada exitosamente',
        id: order._id,
        userID: order.userId,
        client: order.client,
        table: order.table,
        products: order.products,
        status: order.status,
        dateEntry: order.dateEntry,
      });
    } catch (error) {
      console.error('Error al eliminar la orden', error);
    }
  });

  nextMain();
};
