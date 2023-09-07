const { MongoClient } = require('mongodb');
const Order = require('../models/order');
const { isAdmin, isAuthenticated } = require('../middleware/auth.js')
const config = require('../config');
const { dbUrl } = config;
const client = new MongoClient(dbUrl);

module.exports = {
  getOrders: async (req, res, next) => {
    try {
      const orders = await Order.find();
      // Si req incluye paginación 
      if (req.query.page && req.query.limit) {
        const page = parseInt(req.query.page);
        const limit = parseInt(req.query.limit);
        const startIndex = (page - 1) * limit;
        const endIndex = page * limit
        const paginatedOrders = orders.slice(startIndex, endIndex);
        res.status(200).json(paginatedOrders)
    } else {
        res.status(200).json(orders)
    }
    } catch (err) {
      console.log("error al mostrar las órdenes", err);
      next(err);
    } finally {
      client.close();
    }
  },
  getOrderById: async (req, res, next) => {
    try {
      const body = req.body; 
      const { orderId } = req.params;
      const { userId } = req.userId
      const order = await Order.findOne({ _id: orderId });
      console.log('producto encontrado es', order);

      // Si no se encuentra el producto, devolver error 404
      if (!order) {
        console.log('Orden no encontrada');
        return res.status(404).json({ error: 'La orden no existe' });
      }

      // Verificar si hay autorización
      if (!isAuthenticated) {
        console.log('no hay cabezera de auth', isAuthenticated);
        return res.status(401).json({ message: 'No hay infromación de autorización' });
      }
      // Si es admin o usuario autenticado
      if( isAdmin(req) || isAuthenticated(req)) {
        res.status(200).json({
          message: 'Orden encontrada',
          id: order._id,
          userID: order.userId,
          client: order.client,
          table: order.table,
          products: order.products,
          status: order.status,
          dateEntry: order.dateEntry,
        });
      }
    } catch (err) {
      console.log("error al buscar la orden", err);
      next(err);
    } finally {
      client.close();
    }
  },
};