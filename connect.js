const { MongoClient } = require('mongodb');
const config = require('./config');

const client = new MongoClient(config.dbUrl);

async function connect() {
  try {
    await client.connect();
    const db = client.db();
    return db;
  } catch (error) {
    console.error('Error al conectar a la base de datos:', error);
  }
}

module.exports = { connect };
