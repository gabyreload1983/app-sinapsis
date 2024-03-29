const connection_urbano = require("../conexion/dbUrbano");
const connection_tickets = require("../conexion/dbTickets");
const constantes = require("../constantes/constantes");
const moment = require("moment");
const logger = require("../logger/logger");
const IngresoEgresoArticulos = require("../models/IngresoEgresoArticulos");
const { buildPdf } = require("../services/buildPdf");
const {
  sendMail,
  getBodyCloseWorkOrder,
  sendPdf,
} = require("../services/sendMail");
const User = require("../models/User");

//Home Page
exports.index = (req, res) => {
  res.render("home");
};

//Funciones

//Querys MYSQL URBANO
function get_from_urbano(querySelect) {
  return new Promise((resolve, reject) => {
    connection_urbano.query(querySelect, (error, result) => {
      if (error) {
        logger.error(error);
        reject(new Error(error));
      } else {
        resolve(result);
      }
    });
  });
}

//Querys MYSQL Tickets
function get_from_tickets(querySelect) {
  return new Promise((resolve, reject) => {
    connection_tickets.query(querySelect, (error, result) => {
      if (error) {
        reject(new Error(error));
      } else {
        resolve(result);
      }
    });
  });
}

//Formatear ordenes
function get_ordenes_formateadas(arrayOrdenes) {
  return new Promise((resolve, reject) => {
    arrayOrdenes.forEach((orden) => {
      orden.nrocompro = orden.nrocompro.slice(10);
      orden.ingresado = moment(orden.ingresado).format("DD-MM-YYYY");
      orden.bgDescription = constantes.bgDescription[orden.estado];
      orden.costo = Math.trunc(orden.costo);
      orden.estado = constantes.descripcion[orden.estado];
      orden.diag = constantes.diag[orden.diag];
      orden.ubicacion = constantes.ubicacion[orden.ubicacion];
      orden.prioridad = constantes.prioridades[orden.prioridad];
      orden.total = orden.costo;
    });
    resolve(arrayOrdenes);
  });
}

function get_reparaciones_por_dia() {
  const query = `SELECT opcional FROM trabajos WHERE nrocompro = "ORX001100012023"`;
  return new Promise((resolve, reject) => {
    connection_urbano.query(query, (error, reparaciones_por_dia) => {
      if (error) {
        reject(new Error(error));
      } else {
        resolve(reparaciones_por_dia);
      }
    });
  });
}

function agregar_codigo_tecnico(arrayTickets) {
  arrayTickets.forEach((ticket) => {
    let codigo = constantes.tecnicos.find(
      (tecnico) => tecnico.nombre === ticket.nombre
    );
    ticket.codigo = codigo.codigo;
  });
  return arrayTickets;
}

//Obtener Orden de reparacion y sus articulos con precios
exports.orden_de_reparacion = async (req, res) => {
  try {
    const codigo_tecnico = req.body.codigo_tecnico_log;
    const host = req.body.host;
    const number_order = req.query.orden;

    logger.info(
      `orden_de_reparacion ${number_order} - Usuario: ${codigo_tecnico} - Host: ${host}`
    );

    const query_orden = `SELECT * FROM trabajos WHERE nrocompro LIKE "ORX0011000${number_order}"`;
    const query_cotizacion_dolar = `SELECT * FROM cotiza  WHERE codigo =  "BD"`;
    const query_articulos_en_orden = `SELECT * FROM trrenglo INNER JOIN articulo ON trrenglo.codart= articulo.codigo
                                     WHERE trrenglo.nrocompro = "ORX0011000${number_order}"`;
    //Buscar Orden de trabajo
    let orden = await get_from_urbano(query_orden);
    if (!orden[0]) {
      res.render("orden_de_reparacion", {
        titulo: "Orden De Reparacion",
        orden: [],
        articulos: [],
      });
    } else {
      //Formatear Ordenes
      orden = await get_ordenes_formateadas(orden);

      //Buscar articulos en orden
      const articulos = await get_from_urbano(query_articulos_en_orden);
      if (articulos[0]) {
        //Obtener Cotizacion Dolar
        const cotizacionDolar = await get_from_urbano(query_cotizacion_dolar);

        //Precio de cada articulo
        articulos.forEach((articulo) => {
          articulo.lista1 = Math.trunc(
            articulo.lista1 *
              constantes.iva[articulo.grabado] *
              cotizacionDolar[0].valorlibre
          );
          //Se suma precio de cada articulo al total de la orden
          orden[0].total += articulo.lista1;
        });
        //Orden con articulos
        res.render("orden_de_reparacion", {
          titulo: "Orden De Reparacion",
          orden: orden[0],
          articulos,
        });
      } else {
        //Orden sin articulos
        res.render("orden_de_reparacion", {
          titulo: "Orden De Reparacion",
          orden: orden[0],
          articulos: [],
        });
      }
    }
  } catch (error) {
    logger.error(
      `orden_de_reparacion - Usuario: ${req.body.codigo_tecnico_log} - Host: ${req.body.host} - Error: ${error.message}`
    );
  }
  res.status(500).send({ status: "error", message: error.message });
};

