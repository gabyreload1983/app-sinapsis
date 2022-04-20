const { Router } = require("express");
const urbano = require("../controllers/urbano_controller");
const { requireAuth } = require("../middleware/auth");
const admin = require("../middleware/admin");

const router = Router();

router.get("/", urbano.index);
router.get("/taller/orden-reparacion", urbano.orden_de_reparacion);
router.get("/taller/ordenes-en-proceso", urbano.ordenes_en_proceso);
router.get("/taller/mis-ordenes-tomadas", urbano.mis_ordenes_tomadas);
router.get("/taller/estadisticas-tecnicos", urbano.estadisticas_tecnicos);
router.get("/taller/ordenes-para-retirar", urbano.ordenes_para_retirar);
router.get("/taller/agregar-articulo-orden", urbano.agregar_articulo_orden);
router.get("/taller/quitar-articulo-orden", urbano.quitar_articulo_orden);
router.get("/taller/buscar-orden-reparacion", urbano.buscar_orden_reparacion);
router.get("/taller/buscar-articulo", urbano.buscar_articulo);
router.get("/taller/buscar-serie", urbano.buscar_serie);
router.get("/taller/:sector", urbano.ordenes_pendientes);

router.post(
  "/taller/guardar-diagnostico-orden",
  urbano.guardar_diagnostico_orden
);
router.post("/taller/tomar-orden", urbano.tomar_orden);
router.post("/taller/ingresar-articulos", urbano.ingresar_articulos);
router.post("/taller/quitar-articulos", urbano.quitar_articulos);

module.exports = router;
