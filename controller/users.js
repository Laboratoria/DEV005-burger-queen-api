const User = require('../models/user');

module.exports = {
  validateEmail: (email) => {
    const validRegEx = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/
    return validRegEx.test(email ?? '');
  },
  getUsers: async (req, res, next) => {
    try {
      const users = await User.find()
        .select("-password -__v")
        .lean();
        console.log(users, 'users en controller users');
      res.json(users);
    } catch (error) {
      console.error('Error al obtener los usuarios de la base de datos en controller users:', error);
      res.status(500).json({ message: 'Error al obtener usuarios' });
    }
  },
};

