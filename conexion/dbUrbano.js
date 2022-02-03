const mysql = require("mysql");
const config = require("config");

const urbanoHost = config.get("urbanoHost");
const urbanoDb = config.get("urbanoDb");
const urbanoPass = config.get("urbanoPass");
const urbanoUser = config.get("urbanoUser");

const connection = mysql.createConnection({
  host: urbanoHost,
  database: urbanoDb,
  password: urbanoPass,
  user: urbanoUser,
});

module.exports = connection;
