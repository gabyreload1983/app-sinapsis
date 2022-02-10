$(function () {
  const orden_reparacion = $("#orden_reparacion");
  const busqueda_articulo_descrip = $("#busqueda_articulo_descrip");
  const codigo_articulo = $("#codigo_articulo");
  const numero_serie = $("#numero_serie");
  const descripcion_orden = $(".descripcion_orden");
  const descripcion_serie = $(".descripcion_serie");
  const descripcion_articulo = $(".descripcion_articulo");
  const table_articulos = $("#table_articulos");
  const tbody_articulos = $("#tbody_articulos");

  //Buscar Orden de reparacion
  orden_reparacion.on("keyup", function (e) {
    if (e.key === "Enter" || e.keyCode === 13) {
      $.ajax({
        url: "/urbano/taller/buscar-orden",
        type: "post",
        dataType: "json",
        data: orden_reparacion.serialize(),
        success: function (data) {
          descripcion_orden.empty();
          if (data.orden.nombre !== "") {
            descripcion_orden.append(`Cliente: ${data.orden.nombre}`);
          } else {
            descripcion_orden.append(
              `<p class="text-danger fw-bold">No existe orden de reparacion!!!</p>`
            );
          }
        },
      });
    }
  });

  busqueda_articulo_descrip.on("keyup", function (e) {
    if (e.key === "Enter" || e.keyCode === 13) {
      $.ajax({
        url: "/urbano/taller/buscar-articulo",
        type: "post",
        dataType: "json",
        data: busqueda_articulo_descrip.serialize(),
        success: function (data) {
          tbody_articulos.empty();
          if (data.articulos) {
            table_articulos.removeClass("d-none");
            data.articulos.forEach((articulo) => {
              tbody_articulos.append(
                `<tr style="cursor:pointer" onclick="articulo_seleccionado(${articulo.codigo},'${articulo.descripcion}')">
                      <td>${articulo.codigo}</td>
                      <td>${articulo.descripcion}</td>
                      <td>${articulo.stock}</td>
                  </tr>`
              );
            });
          }
        },
      });
    }
  });

  numero_serie.on("keyup", function (e) {
    if (e.key === "Enter" || e.keyCode === 13) {
      $.ajax({
        url: "/urbano/taller/buscar-articulo-serie",
        type: "post",
        dataType: "json",
        data: numero_serie.serialize(),
        success: function (data) {
          tbody_articulos.empty();
          table_articulos.addClass("d-none");
          descripcion_articulo.empty();
          descripcion_serie.empty();
          busqueda_articulo_descrip.val("");
          if (data.articulo.codigo !== "") {
            //actualizar codigo articulo
            $("#codigo_articulo-error").addClass("d-none");
            codigo_articulo.val(data.articulo.codigo);
            descripcion_articulo.append(data.articulo.descrip);
          } else {
            descripcion_serie.append("No se encontro numero de serie!!!");
          }
        },
      });
    }
  });
});
