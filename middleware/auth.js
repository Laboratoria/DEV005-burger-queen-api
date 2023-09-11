const jwt = require('jsonwebtoken');

const formatRole = token => (typeof token.role === 'string' ? token.role : token.role.role);

module.exports = secret => (req, res, next) => {
  const { authorization } = req.headers;

  if (!authorization) {
    console.log('No se proporcionó autorización');
    return next();
  }

  const [type, token] = authorization.split(' ');

  if (type.toLowerCase() !== 'bearer') {
    console.log('Tipo de autorización no válido');
    return next();
  }

  jwt.verify(token, secret, (err, decodedToken) => {
    if (err) {
      console.log('Error al verificar el token:', err.message);
      return res.status(403).json({ message: err.message });
    }

    req.userId = decodedToken.userId; // Agregar el ID del usuario al objeto `req`
    req.isAdmin = formatRole(decodedToken); // Agregar el rol del usuario al objeto `req`
    req.thisEmail = decodedToken.email; // Agregar el correo del usuario al objeto `req`
    req.isAuthenticated = true;

    next(); // Pasar la ejecución al siguiente middleware o controlador
  });
};

module.exports.isAuthenticated = req => (!!req.isAuthenticated);

module.exports.isAdmin = req => req.isAdmin === 'admin';

module.exports.requireAuth = (req, res, next) => (
  (!module.exports.isAuthenticated(req))
    ? next(401)
    : next()
);

module.exports.requireAdmin = (req, res, next) => (
  (!module.exports.isAuthenticated(req))
    ? next(401)
    : (!module.exports.isAdmin(req))
      ? next(403)
      : next()
);
