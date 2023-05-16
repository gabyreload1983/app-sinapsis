const mysql = require("mysql");
const config = require("../config/config");

const connectionTickets = mysql.createConnection({
  host: config.TICKET_HOST,
  database: config.TICKET_DB,
  password: config.TICKET_PASS,
  user: config.TICKET_USER,
});

module.exports = connectionTickets;
