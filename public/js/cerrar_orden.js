$(function () {
  $(".btn_cerrar").on("click", function (e) {
    const orden = this.id;
    const cerrarOrden = confirm(`Cerrar orden: ${orden}???`);
    if (cerrarOrden) {
      $.ajax({
        url: "/urbano/taller/cerrar-orden",
        type: "post",
        dataType: "json",
        data: { orden },
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
