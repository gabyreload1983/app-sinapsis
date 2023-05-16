const express = require("express");
const mongoose = require("mongoose");
const index_router = require("./routes/index_router");
const auth_routes = require("./routes/auth_routes");
const urbano_routes = require("./routes/urbano_routes");
const cookieParser = require("cookie-parser");
const { requireAuth, checkUser } = require("./middleware/auth");
const logger = require("./logger/logger");
const config = require("./config/config");

const app = express();

// middleware
app.use(express.static("public"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// view engine
app.set("view engine", "ejs");

//Environment
logger.info(`NODE_ENV: ${config.NODE_ENV}`);
logger.info(`EXPRESS: ${app.get("env")}`);
//comment

//Se chequea variables de entorno
if (!config.MONGO_CREDENTIALS) {
  logger.error("FATAL ERROR: mongo's environment variables missing...");
  process.exit(1);
}
if (!config.JWT_PRIVATE_KEY) {
  logger.error("FATAL ERROR: jwtPrivateKey is not defined...");
  process.exit(1);
}

// database connection
const dbURI = `mongodb+srv://${config.MONGO_CREDENTIALS}@gabysystem.c81cfnu.mongodb.net/gabysystem?retryWrites=true&w=majority`;
mongoose
  .connect(dbURI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true,
  })
  .then((result) => {
    logger.info("Connected to mongoDB...");
    const port = config.PORT;
    app.listen(port, () => logger.info(`Listening on port ${port}...`));
  })
  .catch((err) => {
    logger.error(`Error connecting MongoDB: ${err.message}`);
    process.exit(1);
  });

// routes
app.get("*", checkUser);
app.post("*", checkUser);

app.use("/", index_router);
app.use(auth_routes);
app.use("/urbano", requireAuth, urbano_routes);
