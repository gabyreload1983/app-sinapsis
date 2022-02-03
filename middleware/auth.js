const jwt = require("jsonwebtoken");
const User = require("../models/User");
const config = require("config");
const logger = require("../logger/logger");

const jwtPrivateKey = config.get("jwtPrivateKey");

const requireAuth = (req, res, next) => {
  const token = req.cookies.jwt;
  const host = req.connection.remoteAddress;

  if (token) {
    jwt.verify(token, jwtPrivateKey, (err, decodedToken) => {
      if (err) {
        logger.error(`Host: ${host} - Error: ${err.message}`);
        res.redirect("/login");
      } else {
        next();
      }
    });
  } else {
    res.redirect("/login");
  }
};

//check current user
const checkUser = (req, res, next) => {
  const host = req.connection.remoteAddress;
  const token = req.cookies.jwt;

  if (token) {
    jwt.verify(token, jwtPrivateKey, async (err, decodedToken) => {
      if (err) {
        logger.error(`Host: ${host} - Error: ${err.message}`);
        res.locals.user = null;
        next();
      } else {
        let user = await User.findById(decodedToken.id);
        logger.info(
          `JWT valida  - Tecnico: ${user.codigo_tecnico} - IP: ${host}`
        );
        res.locals.user = user;
        next();
      }
    });
  } else {
    res.locals.user = null;
    next();
  }
};

module.exports = { requireAuth, checkUser };
