const { MongoClient } = require('mongodb');
const config = require('./config');

const client = new MongoClient(config.dbUrl);

async function connect() {
  try {
    await client.connect();
    const db = client.db();
    console.log('esta dbURL estoy usando: ', config.dbUrl);
    // await mongoose.connect(config.dbUrl).then(res => console.log(res.db, 'estoy en connect.js'));
    return db;
  } catch (error) {
    console.error('Error al conectar a la base de datos:', error);
  }
}

module.exports = { connect };
