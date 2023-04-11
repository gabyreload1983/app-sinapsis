const { dirname } = require("path");

const filename = require.resolve("./utils.js");
const absolutePath = dirname(filename);

module.exports = absolutePath;
