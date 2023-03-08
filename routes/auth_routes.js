const { Router } = require("express");
const auth_controller = require("../controllers/auth_controller");
const admin = require("../middleware/admin");

const router = Router();

router.get("/signup", admin, auth_controller.signup_get);
router.post("/signup", admin, auth_controller.signup_post);
router.get("/login", auth_controller.login_get);
router.post("/login", auth_controller.login_post);
router.get("/logout", auth_controller.logout_get);

module.exports = router;
