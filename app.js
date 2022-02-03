const express = require("express");
const mongoose = require("mongoose");
const indexRouter = require("./routes/indexRouter");
const authRoutes = require("./routes/authRoutes");
const urbanoRoutes = require("./routes/urbanoRoutes");
const cookieParser = require("cookie-parser");
const { requireAuth, checkUser } = require("./middleware/auth");
const config = require("config");
const logger = require("./logger/logger");

const app = express();

// middleware
app.use(express.static("public"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// view engine
app.set("view engine", "ejs");

//Environment
logger.info(`NODE_ENV: ${process.env.NODE_ENV}`);

//Se chequea variables de entorno
if (!config.get("mongoDb")) {
  logger.error("FATAL ERROR: db is not defined...");
  process.exit(1);
}
if (!config.get("jwtPrivateKey")) {
  logger.error("FATAL ERROR: jwtPrivateKey is not defined...");
  process.exit(1);
}

// database connection
const mongoDb = config.get("mongoDb");
const dbURI = `mongodb+srv://${mongoDb}@cluster0.4hbz9.mongodb.net/urbano?retryWrites=true&w=majority`;
mongoose
  .connect(dbURI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true,
  })
  .then((result) => {
    logger.info("Connected to mongoDB...");
    const PORT = config.get("PORT");
    const port = process.env.PORT || PORT;
    app.listen(port, () => logger.info(`Listening on port ${port}...`));
  })
  .catch((err) => {
    logger.error(`MongoDB error: ${err.message}`);
  });

// routes
app.get("*", checkUser);
app.post("*", checkUser);

app.use("/", indexRouter);
app.use(authRoutes);
app.use("/urbano", requireAuth, urbanoRoutes);

// Production
// require("./prod")(app);