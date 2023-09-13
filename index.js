const express = require('express');
const cors = require('cors');
const config = require('./config');
const authMiddleware = require('./middleware/auth');
const errorHandler = require('./middleware/error');
const routes = require('./routes');
const pkg = require('./package.json');
const { connect } = require('./connect');

const { port, secret } = config;
const app = express();

app.set('config', config);
app.set('pkg', pkg);
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(cors({
  methods: ['GET', 'POST', 'DELETE', 'PATCH'],
  origin: ['https://burger-queen-api-wp1d-dev.fl0.io/'],
}));
app.use(authMiddleware(secret));

// Registrar rutas
routes(app, (err) => {
  if (err) {
    throw err;
  }

  app.use(errorHandler);

  app.listen(port, () => {
    console.info(`App listening on port ${port}`);
  });
});

connect();
