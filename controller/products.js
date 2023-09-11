const { MongoClient } = require('mongodb');
const Product = require('../models/product');
const config = require('../config');

const { dbUrl } = config;
const client = new MongoClient(dbUrl);
const { paginate } = require('../utils/paginate')

module.exports = {
    getProducts: async (req, res, next) => {
        try {
            const products = await Product.find();
            const page = req.query.page ? parseInt(req.query.page) : 1;
            const limit = req.query.limit ? parseInt(req.query.limit) : 20;
            const currentPage = paginate(products, page, limit)
            
            res.set('Link', '</products?page=' + currentPage.prev + '&limit=' + currentPage.limit + '>; rel="prev" , </products?page=' + currentPage.next + '&limit=' + currentPage.limit + '>; rel="next" , </products?page=' + currentPage.first + '&limit=' + currentPage.limit + '>; rel="first" , </products?page=' + currentPage.last + '&limit=' + currentPage.limit + '>; rel="last"');
            res.set('total-count', products.length);
            res.status(200).json(currentPage.pageData)
                
        } catch (err) {
            console.error("error al mostrar productos", err);
            next(err);
        } finally {
            client.close();
        }
    },
};