//Ordenes Pendientes del taller segun sector
exports.ordenes_pendientes = async (req, res) => {
  try {
    const sector = req.params.sector;
    const codigo_tecnico = req.body.codigo_tecnico_log;
    const host = req.body.host;
    logger.info(
      `ordenes_pendientes - Sector: ${sector} - Usuario: ${codigo_tecnico} - Host: ${host}`
    );

    const query_ordenes_pendientes = `SELECT * FROM trabajos 
                    WHERE  codiart = ".${sector}" AND estado = 21 AND codigo != "ANULADO"
                    ORDER BY prioridad DESC`;
    let ordenes_pendientes = await get_from_urbano(query_ordenes_pendientes);
    ordenes_pendientes = await get_ordenes_formateadas(ordenes_pendientes);

    //Reparaciones por dia
    let reparaciones_por_dia = await get_reparaciones_por_dia();
    reparaciones_por_dia = Number(reparaciones_por_dia[0].opcional);

    //Demora en dias del sector
    const demora = Math.trunc(ordenes_pendientes.length / reparaciones_por_dia);

    res.render("ordenes_tabla", {
      ordenes: ordenes_pendientes,
      tomar: true,
      titulo: sector,
      reparaciones_por_dia,
      demora,
      fila: 0,
    });
  } catch (error) {
    logger.error(
      `ordenes_pendientes - Usuario: ${req.body.codigo_tecnico_log} - Host: ${req.body.host} - Error: ${error.message}`
    );
    res.status(500).send({ status: "error", message: error.message });
  }
};

//Ordenes en proceso
exports.ordenes_en_proceso = async (req, res) => {
  try {
    const codigo_tecnico = req.body.codigo_tecnico_log;
    const host = req.body.host;
    logger.info(
      `ordenes_en_proceso - Usuario: ${codigo_tecnico} - Host: ${host}`
    );

    const query_ordenes_en_proceso = `SELECT * FROM trabajos WHERE estado = 22 ORDER BY tecnico`;
    let ordenes_en_proceso = await get_from_urbano(query_ordenes_en_proceso);
    ordenes_en_proceso = await get_ordenes_formateadas(ordenes_en_proceso);

    //Reparaciones por dia
    let reparaciones_por_dia = await get_reparaciones_por_dia();
    reparaciones_por_dia = Number(reparaciones_por_dia[0].opcional);

    //Demora en dias del sector
    const demora = Math.trunc(ordenes_en_proceso.length / reparaciones_por_dia);

    res.render("ordenes_tabla", {
      ordenes: ordenes_en_proceso,
      tomar: false,
      titulo: "En Proceso",
      reparaciones_por_dia,
      demora,
      fila: 0,
    });
  } catch (error) {
    logger.error(
      `ordenes_en_proceso - Usuario: ${req.body.codigo_tecnico_log} - Host: ${req.body.host} - Error: ${error.message}`
    );
    res.status(500).send({ status: "error", message: error.message });
  }
};

//Estadisticas reparacion

class Estadisticas {
  constructor(
    codigo,
    nombre,
    ordenes_terminadas = 0,
    ordenes_sin_reparacion = 0,
    ordenes_pc_armadas = 0,
    tickets_cerrados = 0,
    total = 0
  ) {
    this.codigo = codigo;
    this.nombre = nombre;
    this.ordenes_terminadas = ordenes_terminadas;
    this.ordenes_sin_reparacion = ordenes_sin_reparacion;
    this.ordenes_pc_armadas = ordenes_pc_armadas;
    this.tickets_cerrados = tickets_cerrados;
    this.total = total;
  }
}

