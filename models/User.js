const mongoose = require("mongoose");
const { isEmail } = require("validator");
const bcrypt = require("bcrypt");

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, "Please enter an email"],
    unique: true,
    lowercase: true,
    validate: [isEmail, "Please enter a valid email"],
  },
  codigo_tecnico: {
    type: String,
    required: [true, "Please enter the code technical"],
    unique: true,
    lowercase: true,
  },
  password: {
    type: String,
    required: [true, "Please enter a password"],
    minlength: [4, "Minimum password length is 4 characters"],
  },
  fullname: String,
  isAdmin: { type: Boolean, default: false },
  isVendedor: { type: Boolean, default: false },
  isTecnico: { type: Boolean, default: false },
  isEstadistica: { type: Boolean, default: false },
});

// fire a function before doc saved to db
userSchema.pre("save", async function (next) {
  const salt = await bcrypt.genSalt();
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// static method to login user
userSchema.statics.login = async function (email, password) {
  const user = await this.findOne({ email });

  if (user) {
    const auth = await bcrypt.compare(password, user.password);
    if (auth) {
      return user;
    }
    throw new Error("incorrect password");
  }
  throw new Error("incorrect email");
};

const User = mongoose.model("user", userSchema);

module.exports = User;
