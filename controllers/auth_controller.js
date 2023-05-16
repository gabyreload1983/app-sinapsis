const User = require("../models/User");
const jwt = require("jsonwebtoken");
const logger = require("../logger/logger");
const config = require("../config/config");

//handle errors
const handle_errors = (err, host) => {
  logger.info(`Host: ${host} - error: ${err.message} - code: ${err.code}`);
  let errors = { email: "", codigo_tecnico: "", password: "" };

  //invalid email
  if (err.message === "incorrect email") {
    errors.email = "email not register";
  }

  //invalid codigo_tecnico
  if (err.message === "incorrect codigo_tecnico") {
    errors.password = "codigo tecnico is incorrect";
  }

  //invalid password
  if (err.message === "incorrect password") {
    errors.password = "password is incorrect";
  }

  //duplicate error code
  if (err.code === 11000) {
    const key = Object.getOwnPropertyNames(err.keyValue)[0];
    switch (key) {
      case "email":
        errors.email = "the email is already registered";
        break;
      case "codigo_tecnico":
        errors.codigo_tecnico = "codigo tecnico is already registered";
        break;
    }
    return errors;
  }

  //validation error
  if (err.message.includes("user validation failed")) {
    Object.values(err.errors).forEach((properties) => {
      errors[properties.path] = properties.message;
    });
  }
  return errors;
};

//jwt
const jwtPrivateKey = config.JWT_PRIVATE_KEY;
const maxAge = 7 * 24 * 60 * 60; //Una semana
const createToken = (id, isAdmin) => {
  return jwt.sign({ id, isAdmin }, jwtPrivateKey, {
    expiresIn: maxAge,
  });
};

module.exports.signup_get = (req, res) => {
  res.render("signup");
};

module.exports.login_get = (req, res) => {
  res.render("login");
};

module.exports.signup_post = async (req, res) => {
  const { email, codigo_tecnico, password } = req.body;
  try {
    const user = await User.create({ email, codigo_tecnico, password });

    const token = createToken(user._id, user.isAdmin);
    res.cookie("jwt", token, { httpOnly: true, maxAge: maxAge * 1000 });
    res.status(201).json({ user: user._id });
  } catch (err) {
    const errors = handle_errors(err);
    res.status(400).json({ errors });
  }
};

module.exports.login_post = async (req, res) => {
  const host = req.connection.remoteAddress;
  const { email, password } = req.body;

  try {
    const user = await User.login(email, password);
    const token = createToken(user._id, user.isAdmin);
    res.cookie("jwt", token, { httpOnly: true, maxAge: maxAge * 1000 });
    res.status(200).json({ user: user._id });
  } catch (err) {
    const errors = handle_errors(err, host);
    res.status(400).json({ errors });
  }
};

module.exports.logout_get = (req, res) => {
  res.cookie("jwt", "", { maxAge: 1 });
  res.redirect("/");
};