exports.estadisticas_tecnicos = async (req, res) => {
  try {
    const codigo_tecnico = req.body.codigo_tecnico_log;
    const host = req.body.host;
    logger.info(
      `estadisticas_tecnicos - Usuario: ${codigo_tecnico} - Host: ${host}`
    );

    if (req.query.desde && req.query.hasta) {
      let desde, hasta;
      let now = new Date();
      now = moment(now).format("YYYY-MM-DD");
      desde = req.query.desde + " 00:00:00";
      hasta = req.query.hasta + " 23:59:59";

      const query_ordenes_terminadas = `SELECT tecnico as codigo, count(*) as ordenes_terminadas
                                      FROM trabajos WHERE 
                                      diagnosticado BETWEEN  "${desde}" AND "${hasta}" AND 
                                      codigo != "ANULADO" AND 
                                      estado= 23 
                                      GROUP BY tecnico`;
      const query_tickets_cerrados = `SELECT UPPER(username) AS nombre, count(*) as tickets_cerrados
                                      FROM ost_osticket.ost_ticket
                                      JOIN ost_staff
                                      USING (staff_id)
                                      WHERE closed BETWEEN "${desde}" AND "${hasta}" AND (status_id = 3 OR status_id= 2)               
                                      GROUP BY staff_id;`;
      const query_ordenes_sin_reparacion = `SELECT tecnico as codigo, count(*) as ordenes_sin_reparacion
                                      FROM trabajos WHERE 
                                      diagnosticado BETWEEN  "${desde}" AND "${hasta}" AND 
                                      codigo != "ANULADO" AND 
                                      estado= 23 AND 
                                      diag=23
                                      GROUP BY tecnico`;
      const query_ordenes_pc_armadas = `SELECT tecnico as codigo, count(*) as ordenes_pc_armadas
                                      FROM trabajos WHERE 
                                      diagnosticado BETWEEN  "${desde}" AND "${hasta}" AND 
                                      codigo != "ANULADO" AND 
                                      estado= 23 AND diag=22 AND prioridad=3
                                      GROUP BY tecnico`;

      let estadisticas = [];

      constantes.tecnicos.forEach((tecnico) => {
        tecnico = new Estadisticas(tecnico.codigo, tecnico.nombre);
        estadisticas.push(tecnico);
      });

      function agregarEstadisticas(array_estadisticas, addKey) {
        array_estadisticas.forEach((estadistica_tecnico) => {
          estadisticas.forEach((estadistica) => {
            if (estadistica.codigo === estadistica_tecnico.codigo)
              estadistica[addKey] = estadistica_tecnico[addKey];
          });
        });
      }

      //Ordenes Reparadas
      const ordenes_terminadas = await get_from_urbano(
        query_ordenes_terminadas
      );
      agregarEstadisticas(ordenes_terminadas, "ordenes_terminadas");

      //Tickets Cerrados
      let tickets_cerrados = await get_from_tickets(query_tickets_cerrados);
      tickets_cerrados = agregar_codigo_tecnico(tickets_cerrados);
      agregarEstadisticas(tickets_cerrados, "tickets_cerrados");

      //Calcular total reparaciones
      estadisticas.forEach((tecnico) => {
        tecnico.total = tecnico.ordenes_terminadas + tecnico.tickets_cerrados;
      });

      //Filtrar tecnicos sin reparaciones
      estadisticas = estadisticas.filter((tecnico) => tecnico.total > 0);

      //Ordenar estadisticas
      estadisticas.sort((a, b) => {
        return b.total - a.total;
      });

      //Ordenes sin Reparacion
      const ordenes_sin_reparacion = await get_from_urbano(
        query_ordenes_sin_reparacion
      );
      agregarEstadisticas(ordenes_sin_reparacion, "ordenes_sin_reparacion");

      //Ordenes PC Armadas
      const ordenes_pc_armadas = await get_from_urbano(
        query_ordenes_pc_armadas
      );
      agregarEstadisticas(ordenes_pc_armadas, "ordenes_pc_armadas");

      //se formatea para enviar a la vista
      desde = moment(desde).format("YYYY-MM-DD");
      hasta = moment(hasta).format("YYYY-MM-DD");

      res.render("estadisticas", {
        titulo: "Estadisticas",
        desde: desde,
        hasta: hasta,
        estadisticas: estadisticas,
      });
    } else {
      desde = "";
      hasta = "";
      res.render("estadisticas", {
        titulo: "Estadisticas",
        desde: "",
        hasta: "",
        estadisticas: "",
      });
    }
  } catch (error) {
    logger.error(
      `estadisticas_tecnicos - Usuario: ${req.body.codigo_tecnico_log} - Host: ${req.body.host} - Error: ${error.message}`
    );
    res.status(500).send({ status: "error", message: error.message });
  }
};

exports.tomar_orden = async (req, res) => {
  try {
    const host = req.body.host;
    const codigo_tecnico = req.body.codigo_tecnico_log.toUpperCase();
    const orden_reparacion = req.body.orden_reparacion;
    const query_tomar_orden = `UPDATE trabajos
                                  SET estado=22, tecnico="${codigo_tecnico}"
                                  WHERE nrocompro="ORX0011000${orden_reparacion}"`;

    let orden_tomada = await get_from_urbano(query_tomar_orden);
    if (orden_tomada.affectedRows) {
      logger.info(
        `tomar_orden - Usuario: ${codigo_tecnico} - Host: ${host} orden: ${orden_reparacion}`
      );

      res.status(200).send({
        titulo: "Tomar orden",
        transaccion: true,
      });
    } else {
      res.status(200).send({
        titulo: "Tomar orden",
        transaccion: false,
      });
    }
  } catch (error) {
    logger.error(
      `tomar_orden - Usuario: ${req.body.codigo_tecnico_log} - Host: ${req.body.host} - Error: ${error.message}`
    );
    res.status(500).send({ status: "error", message: error.message });
  }
};

