$(function () {
  const btn_salida = $(".btn_salida");

  btn_salida.on("click", function (e) {
    e.preventDefault();

    const orden = this.id;

    const response = confirm(
      `Esta seguro que quiere dar salida a la orden: ${orden}???`
    );
    if (response) {
      $.ajax({
        url: "/urbano/taller/salida-orden",
        type: "post",
        dataType: "json",
        data: { orden },
        success: function (data) {
          if (data.transaccion) {
            alert(`Se dio salida a la orden ${orden}`);
            location.reload();
          } else {
            alert("Error al dar salida...");
          }
        },
      });
    }
  });
});
