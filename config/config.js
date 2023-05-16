const dotenv = require("dotenv");

dotenv.config();

const config = {
  JWT_PRIVATE_KEY: process.env.JWT_PRIVATE_KEY,
  MONGO_CREDENTIALS: process.env.MONGO_CREDENTIALS,
  URBANO_HOST: process.env.URBANO_HOST,
  URBANO_DB: process.env.URBANO_DB,
  URBANO_PASS: process.env.URBANO_PASS,
  URBANO_USER: process.env.URBANO_USER,
  TICKET_HOST: process.env.TICKET_HOST,
  TICKET_DB: process.env.TICKET_DB,
  TICKET_PASS: process.env.TICKET_PASS,
  TICKET_USER: process.env.TICKET_USER,
  PORT: process.env.PORT,
  MAIL_HOST: process.env.MAIL_HOST,
  MAIL_USER: process.env.MAIL_USER,
  MAIL_PASSWORD: process.env.MAIL_PASSWORD,
  MAIL_FROM: process.env.MAIL_FROM,
  MAIL_BCC: process.env.MAIL_BCC,
  NODE_ENV: process.env.NODE_ENV,
};

module.exports = config;
