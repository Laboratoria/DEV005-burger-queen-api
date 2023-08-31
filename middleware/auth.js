const jwt = require('jsonwebtoken');

module.exports = (secret) => (req, res, next) => {
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
    console.log('holaaa', authorization);
    console.log('chauuu', req);
    console.log('Token verificado:', decodedToken);
    console.log('Token.uid verificado:', decodedToken.userId);

    // TODO: Verificar identidad del usuario usando `decodeToken.uid`
    req.userId = decodedToken.userId; // Agregar el ID del usuario al objeto `req`
    req.isAdmin = decodedToken.rol; // Agregar el rol del usuario al objeto `req`
    req.thisEmail = decodedToken.email; // Agregar el correo del usuario al objeto `req`

    console.log('request después', req.rawHeaders);

    // verificar que sea administrador
    if (req.isAdmin === 'admin') {
      req.isAdmin = true;
    } else {
      req.isAdmin = false;
    }

    next(); // Pasar la ejecución al siguiente middleware o controlador
  });
};

module.exports.isAuthenticated = (req) => (
  // TODO: decidir por la informacion del request si la usuaria esta autenticada
  // false
  !!req.userId // Verificar si está la información del usuario en el objeto req
);

module.exports.isAdmin = (req) => (
  // TODO: decidir por la informacion del request si la usuaria es admin
  // false
  !!req.isAdmin
);

module.exports.requireAuth = (req, res, next) => (
  (!module.exports.isAuthenticated(req))
    ? next(401)
    : next()
);

module.exports.requireAdmin = (req, res, next) => (
  // eslint-disable-next-line no-nested-ternary
  (!module.exports.isAuthenticated(req))
    ? next(401)
    : (!module.exports.isAdmin(req))
      ? next(403)
      : next()
);
