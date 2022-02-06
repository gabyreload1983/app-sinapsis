const { Router } = require("express");
const urbano = require("../controllers/urbanoControllers");
const { requireAuth } = require("../middleware/auth");
const admin = require("../middleware/admin");

const router = Router();

router.get("/", urbano.index);
router.get("/taller/ordenReparacion", urbano.ordenDeReparacion);
router.get("/taller/ordenes-en-proceso", urbano.ordenesEnProceso);
router.get("/taller/estadisticas-tecnicos", urbano.estadisticasTecnicos);
router.get("/taller/ingresar-articulo-orden", urbano.ingresarArticuloOrdenGet);
router.post(
  "/taller/ingresar-articulo-orden-buscar",
  urbano.ingresarArticuloOrdenBuscar
);
router.post(
  "/taller/ingresar-articulo-orden-confirmar",
  urbano.ingresarArticuloOrdenConfirmar
);
router.get("/taller/:sector", urbano.ordenesPendientes);

module.exports = router;
