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

      // Verificar si hay autorización
      if (!isAuthenticated) {
        return res.status(401).json({ message: 'Sin autorización' });
      }

      const order = await Order.findOne({ _id: orderId });
      
      // Si no se encuentra el producto, devolver error 404
      if (!order) {
        return res.status(404).json({ error: 'La orden no existe' });
      }
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
    } catch (err) {
      console.error("error al buscar la orden", err);
      next(err);
    } finally {
      client.close();
    }
  },
};