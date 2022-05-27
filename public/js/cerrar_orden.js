$(function () {
  // cerrar
  $(".btn-cerrar").on("click", function (e) {
    const orden = this.id.slice(0, 5);
    const cerrarOrden = confirm(`Cerrar orden: ${orden}???`);
    if (cerrarOrden) {
      $.ajax({
        url: "/urbano/taller/cerrar-orden",
        type: "post",
        dataType: "json",
        data: { orden, diagnostico: 22 }, //22- reparado
        success: function (data) {
          if (data.transaccion) {
            alert(`Se cerro orden ${data.orden}`);
            location.reload();
          } else {
            alert("No se cerro orden.");
          }
        },
      });
    }
  });
  // sin reparacion
  $(".btn-sin-reparacion").on("click", function (e) {
    const orden = this.id.slice(0, 5);
    const cerrarOrden = confirm(`Cerrar orden: ${orden} SIN REPARACION???`);
    if (cerrarOrden) {
      $.ajax({
        url: "/urbano/taller/cerrar-orden",
        type: "post",
        dataType: "json",
        data: { orden, diagnostico: 23 }, //23= sin reparacion
        success: function (data) {
          if (data.transaccion) {
            alert(`Se cerro orden ${data.orden}`);
            location.reload();
          } else {
            alert("No se cerro orden.");
          }
        },
      });
    }
  });
});
