const { MongoClient } = require('mongodb');
const bcrypt = require('bcrypt');
const mongoose = require('mongoose');
const User = require('../models/user');
const { dbUrl } = require('../config');

const {
  requireAuth,
  requireAdmin,
  isAdmin,
  isAuthenticated,
} = require('../middleware/auth');

const {
  validateEmail,
  getUsers,
  getUserById,
  validatePassword,
} = require('../controller/users');

// Función para inicializar al usuario administrador
const initAdminUser = async (app, next) => {
  const { adminEmail, adminPassword } = app.get('config');
  if (!adminEmail || !adminPassword) {
    return next();
  }

  const adminUser = {
    email: adminEmail,
    password: bcrypt.hashSync(adminPassword, 10),
    role: {
      role: 'admin',
      admin: true,
    },
  };

  // Crear una instancia de MongoClient para conectar con la base de datos
  mongoose.connect(dbUrl);

  const userExists = await User.findOne({ email: adminEmail });
  if (!userExists) {
    try {
      const user = new User(adminUser);
      user.save();
      console.info('Usuario administrador creado con éxito');
    } catch (error) {
      console.error('Error al crear usuario', error);
    }
  } else {
    console.log('Ya existe usuario administrador:', userExists);
  }
  // mongoose.disconnect();
  next();
};

