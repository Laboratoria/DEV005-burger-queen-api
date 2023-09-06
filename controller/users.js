const User = require('../models/user');
const { isAdmin, isAuthenticated } = require('../middleware/auth.js')

module.exports = {
  validatePassword: password => password.length >= 6,

  validateEmail: email => /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,4})+$/.test(email ?? ''),

  getUsers: async (req, res, next) => {
    try {
      // Obtener el ID desde params
      const { uid } = req.params;

      // Si usuario no es admin ni sí mismo, devolver error 403
      if (!isAdmin(req) && uid !== req.user.email) {
        console.log(req.user.email, 'No coincide con este usuario');
        return res.status(403).json({ error: 'No tienes autorización para ver esta información' });
      }
    
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
    }
  },
  getUserById: async (req, res, next) => {
    try {
      // Obtener el ID desde params
      const { uid } = req.params;

      // Si usuario no es admin ni sí mismo, devolver error 403
      if (!isAdmin(req) && uid !== req.user.email) {
        console.log(req.user.email, 'No coincide con este usuario');
        return res.status(403).json({ error: 'No tienes autorización para eliminar este usuario' });
      }

      // Buscar usuario en la base de datos
      const userToGet = await User.findOne({ $or: [{ _id: uid }, { email: uid }] })
        .select('-password -__v')
        .lean();

      console.log('usuario encontrado es', userToGet);

      // Si no se encuentra usuario, devolver error 404
      if (!userToGet) {
        return res.status(404).json({ error: 'El usuario no existe' });
      }

      // Devolver una respuesta exitosa
      res.status(200).json({
        message: 'Usuario encontrado',
        id: userToGet._id,
        email: userToGet.email,
        role: userToGet.role.role
      });
    } catch (error) {
      console.error('Error al buscar usuario', error);
    }
  },
};
