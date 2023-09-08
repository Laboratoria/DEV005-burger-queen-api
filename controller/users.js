const { MongoClient } = require('mongodb');
const User = require('../models/user');
const { isAdmin, isAuthenticated } = require('../middleware/auth.js')
const config = require('../config');
const { dbUrl } = config;
const client = new MongoClient(dbUrl);

module.exports = {
  validatePassword: password => password.length >= 6,

  validateEmail: email => /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,4})+$/.test(email ?? ''),

  getUsers: async (req, res, next) => {
    try { 
      const users = await User.find().select('-password -__v').lean();

      // Si req incluye paginación 
      if (req.query.page && req.query.limit) {
        const page = parseInt(req.query.page);
        const limit = parseInt(req.query.limit);
        const startIndex = (page - 1) * limit;
        const endIndex = page * limit
        const paginatedUsers = users.slice(startIndex, endIndex);
        console.log('aquííííí', req.query)
        res.status(200).json(paginatedUsers)
      } else {
        res.status(200).json(users)
      }      
    } catch (error) {
        console.error('Error al obtener los usuarios', error);
    } finally {
      client.close();
    }
  },
  getUserById: async (req, res, next) => {
    try {
      // Obtener el ID desde params
      const { uid } = req.params;
      const { thisEmail } = req;
      let user;
  
      // Buscar usuario en la base de datos
      if (uid.includes('@')) {
        user = await User.findOne({ email: uid }).select('-password -__v').lean();
      } else {
        user = await User.findOne({ _id: uid }).select('-password -__v').lean();;
      }

      // Si no se encuentra usuario, devolver error 404
      if (!user) {
        return res.status(404).json({ error: 'El usuario no existe' });
      }

      // Si usuario no es admin ni sí mismo, devolver error 403
      if (!isAdmin(req) && thisEmail !== user.email) {
        console.log('Sin autorización');
        return res.status(403).json({ error: 'No tienes autorización para ver esta información' });
      }

      console.log('usuario encontrado es', user);

      // Devolver una respuesta exitosa
      res.status(200).json({
        message: 'Usuario encontrado',
        id: user._id,
        email: user.email,
        role: user.role.role
      });
    } catch (error) {
      console.error('Error al buscar usuario', error);
    } finally {
      client.close();
    }
  },
};
