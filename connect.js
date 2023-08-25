const { MongoClient } = require('mongodb');
const mongoose = require('mongoose');
const config = require('./config');

const client = new MongoClient(config.dbUrl);

async function connect() {
  try {
    await client.connect();
    const db = client.db('db');
    console.log('esta dbURL estoy usando: ', config.dbUrl);
    await mongoose.connect(config.dbUrl).then(res => console.log(res.db, 'estoy en connect.js'));
    return db;
  } catch (error) {
    console.error(error);
  }
}

module.exports = { connect };
