const connection = require("../conexion/dbUrbano");
const connectionTickets = require("../conexion/dbTickets");
const constantes = require("../constantes/constantes");
const moment = require("moment");
const logger = require("../logger/logger");

//Home Page
exports.index = (req, res) => {
  res.render("home");
};

//Funciones

//Querys MYSQL URBANO
function getFromUrbano(querySelect) {
  return new Promise((resolve, reject) => {
    connection.query(querySelect, (error, result) => {
      if (error) {
        reject(new Error(error));
      } else {
        resolve(result);
      }
    });
  });
}

//Querys MYSQL Tickets
function getFromTickets(querySelect) {
  return new Promise((resolve, reject) => {
    connectionTickets.query(querySelect, (error, result) => {
      if (error) {
        reject(new Error(error));
      } else {
        resolve(result);
      }
    });
  });
}

//Formatear ordenes
function getOrdenesFormateadas(arrayOrdenes) {
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

function getReparacionesPorDia() {
  const query = `SELECT opcional FROM trabajos WHERE nrocompro = "ORX001100012023"`;
  return new Promise((resolve, reject) => {
    connection.query(query, (error, reparacionesPorDia) => {
      if (error) {
        reject(new Error(error));
      } else {
        resolve(reparacionesPorDia);
      }
    });
  });
}

function agregarCodigoTecnico(arrayTickets) {
  arrayTickets.forEach((ticket) => {
    let codigo = constantes.tecnicos.find(
      (tecnico) => tecnico.nombre === ticket.nombre
    );
    ticket.codigo = codigo.codigo;
  });
  return arrayTickets;
}

//Obtener Orden de reparacion y sus articulos con precios
exports.ordenDeReparacion = async (req, res) => {
  try {
    const codigo_tecnico = req.body.codigo_tecnico;
    const host = req.body.host;
    logger.info(
      `ordenDeReparacion - Usuario: ${codigo_tecnico} - Host: ${host}`
    );

    const numberOrder = req.query.orden;
    const queryOrden = `SELECT * FROM trabajos WHERE nrocompro LIKE "ORX0011000${numberOrder}"`;
    const queryCotizacionDolar = `SELECT * FROM cotiza  WHERE codigo =  "BD"`;
    const queryArticulosEnOrden = `SELECT * FROM trrenglo INNER JOIN articulo ON trrenglo.codart= articulo.codigo
                                     WHERE trrenglo.nrocompro LIKE  "ORX0011000${numberOrder}"`;
    //Buscar Orden de trabajo
    let orden = await getFromUrbano(queryOrden);
    if (!orden[0]) {
      res.render("ordenDeReparacion", {
        titulo: "Orden De Reparacion",
        orden: [],
        articulos: [],
      });
    } else {
      //Formatear Ordenes
      orden = await getOrdenesFormateadas(orden);

      //Buscar articulos en orden
      const articulos = await getFromUrbano(queryArticulosEnOrden);
      if (articulos[0]) {
        //Obtener Cotizacion Dolar
        const cotizacionDolar = await getFromUrbano(queryCotizacionDolar);

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
        res.render("ordenDeReparacion", {
          titulo: "Orden De Reparacion",
          orden: orden[0],
          articulos,
        });
      } else {
        //Orden sin articulos
        res.render("ordenDeReparacion", {
          titulo: "Orden De Reparacion",
          orden: orden[0],
          articulos: [],
        });
      }
    }
  } catch (error) {
    logger.error(
      `ordenDeReparacion - Usuario: ${codigo_tecnico} - Error: ${error.message} - Host: ${host}`
    );
  }
};

//Ordenes Pendientes del taller segun sector
exports.ordenesPendientes = async (req, res) => {
  try {
    const sector = req.params.sector;
    const codigo_tecnico = req.body.codigo_tecnico;
    const host = req.body.host;
    logger.info(
      `ordenesPendientes - Sector: ${sector} - Usuario: ${codigo_tecnico} - Host: ${host}`
    );

    const queryOrdenesPendientes = `SELECT * FROM trabajos 
                    WHERE  codiart = ".${sector}" AND estado = 21 AND codigo != "ANULADO"
                    ORDER BY prioridad DESC`;
    let ordenesPendientes = await getFromUrbano(queryOrdenesPendientes);
    ordenesPendientes = await getOrdenesFormateadas(ordenesPendientes);

    //Reparaciones por dia
    let reparacionesPorDia = await getReparacionesPorDia();
    reparacionesPorDia = Number(reparacionesPorDia[0].opcional);

    //Demora en dias del sector
    const demora = Math.trunc(ordenesPendientes.length / reparacionesPorDia);

    res.render("ordenesModal", {
      ordenes: ordenesPendientes,
      titulo: sector,
      reparacionesPorDia,
      demora,
      fila: 0,
    });
  } catch (error) {
    logger.error(
      `ordenesPendientes - Usuario: ${codigo_tecnico} - Error: ${error.message} - Host: ${host}`
    );
  }
};

//Ordenes en proceso
exports.ordenesEnProceso = async (req, res) => {
  try {
    const codigo_tecnico = req.body.codigo_tecnico;
    const host = req.body.host;
    logger.info(
      `ordenesEnProceso - Usuario: ${codigo_tecnico} - Host: ${host}`
    );

    const queryOrdenesEnProceso = `SELECT * FROM trabajos WHERE estado = 22 ORDER BY tecnico`;
    let ordenesEnProceso = await getFromUrbano(queryOrdenesEnProceso);
    ordenesEnProceso = await getOrdenesFormateadas(ordenesEnProceso);

    //Reparaciones por dia
    let reparacionesPorDia = await getReparacionesPorDia();
    reparacionesPorDia = Number(reparacionesPorDia[0].opcional);

    //Demora en dias del sector
    const demora = Math.trunc(ordenesEnProceso.length / reparacionesPorDia);

    res.render("ordenesModal", {
      ordenes: ordenesEnProceso,
      titulo: "En Proceso",
      reparacionesPorDia,
      demora,
      fila: 0,
    });
  } catch (error) {
    logger.error(
      `ordenesEnProceso - Usuario: ${codigo_tecnico} - Error: ${error.message} - Host: ${host}`
    );
  }
};

//Estadisticas reparacion

class Estadisticas {
  constructor(
    codigo,
    nombre,
    ordenesTerminadas = 0,
    ordenesSinReparacion = 0,
    ordenesPcArmadas = 0,
    ticketsCerrados = 0,
    total = 0
  ) {
    this.codigo = codigo;
    this.nombre = nombre;
    this.ordenesTerminadas = ordenesTerminadas;
    this.ordenesSinReparacion = ordenesSinReparacion;
    this.ordenesPcArmadas = ordenesPcArmadas;
    this.ticketsCerrados = ticketsCerrados;
    this.total = total;
  }
}

exports.estadisticasTecnicos = async (req, res) => {
  try {
    const codigo_tecnico = req.body.codigo_tecnico;
    const host = req.body.host;
    logger.info(
      `estadisticasTecnicos - Usuario: ${codigo_tecnico} - Host: ${host}`
    );

    if (req.query.desde && req.query.hasta) {
      let desde, hasta;
      let now = new Date();
      now = moment(now).format("YYYY-MM-DD");
      desde = req.query.desde + " 00:00:00";
      hasta = req.query.hasta + " 23:59:59";

      const queryOrdenesTerminadas = `SELECT tecnico as codigo, count(*) as ordenesTerminadas
                                      FROM trabajos WHERE 
                                      diagnosticado BETWEEN  "${desde}" AND "${hasta}" AND 
                                      codigo != "ANULADO" AND 
                                      estado= 23 
                                      GROUP BY tecnico`;
      const queryTicketsCerrados = `SELECT UPPER(username) AS nombre, count(*) as ticketsCerrados
                                      FROM ost_osticket.ost_ticket
                                      JOIN ost_staff
                                      USING (staff_id)
                                      WHERE closed BETWEEN "${desde}" AND "${hasta}" AND (status_id = 3 OR status_id= 2)               
                                      GROUP BY staff_id;`;
      const queryOrdenesSinReparacion = `SELECT tecnico as codigo, count(*) as ordenesSinReparacion
                                      FROM trabajos WHERE 
                                      diagnosticado BETWEEN  "${desde}" AND "${hasta}" AND 
                                      codigo != "ANULADO" AND 
                                      estado= 23 AND 
                                      diag=23
                                      GROUP BY tecnico`;
      const queryPcArmadas = `SELECT tecnico as codigo, count(*) as ordenesPcArmadas
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

      function agregarEstadisticas(arrayEstadisticas, addKey) {
        arrayEstadisticas.forEach((estadisticaTecnico) => {
          estadisticas.forEach((estadistica) => {
            if (estadistica.codigo === estadisticaTecnico.codigo)
              estadistica[addKey] = estadisticaTecnico[addKey];
          });
        });
      }

      //Ordenes Reparadas
      const ordenesTerminadas = await getFromUrbano(queryOrdenesTerminadas);
      agregarEstadisticas(ordenesTerminadas, "ordenesTerminadas");

      //Tickets Cerrados
      let ticketsCerrados = await getFromTickets(queryTicketsCerrados);
      ticketsCerrados = agregarCodigoTecnico(ticketsCerrados);
      agregarEstadisticas(ticketsCerrados, "ticketsCerrados");

      //Calcular total reparaciones
      estadisticas.forEach((tecnico) => {
        tecnico.total = tecnico.ordenesTerminadas + tecnico.ticketsCerrados;
      });

      //Filtrar tecnicos sin reparaciones
      estadisticas = estadisticas.filter((tecnico) => tecnico.total > 0);

      //Ordenar estadisticas
      estadisticas.sort((a, b) => {
        return b.total - a.total;
      });

      //Ordenes sin Reparacion
      const ordenesSinReparacion = await getFromUrbano(
        queryOrdenesSinReparacion
      );
      agregarEstadisticas(ordenesSinReparacion, "ordenesSinReparacion");

      //Ordenes PC Armadas
      const ordenesPcArmadas = await getFromUrbano(queryPcArmadas);
      agregarEstadisticas(ordenesPcArmadas, "ordenesPcArmadas");

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
      `estadisticasTecnicos - Usuario: ${codigo_tecnico} - Error: ${error.message} - Host: ${host}`
    );
  }
};

//Ingresar Articulo en Orden
const form = {
  mensaje: "",
  error: "",
  ordenReparacion: "",
  codigoArticulo: "",
  numeroSerie: "",
  orden: "",
  articulo: "",
  tecnicos: constantes.tecnicos,
};

exports.ingresarArticuloOrdenGet = async (req, res) => {
  try {
    const codigo_tecnico = req.body.codigo_tecnico;
    const host = req.body.host;
    logger.info(
      `ingresarArticuloOrdenGet - Usuario: ${codigo_tecnico} - Host: ${host}`
    );

    form.mensaje = "GET";
    form.error = "";
    form.ordenReparacion = "";
    form.codigoArticulo = "";
    form.numeroSerie = "";
    form.orden = "";
    form.articulo = "";
    res.render("ingresarArticuloOrden", {
      usuario: { nombre: codigo_tecnico },
      titulo: "Ingresar Articulo",
      form: form,
    });
  } catch (error) {
    logger.error(
      `ingresarArticuloOrdenGet - Usuario: ${codigo_tecnico} - Error: ${error.message} - Host: ${host}`
    );
  }
};

exports.ingresarArticuloOrdenBuscar = async (req, res) => {
  try {
    const host = req.body.host;
    const codigo_tecnico = req.body.codigo_tecnico;
    const tecnico = req.body.tecnico;
    const orden_reparacion = req.body.ordenReparacion;
    const codigo_articulo = req.body.codigoArticulo;
    const numero_serie = req.body.numeroSerie;

    logger.info(
      `ingresarArticuloOrdenBuscar - Usuario: ${codigo_tecnico} - Host: ${host} 
      Tecnico: ${tecnico}
      Orden: ${orden_reparacion}
      Codigo Articulo: ${codigo_articulo}
      Numero de Serie: ${numero_serie}`
    );

    //Querys
    queryBuscarOrden = `SELECT * FROM trabajos WHERE nrocompro LIKE "ORX0011%${orden_reparacion}"`;
    queryBuscarArticulo = `SELECT * FROM articulo WHERE codigo = ${codigo_articulo}`;
    queryBuscarSerie = `SELECT * FROM serie2 WHERE serie = "${numero_serie}"`;

    form.mensaje = "";
    form.error = "";
    form.ordenReparacion = orden_reparacion;
    form.codigoArticulo = codigo_articulo;
    form.numeroSerie = numero_serie;

    let orden = await getFromUrbano(queryBuscarOrden);
    if (orden.length === 0) {
      form.error = "No existe numero de orden!!!";
      form.mensaje = "";
      form.orden = "";
      form.articulo = "";

      res.status(200).send({
        usuario: { nombre: codigo_tecnico },
        titulo: "Ingresar Articulo",
        form: form,
      });
    } else {
      let articulo = await getFromUrbano(queryBuscarArticulo);
      if (articulo.length === 0) {
        form.error = "No existe codigo de articulo!!!";
        form.mensaje = "";
        form.orden = "";
        form.articulo = "";

        res.status(200).send({
          usuario: { nombre: codigo_tecnico },
          titulo: "Ingresar Articulo",
          form: form,
        });
      } else {
        if (articulo[0].trabaserie === "N") {
          form.mensaje = "Se ingreso articulo. Articulo no necesita serie.";
          form.error = "";
          form.ordenReparacion = "";
          form.codigoArticulo = "";
          form.numeroSerie = "";
          form.orden = orden[0];
          form.articulo = articulo[0];

          res.status(200).send({
            usuario: { nombre: codigo_tecnico },
            titulo: "Ingresar Articulo",
            form: form,
          });
        } else {
          if (form.numeroSerie === "") {
            form.error = "Debe ingresar numero de serie";
            form.mensaje = "";
            form.orden = "";
            form.articulo = "";

            res.status(200).send({
              usuario: { nombre: codigo_tecnico },
              titulo: "Ingresar Articulo",
              form: form,
            });
          } else {
            let articuloSerie = await getFromUrbano(queryBuscarSerie);
            if (articuloSerie.length === 0) {
              form.mensaje = "Se ingreso articulo!!! No se encontro serie";
              form.error = "";
              form.ordenReparacion = "";
              form.codigoArticulo = "";
              form.numeroSerie = "";
              form.orden = orden[0];
              form.articulo = articulo[0];

              res.status(200).send({
                usuario: { nombre: codigo_tecnico },
                titulo: "Ingresar Articulo",
                form: form,
              });
            } else {
              if (articuloSerie[0].codigo === form.codigoArticulo) {
                form.mensaje =
                  "Se ingreso articulo, Serie coincide con articulo";
                form.error = "";
                form.ordenReparacion = "";
                form.codigoArticulo = "";
                form.numeroSerie = "";
                form.orden = orden[0];
                form.articulo = articulo[0];

                res.status(200).send({
                  usuario: { nombre: codigo_tecnico },
                  titulo: "Ingresar Articulo",
                  form: form,
                });
              } else {
                form.error = "Serie pertenece a otro articulo!!!";
                form.mensaje = "";
                form.orden = "";
                form.articulo = "";

                res.status(200).send({
                  usuario: { nombre: codigo_tecnico },
                  titulo: "Ingresar Articulo",
                  form: form,
                });
              }
            }
          }
        }
      }
    }
  } catch (error) {
    logger.error(
      `ingresarArticuloOrdenPost - Usuario: ${req.body.codigo_tecnico} - Error: ${error.message} - Host: ${req.body.host}`
    );
  }
};

exports.ingresarArticuloOrdenConfirmar = async (req, res) => {
  try {
    const host = req.body.host;
    const codigo_tecnico = req.body.codigo_tecnico;
    const tecnico = req.body.tecnico;
    const orden_reparacion = req.body.ordenReparacion;
    const codigo_articulo = req.body.codigoArticulo;
    const numero_serie = req.body.numeroSerie;
    queryBuscarOrden = `SELECT * FROM trabajos WHERE nrocompro LIKE "ORX0011%${orden_reparacion}"`;
    let orden = await getFromUrbano(queryBuscarOrden);
    const codigo_cliente = orden[0].cliente;

    logger.info(
      `ingresarArticuloOrdenConfirmar - Usuario: ${codigo_tecnico} - Host: ${host} 
      Tecnico: ${tecnico}
      Orden: ${orden_reparacion}
      Codigo Articulo: ${codigo_articulo}
      Numero de Serie: ${numero_serie}`
    );

    queryReservaArticulo = `UPDATE artstk01 SET reserd01 = reserd01 +1 WHERE codigo = ${codigo_articulo}`;
    queryIngresarArticuloOrden = `
        INSERT INTO trrenglo
        (serie, ingreso, cliente, operador, tecnico, codart, descart, nrocompro, pendiente)
        SELECT "${numero_serie}", NOW(), ${codigo_cliente}, "${codigo_tecnico}", "${tecnico}", ${codigo_articulo}, descrip, "ORX0011000${orden_reparacion}", 1 
        FROM articulo
        WHERE codigo = ${codigo_articulo}`;

    setTimeout(() => {
      res.status(200).send({
        usuario: { nombre: codigo_tecnico },
        titulo: "Ingresar Articulo",
        confirmacion: "Articulo Ingresado",
      });
    }, 2000);
  } catch (error) {
    logger.error(
      `ingresarArticuloOrdenConfirmar - Usuario: ${req.body.codigo_tecnico} - Error: ${error.message} - Host: ${req.body.host}`
    );
  }
};
