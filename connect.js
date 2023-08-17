// configuración copiada de un ejemplo
// tal vez hay que cambiar

const { MongoClient } = require('mongodb');
const config = require('./config');

const client = new MongoClient(config.dbUrl);

async function connect() {
  try {
    await client.connect();
    const db = client.db('db');
    return db;
  } catch (error) {
    //
  }
}

module.exports = { connect };
