const { MongoClient } = require('mongodb');
const Order = require('../models/order');
const { isAdmin, isAuthenticated } = require('../middleware/auth.js')
const config = require('../config');
const { dbUrl } = config;
const client = new MongoClient(dbUrl);
const { paginate } = require('../utils/paginate')

module.exports = {
  getOrders: async (req, res, next) => {
    try { 
      const orders = await Order.find();
      const page = req.query.page ? parseInt(req.query.page) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit) : 20;
      const currentPage = paginate(orders, page, limit)
      
      res.set('Link', '</orders?page=' + currentPage.prev + '&limit=' + currentPage.limit + '>; rel="prev" , </orders?page=' + currentPage.next + '&limit=' + currentPage.limit + '>; rel="next" , </orders?page=' + currentPage.first + '&limit=' + currentPage.limit + '>; rel="first" , </orders?page=' + currentPage.last + '&limit=' + currentPage.limit + '>; rel="last"');
      res.set('total-count', orders.length);
      res.status(200).json(currentPage.pageData)
          
    } catch (error) {
        console.error('Error al obtener las órdenes', error);
    } finally {
      client.close();
    }
  },
  getOrderById: async (req, res, next) => {
    try {
      const { orderId } = req.params;
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