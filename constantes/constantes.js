//Descripcion Prioridades
exports.prioridades = {
  0: "0",
  1: "1",
  2: "2",
  3: "3-ARMADOS PC",
  4: "4-PRIORIDADES-TURNO",
  5: "5-GARANTIA REPARACION",
  6: "6",
  7: "7-GARANTIA COMPRA",
  8: "8",
  9: "9-ABONADOS",
  10: "10",
};

//Unificacion nombres tecnicos
exports.tecnicos = [
  {
    codigo: "SERG",
    nombre: "SERGIO",
  },
  {
    codigo: "TICO",
    nombre: "TIKO",
  },
  {
    codigo: "GUIDO",
    nombre: "GUIDO",
  },
  {
    codigo: "JORGE",
    nombre: "JORGE",
  },
  {
    codigo: "JUANT",
    nombre: "JUANPI",
  },
  {
    codigo: "VICT",
    nombre: "VICTOR",
  },
  {
    codigo: "GABYT",
    nombre: "GABRIEL",
  },
  {
    codigo: "ZORRO",
    nombre: "LEONARDO",
  },
  {
    codigo: "MAUT",
    nombre: "MAURO",
  },
  {
    codigo: "LEO",
    nombre: "LEO",
  },
  {
    codigo: "MATIT",
    nombre: "MATIAS",
  },
];

exports.iva = {
  1: 1.21,
  3: 1.105,
};

exports.descripcion = {
  21: "Pendiente",
  22: "En Proceso",
  23: "Finalizado",
};

exports.ubicacion = {
  21: "Sin entregar",
  22: "Entregado",
};

exports.diag = {
  21: "-",
  22: "Reparado",
  23: "Sin Reparacion",
};

//Background estado orden
exports.bgDescription = {
  21: "bg-danger",
  22: "bg-info",
  23: "bg-success",
  undefined: "bg-warning",
};
