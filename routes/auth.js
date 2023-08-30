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
      console.log('Correo y contraseña son requeridos en routes/auth');
      return next(400).json({ message: 'Correo y contraseña son requeridos' });
    }

    const client = new MongoClient(dbUrl);
    await client.connect();
    const db = client.db();
    // console.log(db, 'print db en routes auth');
    const usersCollection = db.collection('users');
    // console.log(usersCollection, 'print users collection en routes auth');

    // TODO: autenticar a la usuarix
    // Hay que confirmar si el email y password
    // coinciden con un user en la base de datos
    // Si coinciden, manda un access token creado con jwt

    // Buscar el usuario por correo
    const user = await usersCollection.findOne({ email });

    if (!user) {
      console.log('No hay un usuario registrado así en routes/auth', user);
      return next(404).json({ message: 'Usuario no encontrado' });
    }

    // Comparar la contraseña proporcionada con la almacenada
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      console.log('Contraseña incorrecta', user.password, 'vs', password);
      return next(400).json({ message: 'Contraseña incorrecta' });
    }

    // Genera un JWT token
    const accessToken = jwt.sign({ userId: user._id, rol: user.role, email: user.email }, secret, { expiresIn: '1h' });
    console.log('nuevo token', accessToken);
    res.status(200).json({ accessToken });

    next();
  });

  return nextMain();
};
