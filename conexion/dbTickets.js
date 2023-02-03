const mysql = require("mysql");

const connectionTickets = mysql.createConnection({
  host: process.env.TICKET_HOST,
  database: process.env.TICKET_DB,
  password: process.env.TICKET_PASS,
  user: process.env.TICKET_USER,
});

module.exports = connectionTickets;
