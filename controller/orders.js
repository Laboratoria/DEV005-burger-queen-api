const { MongoClient } = require('mongodb');
const Order = require('../models/order');
const config = require('../config');

const { dbUrl } = config;
const client = new MongoClient(dbUrl);

module.exports = {
  getOrders: async (req, res, next) => {
    try {
      const orders = await Order.find();
      res.json(orders);
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

    }
  },
};