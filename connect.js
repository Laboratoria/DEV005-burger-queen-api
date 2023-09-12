/* eslint-disable import/no-extraneous-dependencies */
const { MongoClient } = require('mongodb');
const config = require('./config');
require('dotenv').config();

const client = new MongoClient(process.env.MONGO_URL);

async function connect() {
  try {
    await client.connect();
    console.log(process.env.MONGO_URL, 'connect heeeeere');
    const db = client.db();
    return db;
  } catch (error) {
    console.error('Error al conectar a la base de datos:', error);
  }
}

module.exports = { connect };
