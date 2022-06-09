const mongoose = require("mongoose");

const Articulo = new mongoose.Schema({
  codigo: {
    type: String,
    required: true,
  },
  descripcion: {
    type: String,
    required: true,
  },
  serie: {
    type: String,
  },
});

const ingresoEgresoArticulosSchema = new mongoose.Schema({
  sentido: {
    type: String,
    required: true,
  },
  usuario: {
    type: String,
    required: true,
  },
  codigo: {
    type: String,
    required: true,
  },
  cliente: {
    type: String,
    required: true,
  },
  orden: {
    type: String,
    required: true,
  },
  tecnico: {
    type: String,
    required: true,
  },
  articulos: [Articulo],
  date: { type: Date, default: Date.now },
});

const IngresoEgresoArticulos = mongoose.model(
  "ingreso_egreso_articulos",
  ingresoEgresoArticulosSchema
);

module.exports = IngresoEgresoArticulos;
