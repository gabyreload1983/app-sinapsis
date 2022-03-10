$(function () {
  const btn_tomar = $(".btn_tomar");

  btn_tomar.on("click", function (e) {
    e.preventDefault();

    const orden_reparacion = this.id;

    const response = confirm(
      `Esta seguro que quiere tomar la orden: ${orden_reparacion}???`
    );
    if (response) {
      $.ajax({
        url: "/urbano/taller/tomar-orden",
        type: "post",
        dataType: "json",
        data: { orden_reparacion },
        success: function (data) {
          if (data.transaccion) {
            alert(`Orden ${orden_reparacion} tomada`);
            location.reload();
            console.log(`Orden ${orden_reparacion} tomada`);
          } else {
            console.log("Error al tomar orden...");
          }
        },
      });
    }
  });
});