//Ordenes para retirar
exports.ordenes_para_retirar = async (req, res) => {
  try {
    const desde = "2022-01-01";

    const host = req.body.host;
    const codigo_tecnico = req.body.codigo_tecnico_log;
    const query_ordenes_para_retirar = `SELECT * FROM trabajos WHERE 
                                          ingresado > "${desde} 00:00:00" AND
                                          codigo != "ANULADO" AND 
                                          estado = 23  AND 
                                          diag = 22 AND
                                          ubicacion = 21
                                          ORDER BY ingresado DESC`;

    let ordenes_para_retirar = await get_from_urbano(
      query_ordenes_para_retirar
    );

    ordenes_para_retirar = await get_ordenes_formateadas(ordenes_para_retirar);

    logger.info(
      `ordenes_para_retirar - Usuario: ${codigo_tecnico} - Host: ${host}`
    );

    res.render("ordenes_tabla", {
      titulo: "Ordenes Para Retirar",
      ordenes: ordenes_para_retirar,
      tomar: false,
      reparaciones_por_dia: false,
      demora: false,
      fila: 0,
    });
  } catch (error) {
    logger.error(
      `ordenes_para_retirar - Usuario: ${req.body.codigo_tecnico_log} - Host: ${req.body.host} - Error: ${error.message}`
    );
    res.status(500).send({ status: "error", message: error.message });
  }
};

//Mis ordenes tomadas
exports.mis_ordenes_tomadas = async (req, res) => {
  try {
    const codigo_tecnico = req.body.codigo_tecnico_log.toUpperCase();
    const host = req.body.host;
    logger.info(
      `mis_ordenes_tomadas - Usuario: ${codigo_tecnico} - Host: ${host}`
    );

    const query_mis_ordenes_tomadas = `SELECT * FROM trabajos 
                    WHERE tecnico="${codigo_tecnico}" AND estado = 22 AND codigo != "ANULADO"
                    ORDER BY prioridad DESC`;
    let mis_ordenes_tomadas = await get_from_urbano(query_mis_ordenes_tomadas);
    mis_ordenes_tomadas = await get_ordenes_formateadas(mis_ordenes_tomadas);

    res.render("mis_ordenes_tomadas", {
      titulo: "Mis Ordenes Tomadas",
      ordenes: mis_ordenes_tomadas,
      diagnostico: true,
      tomar: false,
      reparaciones_por_dia: false,
      demora: false,
      fila: 0,
    });
  } catch (error) {
    logger.error(
      `mis_ordenes_tomadas - Usuario: ${req.body.codigo_tecnico_log} - Host: ${req.body.host} - Error: ${error.message}`
    );
    res.status(500).send({ status: "error", message: error.message });
  }
};

//guardar_diagnostico_orden
exports.guardar_diagnostico_orden = async (req, res) => {
  try {
    const codigo_tecnico = req.body.codigo_tecnico_log.toUpperCase();
    const { host, orden, diagnostico, costo } = req.body;

    const query_actualizar_diagnostico = `UPDATE trabajos SET diagnostico = "${diagnostico}", costo = ${costo}, pendiente = ${costo} 
                                              WHERE nrocompro= "ORX0011000${orden}"`;

    const result = await get_from_urbano(query_actualizar_diagnostico);

    if (result.affectedRows !== 0) {
      logger.info(
        `guardar_diagnostico_orden - Se guardo diagnostico - costo: ${costo} Usuario: ${codigo_tecnico} - Host: ${host}`
      );
      res.status(200).send(result);
    } else {
      logger.info(
        `guardar_diagnostico_orden - NO se guardo diagnostico - Usuario: ${codigo_tecnico} - Host: ${host}`
      );
      res.status(404).send({ result: false });
    }
  } catch (error) {
    logger.error(
      `guardar_diagnostico_orden - Usuario: ${req.body.codigo_tecnico_log} - Host: ${req.body.host} - Error: ${error.message}`
    );
    res.status(500).send({ status: "error", message: error.message });
  }
};

// agregar articulo en orden VIEW
exports.agregar_articulo_orden = async (req, res) => {
  try {
    const { host, codigo_tecnico_log: codigo_tecnico } = req.body;

    logger.info(
      `agregar_articulo_orden - Usuario: ${codigo_tecnico} - Host: ${host}`
    );

    res.render("agregar_quitar_articulo_orden", {
      titulo: "agregar articulo orden",
      agregarArticulo: true,
    });
  } catch (error) {
    logger.error(
      `agregar_articulo_orden - Usuario: ${req.body.codigo_tecnico_log} - Host: ${req.body.host} - Error: ${error.message}`
    );
    res.status(500).send({ status: "error", message: error.message });
  }
};

// quitar articulo en orden VIEW
exports.quitar_articulo_orden = async (req, res) => {
  try {
    const { host, codigo_tecnico_log: codigo_tecnico } = req.body;

    logger.info(
      `quitar_articulo_orden - Usuario: ${codigo_tecnico} - Host: ${host}`
    );

    res.render("agregar_quitar_articulo_orden", {
      titulo: "quitar articulo orden",
      agregarArticulo: false,
    });
  } catch (error) {
    logger.error(
      `quitar_articulo_orden - Usuario: ${req.body.codigo_tecnico_log} - Host: ${req.body.host} - Error: ${error.message}`
    );
    res.status(500).send({ status: "error", message: error.message });
  }
};

