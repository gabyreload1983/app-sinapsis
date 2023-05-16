const { createLogger, transports, format } = require("winston");
const config = require("../config/config");

const customFormat = format.combine(
  format.timestamp({ format: "DD-MM-YYYY T hh:mm:ss A" }),
  format.printf((info) => {
    return `${info.timestamp} [${info.level.toUpperCase().padEnd(7)}]: ${
      info.message
    }`;
  })
);

let logger;

if (config.NODE_ENV === "production") {
  logger = createLogger({
    format: customFormat,
    transports: [
      new transports.Console({ level: "error" }),
      new transports.File({
        filename: "./logger/files/prod.log",
        level: "error",
      }),
    ],
  });
} else {
  logger = createLogger({
    format: customFormat,
    transports: [
      new transports.Console({ level: "debug" }),
      new transports.File({
        filename: "./logger/files/dev.log",
        level: "debug",
      }),
    ],
  });
}

module.exports = logger;
