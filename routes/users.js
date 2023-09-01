const { MongoClient } = require('mongodb');
const bcrypt = require('bcrypt');
const mongoose = require('mongoose');
const config = require('../config');
const User = require('../models/user');
const { dbUrl } = require('../config');

const {
  requireAuth,
  requireAdmin,
} = require('../middleware/auth');

const {
  getUsers,
} = require('../controller/users');

// Función para inicializar al usuario administrador
const initAdminUser = async (app, next) => {
  const { adminEmail, adminPassword } = app.get('config');
  if (!adminEmail || !adminPassword) {
    return next();
  }

  const adminUser = {
    email: adminEmail,
    // password: adminPassword,
    password: bcrypt.hashSync(adminPassword, 10),
    role: 'admin',
  };

  mongoose.connect(dbUrl);
  console.log('hasta aquí voy bien en routes/user.js', User, adminUser);

  const userExists = await User.findOne({ email: adminUser.email })
    .then(res => {
      if (!res) {
        try {
          const user = new User(adminUser);
          user.save();
          console.info('Usuario administrador creado con éxito');
          console.log('Nuevo usuario creado:', user);
        } catch (error) {
          console.error('Error al crear usuario', error);
        }
      } else {
        console.log('Ya existe un usuario administrador con email:', res.email);
        console.log('Este es el usuario:', res);
      }
    });
  next();
};

/*
 * Diagrama de flujo de una aplicación y petición en node - express :
 *
 * request  -> middleware1 -> middleware2 -> route
 *                                             |
 * resonse <- middleware4 <- middleware3   <---
 *
 * la gracia es que la petición va pasando por cada una de las funciones
 * intermedias o "middlewares" hasta llegar a la función de la ruta, luego esa
 * función genera la resuesta y esta pasa nuevamente por otras funciones
 * intermedias hasta resonder finalmente a la usuaria.
 *
 * Un ejemplo de middleware podría ser una función que verifique que una usuaria
 * está realmente registrado en la aplicación y que tiene permisos para usar la
 * ruta. O también un middleware de traducción, que cambie la resuesta
 * dependiendo del idioma de la usuaria.
 *
 * Es por lo anterior que siempre veremos los argumentos request, resonse y
 * next en nuestros middlewares y rutas. Cada una de estas funciones tendrá
 * la oportunidad de acceder a la consulta (request) y hacerse cargo de enviar
 * una resuesta (rompiendo la cadena), o delegar la consulta a la siguiente
 * función en la cadena (invocando next). De esta forma, la petición (request)
 * va pasando a través de las funciones, así como también la resuesta
 * (resonse).
 */

