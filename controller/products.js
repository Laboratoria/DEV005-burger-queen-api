const { MongoClient } = require('mongodb');
const Product = require('../models/product');
const config = require('../config');

const { dbUrl } = config;
const client = new MongoClient(dbUrl);

module.exports ={
    getProducts: async (req, res, next) => {
        try {
            const products = await Product.find(); // devuelve lista de productos
            console.log(products, 'product CONTROOOOOLLLLER');

            res.json(products);
        } catch (err) {
          console.log("error al mostrar productos", err);
          next(err);
        } finally {
          client.close();
        }
      },
};