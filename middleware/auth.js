const jwt = require('jsonwebtoken');

function formatRole(decodedToken) {
  if (typeof decodedToken.rol === 'string') {
    return decodedToken.rol;
  }
  if (typeof decodedToken.rol === 'object') {
    return decodedToken.rol.role;
  }
}

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
      return next(403);
    }
    console.log('Token verificado:', decodedToken);

    req.userId = decodedToken.userId; // Agregar el ID del usuario al objeto `req`
    req.isAdmin = formatRole(decodedToken); // Agregar el rol del usuario al objeto `req`
    req.thisEmail = decodedToken.email; // Agregar el correo del usuario al objeto `req`

    next(); // Pasar la ejecución al siguiente middleware o controlador
  });
};

module.exports.isAuthenticated = req => (!!req.userId);

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
