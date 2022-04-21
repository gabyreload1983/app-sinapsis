const connection_urbano = require("../conexion/dbUrbano");
const connection_tickets = require("../conexion/dbTickets");
const constantes = require("../constantes/constantes");
const moment = require("moment");
const logger = require("../logger/logger");

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
    logger.info(
      `orden_de_reparacion - Usuario: ${codigo_tecnico} - Host: ${host}`
    );

    const number_order = req.query.orden;
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
        console.log(orden[0]);
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
  }
};

//guardar_diagnostico_orden
exports.guardar_diagnostico_orden = async (req, res) => {
  try {
    const codigo_tecnico = req.body.codigo_tecnico_log.toUpperCase();
    const { host, orden, diagnostico } = req.body;

    const query_actualizar_diagnostico = `UPDATE trabajos SET diagnostico = "${diagnostico}" WHERE nrocompro= "ORX0011000${orden}"`;

    const result = await get_from_urbano(query_actualizar_diagnostico);

    if (result.affectedRows !== 0) {
      logger.info(
        `guardar_diagnostico_orden - Se guardo diagnostico - Usuario: ${codigo_tecnico} - Host: ${host}`
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
  }
};

// agregar articulo en orden
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
  }
};

// agregar articulo en orden
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

    if (orden.length !== 0) {
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
    } else {
      res.status(200).send({
        titulo: "Buscar orden",
        orden: false,
        articulos: false,
        codigo_tecnico: false,
      });
    }
  } catch (error) {
    logger.error(
      `buscar_orden_reparacion - Usuario: ${req.body.codigo_tecnico_log} - Host: ${req.body.host} - Error: ${error.message}`
    );
  }
};

//buscar articulo
exports.buscar_articulo = async (req, res) => {
  try {
    const { host, codigo_tecnico_log: codigo_tecnico } = req.body;
    const { articulo } = req.query;

    const query_buscar_articulo = `SELECT 
                                    articulo.codigo AS codigo, 
                                    articulo.descrip AS descripcion, 
                                    (stockd01 - reserd01) AS stock,
                                    articulo.trabaserie
                                    FROM articulo 
                                    INNER JOIN artstk01
                                    ON articulo.codigo= artstk01.codigo
                                    WHERE articulo.descrip LIKE "%${articulo}%" AND (stockd01 - reserd01) > 0
                                    ORDER BY articulo.descrip`;

    const articulos = await get_from_urbano(query_buscar_articulo);

    if (articulos.length !== 0) {
      logger.info(
        `buscar_articulo - ${articulo} - Usuario: ${codigo_tecnico} - Host: ${host}`
      );
      res.status(200).send({
        titulo: "Buscar orden",
        articulos: articulos,
      });
    } else {
      res.status(200).send({
        titulo: "Buscar orden",
        articulos: false,
      });
    }
  } catch (error) {
    logger.error(
      `buscar_articulo - Usuario: ${req.body.codigo_tecnico_log} - Host: ${req.body.host} - Error: ${error.message}`
    );
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
  }
};

exports.ingresar_articulos = async (req, res) => {
  try {
    const {
      host,
      codigo_tecnico_log: codigo_tecnico,
      ingresoArticulos,
    } = req.body;

    logger.info(
      `ingresar_articulos - ${ingresoArticulos} - Usuario: ${codigo_tecnico} - Host: ${host}`
    );

    ingresoArticulos.articulos.forEach(async (articulo) => {
      try {
        const query_reserva_articulo = `UPDATE artstk01 SET reserd01 = reserd01 +1 WHERE codigo = ${articulo.codigo}`;
        const query_ingresar_articulo_orden = `INSERT INTO trrenglo
        (serie, ingreso, cliente, operador, tecnico, codart, descart, nrocompro, pendiente)
        SELECT "${articulo.serie}", NOW(), ${ingresoArticulos.codigo}, 
        "${ingresoArticulos.usuario}", 
        "${ingresoArticulos.tecnico}", 
        ${articulo.codigo}, "${articulo.descripcion}", "${ingresoArticulos.orden}", 1
        FROM articulo
        WHERE codigo = ${articulo.codigo}`;

        const resultIngresar = await get_from_urbano(
          query_ingresar_articulo_orden
        );
        const resultReserva = await get_from_urbano(query_reserva_articulo);
      } catch (error) {
        res.status(400).send({
          titulo: "ingresar articulos",
          transaccion: false,
        });
      }
    });

    res.status(200).send({
      titulo: "Buscar serie",
      transaccion: true,
    });
  } catch (error) {
    logger.error(
      `ingresar_articulos - Usuario: ${req.body.codigo_tecnico_log} - Host: ${req.body.host} - Error: ${error.message}`
    );
  }
};

