"use strict";

var express = require('express');
var config = require('./config');
var authMiddleware = require('./middleware/auth');
var errorHandler = require('./middleware/error');
var routes = require('./routes');
var pkg = require('./package.json');
var _require = require('./connect'),
  connect = _require.connect;
var port = config.port,
  secret = config.secret;
var app = express();
app.set('config', config);
app.set('pkg', pkg);
app.use(express.urlencoded({
  extended: false
}));
app.use(express.json());
app.use(authMiddleware(secret));

// Registrar rutas
routes(app, function (err) {
  if (err) {
    throw err;
  }
  app.use(errorHandler);
  app.listen(port, function () {
    console.info("App listening on port ".concat(port));
  });
});