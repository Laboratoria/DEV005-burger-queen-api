const { MongoClient } = require('mongodb');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const config = require('../config');

const { secret } = config;

/** @module auth */
module.exports = (app, nextMain) => {
  /**
   * @name /auth
   * @description Crea token de autenticación.
   * @path {POST} /auth
   * @body {String} email Correo
   * @body {String} password Contraseña
   * @response {Object} resp
   * @response {String} resp.token Token a usar para los requests sucesivos
   * @code {200} si la autenticación es correcta
   * @code {400} si no se proveen `email` o `password` o ninguno de los dos
   * @auth No requiere autenticación
   */
  app.post('/auth', async (req, res, next) => {
    const { email, password } = req.body;
    const { dbUrl } = app.get('config');

    if (!email || !password) {
      return res.status(400).json({ error: 'Correo y contraseña son requeridos' });
    }

    const client = new MongoClient(dbUrl);
    await client.connect();
    const db = client.db();
    const usersCollection = db.collection('users');

    // Buscar el usuario por correo
    const user = await usersCollection.findOne({ email });

    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    // Comparar la contraseña proporcionada con la almacenada
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(400).json({ error: 'Contraseña incorrecta' });
    }

    // Genera un JWT token
    const accessToken = jwt.sign({ userId: user._id, role: user.role, email: user.email }, secret, { expiresIn: '1h' });
    res.status(200).json({ accessToken });

    next();
  });

  return nextMain();
};
