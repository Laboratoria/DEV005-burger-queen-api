const { MongoClient } = require('mongodb');
const Product = require('../models/product');
const config = require('../config');

const { dbUrl } = config;
const client = new MongoClient(dbUrl);

module.exports = {
    getProducts: async (req, res, next) => {
        try {
            const products = await Product.find(); // devuelve lista de productos

            // Si req incluye paginación 
            if (req.query.page && req.query.limit) {
                const page = parseInt(req.query.page);
                const limit = parseInt(req.query.limit);
                const startIndex = (page - 1) * limit;
                const endIndex = page * limit
                const paginatedProducts = products.slice(startIndex, endIndex);
                res.status(200).json(paginatedProducts)
            } else {
                res.status(200).json(products)
            }
        } catch (err) {
            console.error("error al mostrar productos", err);
            next(err);
        } finally {
            client.close();
        }
    },
};