exports.quitar_articulos = async (req, res) => {
  try {
    const {
      host,
      codigo_tecnico_log: codigo_tecnico,
      quitarArticulos,
    } = req.body;

    logger.info(
      `quitar_articulos - ${quitarArticulos} - Usuario: ${codigo_tecnico} - Host: ${host}`
    );

    quitarArticulos.articulos.forEach(async (articulo) => {
      try {
        const query_quitar_reserva_articulo = `UPDATE artstk01 SET reserd01 = reserd01 -1 WHERE codigo = ${articulo.codigo}`;
        const query_quitar_articulo_orden = `UPDATE trrenglo SET 
            serie="", ingreso="", cliente="", operador="", tecnico="", codart="", descart="", nrocompro="", pendiente=""
            WHERE  cliente = ${quitarArticulos.codigo} AND 
            codart= ${articulo.codigo} AND 
            nrocompro = "${quitarArticulos.orden}" AND 
            serie = "${articulo.serie}" 
            LIMIT 1`;

        const resultIngresar = await get_from_urbano(
          query_quitar_articulo_orden
        );
        const resultReserva = await get_from_urbano(
          query_quitar_reserva_articulo
        );
      } catch (error) {
        res.status(400).send({
          titulo: "Buscar serie",
          transaccion: false,
        });
      }
    });

    res.status(200).send({
      titulo: "Buscar serie",
      transaccion: true,
    });
  } catch (error) {
    logger.error(
      `quitar_articulos - Usuario: ${req.body.codigo_tecnico_log} - Host: ${req.body.host} - Error: ${error.message}`
    );
  }
};

//salida orden
exports.salida_orden = async (req, res) => {
  try {
    const { host, codigo_tecnico_log: codigo_tecnico, orden } = req.body;
    const query_salida_orden = `UPDATE trabajos SET ubicacion = 22 WHERE nrocompro = "ORX0011000${orden}"`;
    const query_articulos_en_orden = `SELECT * FROM trrenglo INNER JOIN articulo ON trrenglo.codart= articulo.codigo
    WHERE trrenglo.nrocompro = "ORX0011000${orden}"`;

    //sacar reserva articulos
    const articulos = await get_from_urbano(query_articulos_en_orden);
    console.log("reserva");
    articulos.forEach(async (articulo) => {
      try {
        const query_sacar_reserva_articulo = `UPDATE artstk01 SET reserd01 = reserd01 -1 WHERE codigo = ${articulo.codart}`;
        const result = await get_from_urbano(query_sacar_reserva_articulo);
        console.log("reservassssss");
      } catch (error) {
        res.status(200).send({
          titulo: "Salida Orden",
          transaccion: false,
        });
      }
    });

    //Salida Orden
    console.log("salida");
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
      res.status(200).send({
        titulo: "Salida Orden",
        transaccion: false,
      });
    }
  } catch (error) {
    logger.error(
      `salida_orden - Usuario: ${req.body.codigo_tecnico_log} - Host: ${req.body.host} - Error: ${error.message}`
    );
  }
};
