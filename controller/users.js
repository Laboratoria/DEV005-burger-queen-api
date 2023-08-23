const User = require('../models/user');

module.exports = {
  validateEmail : (email) => {
    const validRegEx = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/
    return validRegEx.test(email ?? '');
  },
  getUsers: async (req, res, next) => {
    const users = await User.find()
        .select("-password -__v")
        .lean();
    res.json(users);
  },
};

