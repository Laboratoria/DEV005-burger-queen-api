const { MongoClient } = require('mongodb');
const User = require('../models/user');
const { isAdmin, isAuthenticated } = require('../middleware/auth.js')
const config = require('../config');
const { dbUrl } = config;
const client = new MongoClient(dbUrl);
const { paginate } = require('../utils/paginate')

module.exports = {
  validatePassword: password => password.length >= 6,

  validateEmail: email => /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,4})+$/.test(email ?? ''),

  getUsers: async (req, res, next) => {
    try { 
      const users = await User.find().select('-password -__v').lean();
      const page = req.query.page ? parseInt(req.query.page) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit) : 20;
      const currentPage = paginate(users, page, limit)
      
      res.set('Link', '</users?page=' + currentPage.prev + '&limit=' + currentPage.limit + '>; rel="prev" , </users?page=' + currentPage.next + '&limit=' + currentPage.limit + '>; rel="next" , </users?page=' + currentPage.first + '&limit=' + currentPage.limit + '>; rel="first" , </users?page=' + currentPage.last + '&limit=' + currentPage.limit + '>; rel="last"');
      res.set('total-count', users.length);
      res.status(200).json(currentPage.pageData)
          
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
        return res.status(403).json({ error: 'No tienes autorización para ver esta información' });
      }

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