// Definición de las rutas y sus funciones asociadas
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
   * @resonse {Object} users[].roles
   * @resonse {Boolean} users[].roles.admin
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
   * @resonse {Object} user.roles
   * @resonse {Boolean} user.roles.admin
   * @code {200} si la autenticación es correcta
   * @code {401} si no hay cabecera de autenticación
   * @code {403} si no es ni admin o la misma usuaria
   * @code {404} si la usuaria solicitada no existe
   */
  app.get('/users/:uid', requireAuth, (req, res) => {
  });

  /**
   * @name POST /users
   * @description Crea una usuaria
   * @path {POST} /users
   * @body {String} email Correo
   * @body {String} password Contraseña
   * @body {Object} [roles]
   * @body {Boolean} [roles.admin]
   * @auth Requiere `token` de autenticación y que la usuaria sea **admin**
   * @resonse {Object} user
   * @resonse {String} user._id
   * @resonse {Object} user.email
   * @resonse {Object} user.roles
   * @resonse {Boolean} user.roles.admin
   * @code {200} si la autenticación es correcta
   * @code {400} si no se proveen `email` o `password` o ninguno de los dos
   * @code {401} si no hay cabecera de autenticación
   * @code {403} si ya existe usuaria con ese `email`
   */
  app.post('/users', requireAdmin, async (req, res, next) => {
    // TODO: implementar la ruta para agregar
    // nuevos usuarios

    try {
      // Obtener los datos del cuerpo de la solicitud
      const { email, password, roles } = req.body;

      if (!email || !password) {
        console.log('requiere contraseña y correo', email, password);
        return res.status(400).json({ message: 'El correo y la contraseña son requeridos' });
      }

      // Crear una instancia de MongoClient para conectar con la base de datos
      const client = new MongoClient(config.dbUrl);
      await client.connect();
      // Obtener referencia a la base de datos y colección
      const db = client.db();
      const usersCollection = db.collection('users');

      // Verificar si el usuario autenticado es un administrador
      const isAdmin = req.isAdmin === true;

      if (!isAdmin) {
        // Cerrar conexión despues de usar
        // Para liberar recursos y evitar problemas de conexiones agotadas.
        await client.close();
        console.log('no autorizado POST', isAdmin);
        return res.status(401).json({ error: 'Sin autorización para crear un usuario' });
      }

      // Verificar si ya existe usuario
      const existingUser = await User.findOne({ email });

      if (existingUser) {
        await client.close();
        console.log('ya existe user', existingUser);
        return res.status(403).json({ error: 'Este usuario ya está registrado' });
      }

      // Creación del nuevo usuario
      const verifyIsAdminUser = roles === 'admin';

      const newUser = {
        email,
        password: bcrypt.hashSync(password, 10),
        roles: {
          roles,
          admin: verifyIsAdminUser,
        },
      };

      console.log('newUser en POST rotes/users', newUser);

      // Insertar el nuevo usuario en la base de datos
      const insertedUser = await usersCollection.insertOne(newUser);

      console.log('nuevo usuario insertado', insertedUser);

      await client.close();

      // Enviar la respuesta con los detalles del usuario creado
      res.status(200).json({
        id: insertedUser.insertedId,
        email: newUser.email,
        roles: newUser.roles,
      });
    } catch (error) {
      console.error('Error al crear usuario', error);
      res.status(500).json({ error: 'Error al crear usuario' });
    }
  });

  /**
   * @name PUT /users
   * @description Modifica una usuaria
   * @params {String} :uid `id` o `email` de la usuaria a modificar
   * @path {PUT} /users
   * @body {String} email Correo
   * @body {String} password Contraseña
   * @body {Object} [roles]
   * @body {Boolean} [roles.admin]
   * @auth Requiere `token` de autenticación y que la usuaria sea **admin** o la usuaria a modificar
   * @resonse {Object} user
   * @resonse {String} user._id
   * @resonse {Object} user.email
   * @resonse {Object} user.roles
   * @resonse {Boolean} user.roles.admin
   * @code {200} si la autenticación es correcta
   * @code {400} si no se proveen `email` o `password` o ninguno de los dos
   * @code {401} si no hay cabecera de autenticación
   * @code {403} si no es ni admin o la misma usuaria
   * @code {403} una usuaria no admin intenta de modificar sus `roles`
   * @code {404} si la usuaria solicitada no existe
   */
  app.put('/users/:uid', requireAuth, (req, res, next) => {
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
   * @resonse {Object} user.roles
   * @resonse {Boolean} user.roles.admin
   * @code {200} si la autenticación es correcta
   * @code {401} si no hay cabecera de autenticación
   * @code {403} si no es ni admin o la misma usuaria
   * @code {404} si la usuaria solicitada no existe
   */
  app.delete('/users/:uid', requireAuth, async (req, res, next) => {
    try {
      // Obtener el ID o correo de la usuario a eliminar desde los parámetros de la URL
      const uid = req.params.uid;

      console.log(uid, 'datos del usuario routes/users');
  
      // Verificar si el usuario autenticado es un administrador
      const isAdmin = req.isAdmin === true;
  
      // Si el usuario no es un administrador ni la misma usuario, devolver un error 403
      if (!isAdmin && uid !== req.user.email) {
        console.log(req.user.email,'No coincide con este usuario');
        return res.status(403).json({ error: 'No tienes autorización para eliminar este usuario' });
      }
  
      // Buscar la usuario en la base de datos por ID o correo
      const userToDelete = await User.findOne({ $or: [{ _id: uid }, { email: uid }] });

      console.log('usuario a borrar', userToDelete);
  
      // Si no se encuentra la usuario, devolver un error 404
      if (!userToDelete) {
        return res.status(404).json({ error: 'El usuario que intentas eliminar no existe' });
      }
  
      // Eliminar la usuario de la base de datos
      await User.deleteOne({ _id: userToDelete._id });
  
      // Devolver una respuesta exitosa
      res.status(200).json({ message: 'Usuario eliminado exitosamente',
        id: userToDelete._id,
        email: userToDelete.email,
        roles: userToDelete.role,
      });
    } catch (error) {
      console.error('Error al eliminar usuario', error);
      res.status(500).json({ error: 'Error al eliminar usuario' });
    }
  });

  // Llamar a la función para inicializar al usuario administrador
  initAdminUser(app, next);
};