//buscar orden de reparacion
exports.buscar_orden_reparacion = async (req, res) => {
  try {
    const { host, codigo_tecnico_log: codigo_tecnico } = req.body;
    const { orden_reparacion } = req.query;

    const query_orden = `SELECT * FROM trabajos WHERE nrocompro = "ORX0011000${orden_reparacion}"`;
    const query_articulos_en_orden = `SELECT * FROM trrenglo INNER JOIN articulo ON trrenglo.codart= articulo.codigo
                                     WHERE trrenglo.nrocompro = "ORX0011000${orden_reparacion}"`;

    //Buscar orden
    let orden = await get_from_urbano(query_orden);

    //validar si existe la orden
    if (orden.length !== 0) {
      //ver si la orden esta tomada
      if (!orden[0].tecnico) {
        res.status(200).send({
          titulo: "Buscar orden",
          orden: false,
          articulos: false,
          codigo_tecnico: false,
          errorMessage: `El tecnico debe tomar la orden.`,
        });
      } else {
        //Buscar articulos en orden
        const articulos = await get_from_urbano(query_articulos_en_orden);

        logger.info(
          `buscar_orden_reparacion - Usuario: ${codigo_tecnico} - Host: ${host} 
        Busqueda orden: ${orden_reparacion}`
        );
        res.status(200).send({
          titulo: "Buscar orden",
          orden: orden,
          articulos: articulos,
          codigo_tecnico: codigo_tecnico,
        });
      }
    } else {
      res.status(200).send({
        titulo: "Buscar orden",
        orden: false,
        articulos: false,
        codigo_tecnico: false,
        errorMessage: `Orden ${orden_reparacion} no existe...`,
      });
    }
  } catch (error) {
    logger.error(
      `buscar_orden_reparacion - Usuario: ${req.body.codigo_tecnico_log} - Host: ${req.body.host} - Error: ${error.message}`
    );
    res.status(500).send({ status: "error", message: error.message });
  }
};

//buscar articulo
exports.buscar_articulo = async (req, res) => {
  try {
    const { host, codigo_tecnico_log: codigo_tecnico } = req.body;
    const { articulo } = req.query;

    const query_buscar_articulo_codigo = `SELECT 
                                            articulo.codigo AS codigo, 
                                            articulo.descrip AS descripcion, 
                                            (stockd01 - reserd01) AS stock,
                                            articulo.trabaserie
                                            FROM articulo 
                                            INNER JOIN artstk01
                                            ON articulo.codigo= artstk01.codigo
                                            WHERE articulo.codigo = "${articulo}" AND (stockd01 - reserd01) > 0`;
    const query_buscar_articulo_descripcion = `SELECT 
                                    articulo.codigo AS codigo, 
                                    articulo.descrip AS descripcion, 
                                    (stockd01 - reserd01) AS stock,
                                    articulo.trabaserie
                                    FROM articulo 
                                    INNER JOIN artstk01
                                    ON articulo.codigo= artstk01.codigo
                                    WHERE articulo.descrip LIKE "%${articulo}%" AND (stockd01 - reserd01) > 0
                                    ORDER BY articulo.descrip`;

    let articulos = await get_from_urbano(query_buscar_articulo_codigo);

    if (articulos.length === 0)
      articulos = await get_from_urbano(query_buscar_articulo_descripcion);

    if (articulos.length !== 0) {
      logger.info(
        `buscar_articulo - ${articulo} - Usuario: ${codigo_tecnico} - Host: ${host}`
      );
      res.status(200).send({
        titulo: "Buscar orden",
        articulos: articulos,
      });
    } else {
      res.status(400).send({
        titulo: "Buscar orden",
        articulos: false,
      });
    }
  } catch (error) {
    logger.error(
      `buscar_articulo - Usuario: ${req.body.codigo_tecnico_log} - Host: ${req.body.host} - Error: ${error.message}`
    );
    res.status(500).send({ status: "error", message: error.message });
  }
};

//buscar serie
exports.buscar_serie = async (req, res) => {
  try {
    const { host, codigo_tecnico_log: codigo_tecnico } = req.body;
    const { serie, codigo } = req.query;

    const query_buscar_serie = `SELECT * FROM serie2 
                                  INNER JOIN articulo ON serie2.codigo = articulo.codigo 
                                  WHERE serie = "${serie}" LIMIT 1`;

    const serieOk = await get_from_urbano(query_buscar_serie);

    logger.info(
      `buscar_serie - ${serie} - Usuario: ${codigo_tecnico} - Host: ${host}`
    );

    if (serieOk.length !== 0 && serieOk[0].codigo !== codigo) {
      res.status(200).send({
        titulo: "Buscar serie",
        serieOk: false,
      });
    } else {
      res.status(200).send({
        titulo: "Buscar serie",
        serieOk: serieOk,
      });
    }
  } catch (error) {
    logger.error(
      `buscar_serie - Usuario: ${req.body.codigo_tecnico_log} - Host: ${req.body.host} - Error: ${error.message}`
    );
    res.status(500).send({ status: "error", message: error.message });
  }
};

