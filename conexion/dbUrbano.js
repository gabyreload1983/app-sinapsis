const mysql = require("mysql");
const config = require("../config/config");

const connectionPool = mysql.createPool({
  connectionLimit: 100,
  host: config.URBANO_HOST,
  database: config.URBANO_DB,
  password: config.URBANO_PASS,
  user: config.URBANO_USER,
  debug: false,
});

module.exports = connectionPool;
