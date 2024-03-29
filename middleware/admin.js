const jwt = require("jsonwebtoken");
const User = require("../models/User");
const logger = require("../logger/logger");
const config = require("../config/config");

const jwtPrivateKey = config.JWT_PRIVATE_KEY;

module.exports = (req, res, next) => {
  const token = req.cookies.jwt;
  const host = req.connection.remoteAddress;

  if (token) {
    jwt.verify(token, jwtPrivateKey, async (err, decodedToken) => {
      if (err) {
        logger.info(err.message);
        next();
      } else {
        let user = await User.findById(decodedToken.id);
        if (!user.isAdmin) {
          logger.info(`Usuario: ${user} - Host: ${host} - Access denied!`);
          return res.status(403).send("Access denied!");
        }

        next();
      }
    });
  } else {
    logger.info(`NO TOKEN - Host: ${host} - Access denied!`);
    return res.status(403).send("Access denied!");
  }
};
