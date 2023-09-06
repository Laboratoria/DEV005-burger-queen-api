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

    } catch (err) {
      console.log("error al buscar la orden", err);
      next(err);
    } finally {
      client.close();
    }
  },
};