/** @module users */
module.exports = (app, next) => {
  /**
   * @name GET /users
   * @description Lista usuarias
   * @path {GET} /users
   * @query {String} [page=1] Página del listado a consultar
   * @query {String} [limit=10] Cantitad de elementos por página
   * @header {Object} link Parámetros de paginación
   * @header {String} link.first Link a la primera página
   * @header {String} link.prev Link a la página anterior
   * @header {String} link.next Link a la página siguiente
   * @header {String} link.last Link a la última página
   * @auth Requiere `token` de autenticación y que la usuaria sea **admin**
   * @resonse {Array} users
   * @resonse {String} users[]._id
   * @resonse {Object} users[].email
   * @resonse {Object} users[].role
   * @resonse {Boolean} users[].role.admin
   * @code {200} si la autenticación es correcta
   * @code {401} si no hay cabecera de autenticación
   * @code {403} si no es ni admin
   */
  app.get('/users', requireAdmin, getUsers);

  /**
   * @name GET /users/:uid
   * @description Obtiene información de una usuaria
   * @path {GET} /users/:uid
   * @params {String} :uid `id` o `email` de la usuaria a consultar
   * @auth Requiere `token` de autenticación y que la usuaria sea **admin** o la usuaria a consultar
   * @resonse {Object} user
   * @resonse {String} user._id
   * @resonse {Object} user.email
   * @resonse {Object} user.role
   * @resonse {Boolean} user.role.admin
   * @code {200} si la autenticación es correcta
   * @code {401} si no hay cabecera de autenticación
   * @code {403} si no es ni admin o la misma usuaria
   * @code {404} si la usuaria solicitada no existe
   */
  app.get('/users/:uid', requireAuth, getUserById);

  /**
   * @name POST /users
   * @description Crea una usuaria
   * @path {POST} /users
   * @body {String} email Correo
   * @body {String} password Contraseña
   * @body {Object} [role]
   * @body {Boolean} [role.admin]
   * @auth Requiere `token` de autenticación y que la usuaria sea **admin**
   * @resonse {Object} user
   * @resonse {String} user._id
   * @resonse {Object} user.email
   * @resonse {Object} user.role
   * @resonse {Boolean} user.role.admin
   * @code {200} si la autenticación es correcta
   * @code {400} si no se proveen `email` o `password` o ninguno de los dos
   * @code {401} si no hay cabecera de autenticación
   * @code {403} si ya existe usuaria con ese `email`
   */
  app.post('/users', requireAdmin, async (req, res, next) => {
    try {
      // Obtener los datos del cuerpo de la solicitud
      const { email, password, role } = req.body;

      if (!email || !password) {
        return res.status(400).json({ message: 'El correo y la contraseña son requeridos' });
      }
      if (!validateEmail(email)) {
        return res.status(400).json({ message: 'El correo debe ser una dirección válida' });
      }
      if (!validatePassword(password)) {
        return res.status(400).json({ message: 'La contraseña debe tener al menos 6 caracteres' });
      }

      // Crear una instancia de MongoClient para conectar con la base de datos
      const client = new MongoClient(dbUrl);
      await client.connect();
      // Obtener referencia a la base de datos y colección
      const db = client.db();
      const usersCollection = db.collection('users');

      if (!isAdmin(req)) {
        // Cerrar conexión despues de usar
        await client.close();
        return res.status(401).json({ error: 'Sin autorización para crear un usuario' });
      }

      // Verificar si ya existe usuario
      const existingUser = await User.findOne({ email });

      if (existingUser) {
        await client.close();
        return res.status(403).json({ error: 'Este usuario ya está registrado' });
      }

      // Creación del nuevo usuario
      const verifyIsAdminUser = role === 'admin';

      const newUser = {
        email,
        password: bcrypt.hashSync(password, 10),
        role: {
          role,
          admin: verifyIsAdminUser,
        },
      };

      // Insertar el nuevo usuario en la base de datos
      const insertedUser = await usersCollection.insertOne(newUser);
      await client.close();

      // Enviar la respuesta con los detalles del usuario creado
      res.status(200).json({
        id: insertedUser.insertedId,
        email: newUser.email,
        role: newUser.role,
      });
    } catch (error) {
      console.error('Error al crear usuario', error);
    }
  });

  /**
   * @name PATCH /users
   * @description Modifica una usuaria
   * @params {String} :uid `id` o `email` de la usuaria a modificar
   * @path {PATCH} /users
   * @body {String} email Correo
   * @body {String} password Contraseña
   * @body {Object} [role]
   * @body {Boolean} [role.admin]
   * @auth Requiere `token` de autenticación y que la usuaria sea **admin** o la usuaria a modificar
   * @resonse {Object} user
   * @resonse {String} user._id
   * @resonse {Object} user.email
   * @resonse {Object} user.role
   * @resonse {Boolean} user.role.admin
   * @code {200} si la autenticación es correcta
   * @code {400} si no se proveen `email` o `password` o ninguno de los dos
   * @code {401} si no hay cabecera de autenticación
   * @code {403} si no es ni admin o la misma usuaria
   * @code {403} una usuaria no admin intenta de modificar sus `role`
   * @code {404} si la usuaria solicitada no existe
   */
  app.patch('/users/:uid', requireAuth, async (req, res, next) => {
    try {
      // Obtener los datos desde la req
      const { email, password, role } = req.body; // nueva data para el usuario a cambiar
      const { uid } = req.params; // usuario que se va a cambiar
      const { thisEmail } = req; // usuario haciendo el cambio

      if ((email && !validateEmail(email)) || (password && !validatePassword(password))) {
        return res.status(400).json({ message: 'Debes ingresar un correo y/o una contraseña válidos' });
      }
      if (!email && !password && !role) {
        return res.status(400).json({ error: 'Proporciona al menos una propiedad para modificar' });
      }

      if (!isAuthenticated(req)) {
        return res.status(401).json({ error: 'Sin autorización' });
      }

      let user;
      // Buscar el usuario en la base de datos
      if (uid.includes('@')) {
        user = await User.findOne({ email: uid });
      } else {
        user = await User.findOne({ _id: uid });
      }

      // si no encuentra usuario
      if (!user) {
        return res.status(404).json({ error: 'Usuario no encontrado' });
      }

      // si usuario no es admin ni el mismo usuario que se va a cambiar
      if (!isAdmin(req) && user.email !== thisEmail) {
        return res.status(403).json({ error: 'No tienes autorización para modificar usuario' });
      }

      // si usuario no admin trata de modificar su propio rol
      if (!isAdmin(req) && role) {
        return res.status(403).json({ error: 'Sin autorización' });
      }

      // si usuario trata de modificar su email o contraseña
      if (!role) {
        if (email) {
          user.email = email;
        }
        if (password) {
          user.password = bcrypt.hashSync(password, 10);
        }
      }

      // si usuario es admin y trata de cambiar un rol
      if (isAdmin(req) && role) {
        if (role) {
          user.role.role = role;
          user.role.admin = role === 'admin';
        }
      }
      await user.save();

      // Enviar la respuesta con los detalles del usuario modificado
      res.status(200).json({
        message: 'Usuario actualizado exitosamente',
        _id: uid,
        email: user.email,
        role: user.role.role,
      });
    } catch (error) {
      console.error('Error al modificar usuario', error);
    }
  });

  /**
   * @name DELETE /users
   * @description Elimina una usuaria
   * @params {String} :uid `id` o `email` de la usuaria a modificar
   * @path {DELETE} /users
   * @auth Requiere `token` de autenticación y que la usuaria sea **admin** o la usuaria a eliminar
   * @resonse {Object} user
   * @resonse {String} user._id
   * @resonse {Object} user.email
   * @resonse {Object} user.role
   * @resonse {Boolean} user.role.admin
   * @code {200} si la autenticación es correcta
   * @code {401} si no hay cabecera de autenticación
   * @code {403} si no es ni admin o la misma usuaria
   * @code {404} si la usuaria solicitada no existe
   */
  app.delete('/users/:uid', requireAuth, async (req, res, next) => {
    try {
      // Obtener el ID o correo de la usuario a eliminar desde los parámetros de la URL
      const { uid } = req.params;
      let userToDelete;

      // Buscar el usuario en la base de datos
      if (uid.includes('@')) {
        userToDelete = await User.findOne({ email: uid });
      } else {
        userToDelete = await User.findOne({ _id: uid });
      }

      // Verificar si el usuario autenticado es un administrador
      const isAdmin = req.isAdmin === 'admin';

      // Verificar si el token pertenece a la misma usuaria o si es una usuaria administradora
      const isAuthorized = req.userId === uid || isAdmin || req.thisEmail === uid;

      // Si el usuario no es un administrador ni la misma usuario, devolver un error 403
      if (!isAuthorized) {
        return res.status(403).json({ error: 'No tienes autorización para eliminar este usuario' });
      }

      // Si no se encuentra la usuario, devolver un error 404
      if (!userToDelete) {
        return res.status(404).json({ error: 'El usuario que intentas eliminar no existe' });
      }

      // Eliminar la usuario de la base de datos
      await User.deleteOne({ _id: userToDelete._id });

      // Devolver una respuesta exitosa
      return res.status(200).json({
        message: 'Usuario eliminado exitosamente',
        id: userToDelete._id,
        email: userToDelete.email,
        role: req.body.role,
      });
    } catch (error) {
      console.error('Error al eliminar usuario', error);
    }
  });

  // Llamar a la función para inicializar al usuario administrador
  initAdminUser(app, next);
};
