const jwt = require("jsonwebtoken");
const jwtPrivateKey = process.env.JWT_PRIVATE_KEY;
const User = require("../models/User");
const logger = require("../logger/logger");

module.exports = (req, res, next) => {
  const token = req.cookies.jwt;
  const host = req.connection.remoteAddress;

  if (token) {
    jwt.verify(token, jwtPrivateKey, async (err, decodedToken) => {
      if (err) {
        logger.error(err.message);
        next();
      } else {
        let user = await User.findById(decodedToken.id);
        if (!user.isAdmin) {
          logger.warn(`Usuario: ${user} - Host: ${host} - Access denied!`);
          return res.status(403).send("Access denied!");
        }

        next();
      }
    });
  } else {
    logger.warn(`NO TOKEN - Host: ${host} - Access denied!`);
    return res.status(403).send("Access denied!");
  }
};