exports.ingresar_articulos = async (req, res) => {
  try {
    const {
      host,
      codigo_tecnico_log: codigo_tecnico,
      ingresoArticulos,
    } = req.body;

    const ingresarArticulo = async (articulo, ingresoArticulos) => {
      let query_ingresar_articulo_orden = `INSERT INTO trrenglo
      (serie, ingreso, festado, asignado, fdiag, cliente, operador, falla, tecnico, codart, descart, nrocompro, seguridad, costo, pendiente, tipo, sector, diag )
      VALUES (
        "${articulo.serie}", NOW(), NOW(), NOW(), NOW(), "${ingresoArticulos.codigo}", 
        "${ingresoArticulos.usuario}", "FALLA", "${ingresoArticulos.tecnico}", 
        "${articulo.codigo}", "${articulo.descripcion}", "${ingresoArticulos.orden}", 
        "MOSTRADORGABY 00:01", 0.0000, 1.0000, "ST", "E", "RE" )`;

      return await get_from_urbano(query_ingresar_articulo_orden);
    };

    const reservaArticulo = async (articulo) => {
      let query_reserva_articulo = `UPDATE artstk01 SET reserd01 = reserd01 + 1 WHERE codigo = "${articulo.codigo}"`;
      return await get_from_urbano(query_reserva_articulo);
    };

    //Ingreso y reserva de articulos en mysql urbano
    for (const articulo of ingresoArticulos.articulos) {
      const ingreso = await ingresarArticulo(articulo, ingresoArticulos);
      logger.info(`Ingreso ${articulo.codigo} - ${ingreso.affectedRows}`);
      const reserva = await reservaArticulo(articulo);
      logger.info(`Reserva ${articulo.codigo} - ${reserva.affectedRows}`);
    }

    //Crear arreglo de articulos
    let articulos = [];
    for (let articulo of ingresoArticulos.articulos) {
      articulos.push(articulo);
    }

    //Grabar transaccion en Mongodb
    const data = {
      sentido: "INGRESO",
      usuario: `${ingresoArticulos.usuario}`,
      codigo: `${ingresoArticulos.codigo}`,
      cliente: `${ingresoArticulos.cliente}`,
      orden: `${ingresoArticulos.orden}`,
      tecnico: `${ingresoArticulos.tecnico}`,
      articulos: articulos,
    };
    const transaction = await IngresoEgresoArticulos.create(data);

    //enviar mail con pdf al tecnico
    const technical = await User.findOne({
      codigo_tecnico: ingresoArticulos.tecnico,
    });

    await sendPdf(data, technical.email);

    logger.info(`ingresar_articulos - Host: ${host}
    ${transaction}`);

    res.status(200).send({
      titulo: "ingresar_articulos",
      transaccion: true,
      id: transaction._id,
    });
  } catch (error) {
    logger.error(
      `ingresar_articulos - Usuario: ${req.body.codigo_tecnico_log} - Host: ${req.body.host} - Error: ${error.message}`
    );
    res.status(500).send({ status: "error", message: error.message });
  }
};

