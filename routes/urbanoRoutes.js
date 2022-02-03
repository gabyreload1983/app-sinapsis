const { Router } = require("express");
const urbano = require("../controllers/urbanoControllers");
// const authController = require("../controllers/authControllers");
const { requireAuth } = require("../middleware/auth");
const admin = require("../middleware/admin");

const router = Router();

router.get("/", urbano.index);
router.get("/taller/ordenReparacion", urbano.ordenDeReparacion);
router.get("/taller/ordenes-en-proceso", urbano.ordenesEnProceso);
router.get("/taller/estadisticas-tecnicos", urbano.estadisticasTecnicos);
router.get("/taller/:sector", urbano.ordenesPendientes);
/* router.get("/urbano/taller/estadisticas", getEstadisticas);
router.get("/urbano/taller/estadisticas/:inicio/:final", getEstadisticas); */

module.exports = router;
