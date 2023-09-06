const { MongoClient } = require('mongodb');
const {
  requireAuth,
  requireAdmin,
} = require('../middleware/auth');
const Product = require('../models/product');
const config = require('../config');
const { getProducts } = require('../controller/products');

/** @module products */
module.exports = (app, nextMain) => {
  /**
   * @name GET /products
   * @description Lista productos
   * @path {GET} /products
   * @query {String} [page=1] Página del listado a consultar
   * @query {String} [limit=10] Cantitad de elementos por página
   * @header {Object} link Parámetros de paginación
   * @header {String} link.first Link a la primera página
   * @header {String} link.prev Link a la página anterior
   * @header {String} link.next Link a la página siguiente
   * @header {String} link.last Link a la última página
   * @auth Requiere `token` de autenticación
   * @response {Array} products
   * @response {String} products[]._id Id
   * @response {String} products[].name Nombre
   * @response {Number} products[].price Precio
   * @response {URL} products[].image URL a la imagen
   * @response {String} products[].type Tipo/Categoría
   * @response {Date} products[].dateEntry Fecha de creación
   * @code {200} si la autenticación es correcta
   * @code {401} si no hay cabecera de autenticación
   */
  app.get('/products', requireAuth, getProducts);

  /**
   * @name GET /products/:productId
   * @description Obtiene los datos de un producto especifico
   * @path {GET} /products/:productId
   * @params {String} :productId `id` del producto
   * @auth Requiere `token` de autenticación
   * @response {Object} product
   * @response {String} product._id Id
   * @response {String} product.name Nombre
   * @response {Number} product.price Precio
   * @response {URL} product.image URL a la imagen
   * @response {String} product.type Tipo/Categoría
   * @response {Date} product.dateEntry Fecha de creación
   * @code {200} si la autenticación es correcta
   * @code {401} si no hay cabecera de autenticación
   * @code {404} si el producto con `productId` indicado no existe
   */
  app.get('/products/:productId', requireAuth, (req, res, next) => {
  });

  /**
   * @name POST /products
   * @description Crea un nuevo producto
   * @path {POST} /products
   * @auth Requiere `token` de autenticación y que la usuaria sea **admin**
   * @body {String} name Nombre
   * @body {Number} price Precio
   * @body {String} [imagen]  URL a la imagen
   * @body {String} [type] Tipo/Categoría
   * @response {Object} product
   * @response {String} products._id Id
   * @response {String} product.name Nombre
   * @response {Number} product.price Precio
   * @response {URL} product.image URL a la imagen
   * @response {String} product.type Tipo/Categoría
   * @response {Date} product.dateEntry Fecha de creación
   * @code {200} si la autenticación es correcta
   * @code {400} si no se indican `name` o `price`
   * @code {401} si no hay cabecera de autenticación
   * @code {403} si no es admin
   * @code {404} si el producto con `productId` indicado no existe
   */
  app.post('/products', requireAdmin, async (req, res, next) => {
    try {
      // Obtener los datos del cuerpo de la solicitud
      const {
        name, price, image, type,
      } = req.body;

      if (!name || !price) {
        console.log('requiere nombre y precio', name, price);
        return res.status(400).json({ message: 'Debe proporcionar un nombre y un precio' });
      }

      // Crear una instancia de MongoClient para conectar con la base de datos
      const client = new MongoClient(config.dbUrl);
      await client.connect();
      // Obtener referencia a la base de datos y colección
      const db = client.db();
      const productsCollection = db.collection('products');

      // Verificar si el usuario autenticado es un administrador
      const isAdmin = req.isAdmin === 'admin';

      if (!isAdmin) {
        console.log('usurio no es admin', isAdmin);
        return res.status(403).json({ message: 'No tiene autorización para agregar productos' });
      }

      // Verificar si hay autorización
      const isAuth = req.authorization !== '';

      if (!isAuth) {
        console.log('no hay cabezera de auth', isAuth);
        return res.status(401).json({ message: 'No hay infromación de autorización' });
      }

      // Verificar si ya existe el producto
      const existingProduct = await Product.findOne({ name });

      if (existingProduct) {
        await client.close();
        console.log('ya existe el producto', existingProduct);
        return res.status(403).json({ error: 'Este producto ya está registrado' });
      }

      // Lógica para crear el producto
      const newProduct = {
        name,
        price,
        image,
        type,
        dateEntry: new Date(),
      };

      console.log(newProduct, 'new product routes/products');

      // Insertar el nuevo producto en la base de datos
      const insertedProduct = await productsCollection.insertOne(newProduct);

      await client.close();

      // Enviar la respuesta con los detalles del producto creado
      res.status(200).json({
        id: insertedProduct.insertedId,
        name: newProduct.name,
        price: newProduct.price,
        image: newProduct.image,
        type: newProduct.type,
        dateEntry: newProduct.dateEntry,
      });
    } catch (error) {
      console.error('Error al agregar producto', error);
    }
  });

  /**
   * @name PUT /products
   * @description Modifica un producto
   * @path {PUT} /products
   * @params {String} :productId `id` del producto
   * @auth Requiere `token` de autenticación y que el usuario sea **admin**
   * @body {String} [name] Nombre
   * @body {Number} [price] Precio
   * @body {String} [imagen]  URL a la imagen
   * @body {String} [type] Tipo/Categoría
   * @response {Object} product
   * @response {String} product._id Id
   * @response {String} product.name Nombre
   * @response {Number} product.price Precio
   * @response {URL} product.image URL a la imagen
   * @response {String} product.type Tipo/Categoría
   * @response {Date} product.dateEntry Fecha de creación
   * @code {200} si la autenticación es correcta
   * @code {400} si no se indican ninguna propiedad a modificar
   * @code {401} si no hay cabecera de autenticación
   * @code {403} si no es admin
   * @code {404} si el producto con `productId` indicado no existe
   */
  app.put('/products/:productId', requireAdmin, (req, res, next) => {
  });

  /**
   * @name DELETE /products
   * @description Elimina un producto
   * @path {DELETE} /products
   * @params {String} :productId `id` del producto
   * @auth Requiere `token` de autenticación y que el usuario sea **admin**
   * @response {Object} product
   * @response {String} product._id Id
   * @response {String} product.name Nombre
   * @response {Number} product.price Precio
   * @response {URL} product.image URL a la imagen
   * @response {String} product.type Tipo/Categoría
   * @response {Date} product.dateEntry Fecha de creación
   * @code {200} si la autenticación es correcta
   * @code {401} si no hay cabecera de autenticación
   * @code {403} si no es ni admin
   * @code {404} si el producto con `productId` indicado no existe
   */
  app.delete('/products/:productId', requireAdmin, (req, res, next) => {
  });

  nextMain();
};