exports.quitar_articulos = async (req, res) => {
  try {
    const {
      host,
      codigo_tecnico_log: codigo_tecnico,
      quitarArticulos,
    } = req.body;

    const sacarArticulo = async (articulo, quitarArticulos) => {
      let query_quitar_articulo_orden = `UPDATE trrenglo SET 
      tipo="", sector="", diag="", serie="", ingreso="", festado="", asignado="", fdiag="", egreso="", cliente="", operador="", falla="", tecnico="", codart="", descart="", nrocompro="", seguridad="", costo="", pendiente=""
      WHERE  cliente = "${quitarArticulos.codigo}" AND 
      codart= "${articulo.codigo}" AND 
      nrocompro = "${quitarArticulos.orden}" AND 
      serie = "${articulo.serie}" 
      LIMIT 1`;

      return await get_from_urbano(query_quitar_articulo_orden);
    };

    const sacarReservaArticulo = async (articulo) => {
      let query_quitar_reserva_articulo = `UPDATE artstk01 SET reserd01 = reserd01 - 1 WHERE codigo = "${articulo.codigo}"`;
      return await get_from_urbano(query_quitar_reserva_articulo);
    };

    //Sacar reserva de articulos y de orden en mysql urbano
    for (const articulo of quitarArticulos.articulos) {
      const sacar = await sacarArticulo(articulo, quitarArticulos);
      logger.info(`Sacar ${articulo.codigo} - ${sacar.affectedRows}`);
      const reserva = await sacarReservaArticulo(articulo);
      logger.info(`Sacar Reserva ${articulo.codigo} - ${reserva.affectedRows}`);
    }

    //Crear arreglo de articulos
    let articulos = [];
    for (let articulo of quitarArticulos.articulos) {
      articulos.push(articulo);
    }

    //Grabar transaccion en Mongodb
    const data = {
      sentido: "EGRESO",
      usuario: `${quitarArticulos.usuario}`,
      codigo: `${quitarArticulos.codigo}`,
      cliente: `${quitarArticulos.cliente}`,
      orden: `${quitarArticulos.orden}`,
      tecnico: `${quitarArticulos.tecnico}`,
      articulos: articulos,
    };
    const transaccion = await IngresoEgresoArticulos.create(data);

    //enviar mail con pdf al tecnico
    const technical = await User.findOne({
      codigo_tecnico: quitarArticulos.tecnico,
    });

    await sendPdf(data, technical.email);

    logger.info(`quitar_articulos - Host: ${host}
      ${transaccion}`);

    res.status(200).send({
      titulo: "quitar_articulos",
      transaccion: true,
      id: transaccion._id,
      orden: `${quitarArticulos.orden}`,
    });
  } catch (error) {
    logger.error(
      `quitar_articulos - Usuario: ${req.body.codigo_tecnico_log} - Host: ${req.body.host} - Error: ${error.message}`
    );
    res.status(500).send({ status: "error", message: error.message });
  }
};

//salida orden
exports.salida_orden = async (req, res) => {
  try {
    const { host, codigo_tecnico_log: codigo_tecnico, orden } = req.body;
    const query_salida_orden = `UPDATE trabajos SET ubicacion = 22 WHERE nrocompro = "ORX0011000${orden}"`;

    const query_articulos_en_orden = `SELECT * FROM trrenglo INNER JOIN articulo ON trrenglo.codart= articulo.codigo
    WHERE trrenglo.nrocompro = "ORX0011000${orden}"`;

    const articulosEnOrden = await get_from_urbano(query_articulos_en_orden);

    logger.info(
      `Inicio >>> Salida orden ${orden} - ${
        articulosEnOrden.length === 0 ? "Sin articulos" : "Con articulos"
      }`
    );

    if (articulosEnOrden.length !== 0) {
      const sacarReservaArticulo = async (articulo) => {
        let query_sacar_reserva_articulo = `UPDATE artstk01 SET reserd01 = reserd01 -1 WHERE codigo = "${articulo.codart}"`;
        return await get_from_urbano(query_sacar_reserva_articulo);
      };

      for (const articulo of articulosEnOrden) {
        const result = await sacarReservaArticulo(articulo);
        logger.info(
          `Sacar reserva ${articulo.codigo} - affectedRows: ${result.affectedRows}`
        );
      }
    }

    //Salida Orden
    result = await get_from_urbano(query_salida_orden);

    if (result.affectedRows) {
      logger.info(
        `salida_orden - ${orden} - Usuario: ${codigo_tecnico} - Host: ${host}`
      );
      res.status(200).send({
        titulo: "Salida Orden",
        transaccion: true,
      });
    } else {
      logger.info(
        `salida_orden NO SE DIO SALIDA ORDEN:${orden} - Usuario: ${codigo_tecnico} - Host: ${host}`
      );
      res.status(200).send({
        titulo: "Salida Orden",
        transaccion: false,
      });
    }
  } catch (error) {
    logger.error(
      `salida_orden - Usuario: ${req.body.codigo_tecnico_log} - Host: ${req.body.host} - Error: ${error.message}`
    );
    res.status(500).send({ status: "error", message: error.message });
  }
};

//Cerrar orden
exports.cerrar_orden = async (req, res) => {
  try {
    const {
      host,
      codigo_tecnico_log: codigo_tecnico,
      orden,
      diagnostico,
      sendMailFlag = false,
    } = req.body;

    const query_cerrar_orden = `UPDATE trabajos SET estado = 23, diag = ${
      diagnostico === "reparado" ? 22 : 23
    }, diagnosticado = NOW() WHERE nrocompro = "ORX0011000${orden}"`;

    const result = await get_from_urbano(query_cerrar_orden);

    if (result.affectedRows) {
      logger.info(
        `cerrar_orden - ${orden} - Usuario: ${codigo_tecnico} - Host: ${host}`
      );
      if (sendMailFlag) {
        const query_get_mail = `SELECT clientes.mail FROM clientes INNER JOIN trabajos ON clientes.codigo = trabajos.codigo WHERE nrocompro = 'ORX0011000${orden}'`;
        const mail = await get_from_urbano(query_get_mail);
        if (mail[0].mail) {
          const body = getBodyCloseWorkOrder(orden);
          const resp = await sendMail(
            mail[0].mail,
            body,
            "Servicio Técnico Sinapsis"
          );
          logger.info(`Se envio mail orden ${orden} a: ${resp.accepted}`);
        }
      }
      res.status(200).send({
        titulo: "Cerrar Orden",
        transaccion: true,
        orden,
      });
    } else {
      logger.info(
        `cerrar_orden NO SE CERRO ORDEN:${orden} - Usuario: ${codigo_tecnico} - Host: ${host}`
      );
      res.status(200).send({
        titulo: "Cerrar Orden",
        transaccion: false,
      });
    }
  } catch (error) {
    logger.error(
      `cerrar_orden - Usuario: ${req.body.codigo_tecnico_log} - Host: ${req.body.host} - Error: ${error.message}`
    );
    res.status(500).send({ status: "error", message: error.message });
  }
};

