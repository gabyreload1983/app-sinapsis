const { Router } = require("express");
const authController = require("../controllers/authControllers");
const admin = require("../middleware/admin");

const router = Router();

router.get("/signup", admin, authController.signup_get);
router.post("/signup", admin, authController.signup_post);
router.get("/login", authController.login_get);
router.post("/login", authController.login_post);
router.get("/logout", authController.logout_get);

module.exports = router;
