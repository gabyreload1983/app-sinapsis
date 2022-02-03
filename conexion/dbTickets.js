const mysql = require("mysql");
const config = require("config");

const ticketHost = config.get("ticketHost");
const ticketDb = config.get("ticketDb");
const ticketPass = config.get("ticketPass");
const ticketUser = config.get("ticketUser");

const connectionTickets = mysql.createConnection({
  host: ticketHost,
  database: ticketDb,
  password: ticketPass,
  user: ticketUser,
});

module.exports = connectionTickets;