//Cerrar liberar
exports.liberar_orden = async (req, res) => {
  try {
    const { host, codigo_tecnico_log: codigo_tecnico, orden } = req.body;

    const query = `UPDATE trabajos SET estado = 21, diag = 21, tecnico = '' WHERE nrocompro = 'ORX0011000${orden}'`;

    const result = await get_from_urbano(query);

    if (result.affectedRows) {
      logger.info(
        `liberar_orden - ${orden} - Usuario: ${codigo_tecnico} - Host: ${host}`
      );

      res.status(200).send({
        titulo: "Liberar Orden",
        transaccion: true,
        orden,
      });
    } else {
      logger.info(
        `NO SE LIBERO ORDEN:${orden} - Usuario: ${codigo_tecnico} - Host: ${host}`
      );
      res.status(400).send({
        titulo: "Liberar Orden",
        transaccion: false,
      });
    }
  } catch (error) {
    res.status(500).send({ status: "error", message: error.message });
  }
};

exports.buscar_ingreso_egreso_articulos = async (req, res) => {
  try {
    const { host, codigo_tecnico_log: codigo_tecnico } = req.body;
    const { id: _id } = req.params;
    const transaccion = await IngresoEgresoArticulos.findById(_id);

    logger.info(`buscar_ingreso_egreso_articulos - Host: ${host} -  Usuario: ${codigo_tecnico}
     ${transaccion._id}`);

    const stream = res.writeHead(200, {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment;filename=${transaccion.orden.slice(
        10
      )}.pdf`,
    });

    buildPdf(
      (chunk) => stream.write(chunk),
      () => stream.end(),
      transaccion
    );
  } catch (error) {
    logger.error(
      `buscar_ingreso_egreso_articulos - Usuario: ${req.body.codigo_tecnico_log} - Host: ${req.body.host} - Error: ${error.message}`
    );
    res.status(500).send({ status: "error", message: error.message });
  }
};

exports.historial_ingreso_egreso_articulos = async (req, res) => {
  try {
    const { host, codigo_tecnico_log: codigo_tecnico } = req.body;
    // const { from, to } = req.params;
    let transaccion = await IngresoEgresoArticulos.find()
      .limit(30)
      .sort({ date: -1 });

    logger.info(
      `historial_ingreso_egreso_articulos - ${codigo_tecnico} - Host: ${host}`
    );

    res.render("historialIngresoEgresoArticulos", {
      titulo: "historial_ingreso_egreso_articulos",
      transaccion,
    });
  } catch (error) {
    logger.error(
      `historial_ingreso_egreso_articulos - Usuario: ${req.body.codigo_tecnico_log} - Host: ${req.body.host} - Error: ${error.message}`
    );
    res.status(500).send({ status: "error", message: error.message });
  }
};

//Ordenes sin reparacion
exports.ordenesSinReparacion = async (req, res) => {
  try {
    let now = new Date();
    const yearAgo = moment(now.setFullYear(now.getFullYear() - 1)).format(
      "YYYY-MM-DD"
    );

    const host = req.body.host;
    const codigo_tecnico = req.body.codigo_tecnico_log;
    const query = `SELECT * FROM trabajos WHERE 
                                          ingresado > "${yearAgo} 00:00:00" AND
                                          codigo != "ANULADO" AND 
                                          estado = 23  AND 
                                          diag = 23 AND
                                          ubicacion = 21
                                          ORDER BY ingresado DESC`;

    let ordenesSinReparacion = await get_from_urbano(query);

    ordenesSinReparacion = await get_ordenes_formateadas(ordenesSinReparacion);

    logger.info(
      `ordenesSinReparacion - Usuario: ${codigo_tecnico} - Host: ${host}`
    );

    res.render("ordenes_tabla", {
      titulo: "ordenesSinReparacion",
      ordenes: ordenesSinReparacion,
      tomar: false,
      reparaciones_por_dia: false,
      demora: false,
      fila: 0,
    });
  } catch (error) {
    logger.error(
      `ordenesSinReparacion - Usuario: ${req.body.codigo_tecnico_log} - Host: ${req.body.host} - Error: ${error.message}`
    );
    res.status(500).send({ status: "error", message: error.message });
  }
};
