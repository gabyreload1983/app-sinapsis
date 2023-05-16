const jwt = require("jsonwebtoken");
const User = require("../models/User");
const logger = require("../logger/logger");

const jwtPrivateKey = process.env.JWT_PRIVATE_KEY;

const requireAuth = (req, res, next) => {
  const token = req.cookies.jwt;
  const host = req.connection.remoteAddress;

  if (token) {
    jwt.verify(token, jwtPrivateKey, (err, decodedToken) => {
      if (err) {
        logger.info(`Host: ${host} - Error: ${err.message}`);
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
        logger.info(`Host: ${host} - Error: ${err.message}`);
        res.locals.user = null;
        next();
      } else {
        let user = await User.findById(decodedToken.id);
        req.body.codigo_tecnico_log = user.codigo_tecnico;
        req.body.host = host;
        res.locals.user = user;
        next();
      }
    });
  } else {
    logger.info(`Host: ${host} - sin JWT`);
    res.locals.user = null;
    next();
  }
};

module.exports = { requireAuth, checkUser };
