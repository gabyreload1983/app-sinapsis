const mysql = require("mysql");
const config = require("../config/config");

const connection = mysql.createConnection({
  host: config.URBANO_HOST,
  database: config.URBANO_DB,
  password: config.URBANO_PASS,
  user: config.URBANO_USER,
});

module.exports = connection;
