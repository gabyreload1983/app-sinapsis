const { Router } = require("express");
const urbano = require("../controllers/urbano_controller");
const { requireAuth } = require("../middleware/auth");
const admin = require("../middleware/admin");

const router = Router();

router.get("/", urbano.index);
router.get("/taller/orden-reparacion", urbano.orden_de_reparacion);
router.get("/taller/ordenes-en-proceso", urbano.ordenes_en_proceso);
router.get("/taller/estadisticas-tecnicos", urbano.estadisticas_tecnicos);
router.get(
  "/taller/ingresar-articulo-orden",
  urbano.ingresar_articulo_orden_get
);
router.post(
  "/taller/ingresar-articulo-orden-buscar",
  urbano.ingresar_articulo_orden_buscar
);
router.post(
  "/taller/ingresar-articulo-orden-confirmar",
  urbano.ingresar_articulo_orden_confirmar
);
router.post("/taller/buscar-orden", urbano.buscar_orden_reparacion);
router.post("/taller/buscar-articulo", urbano.buscar_articulo);
router.post("/taller/buscar-articulo-serie", urbano.buscar_articulo_serie);

router.get("/taller/:sector", urbano.ordenes_pendientes);

module.exports = router;
