$(function () {
  const btnBuscarOrden = $("#btnBuscarOrden");
  const btnConfirmar = $("#btnConfirmar");
  const btnReset = $("#btnReset");
  const btnImprimir = $("#btnImprimir");
  const tbodyBuscarArticulo = $(".tbodyBuscarArticulo");
  const buscarArticulos = $("#buscarArticulos");

  btnBuscarOrden.on("click", function (e) {
    const orden_reparacion = $("#inputBuscarOrden").val();
    const tbodyArticulosOrden = $(".tbodyArticulosOrden");
    const tbodyOrdenHeader = $(".tbodyOrdenHeader");
    tbodyArticulosOrden.empty();
    tbodyOrdenHeader.empty();
    $(".tbodyAgregarArticulos").empty();
    $(".date").empty().addClass("d-none");

    $.ajax({
      url: "/urbano/taller/buscar-orden-reparacion",
      type: "get",
      dataType: "json",
      data: { orden_reparacion },
      success: function (data) {
        if (data.orden) {
          buscarArticulos.removeClass("d-none");
          tbodyOrdenHeader.append(`
              <tr>
                <td>${data.orden[0].nrocompro}</td>
                <td>${data.orden[0].codigo}</td>
                <td>${data.orden[0].nombre}</td>
                <td>${data.orden[0].tecnico}</td>
                <td class="text-uppercase">${data.codigo_tecnico}</td>
              </tr>
            `);

          data.articulos.forEach((articulo, index) => {
            tbodyArticulosOrden.append(`
              <tr id="tr-${index}">
                <td>${articulo.codart}</td>
                <td>${articulo.descart}</td>
                <td>${articulo.serie}</td>
                <td>
                <button 
                    onClick="quitarArticulo(${articulo.codart}, '${articulo.descart}', '${articulo.serie}',${index})" 
                    class="btn btn-sm btn-danger btn-quitar"
                >x</button></td>
              </tr>
              `);
          });
        } else {
          buscarArticulos.addClass("d-none");
          alert(data.errorMessage);
        }
      },
    });
  });

  $("#inputBuscarOrden").on("keypress", function (e) {
    if (e.keyCode === 13) btnBuscarOrden.click();
  });

  btnConfirmar.on("click", function () {
    $(".btn-quitar").addClass("disabled");
    $(".spinner-border").removeClass("d-none");
    const tbodyOrdenHeader = $(".tbodyOrdenHeader");
    const tbodyQuitarArticulos = $(".tbodyQuitarArticulos")[0].children;

    const quitarArticulos = {};
    quitarArticulos.orden = tbodyOrdenHeader[0].children[0].cells[0].innerText;
    quitarArticulos.codigo = tbodyOrdenHeader[0].children[0].cells[1].innerText;
    quitarArticulos.cliente =
      tbodyOrdenHeader[0].children[0].cells[2].innerText;
    quitarArticulos.tecnico =
      tbodyOrdenHeader[0].children[0].cells[3].innerText;
    quitarArticulos.usuario =
      tbodyOrdenHeader[0].children[0].cells[4].innerText;

    quitarArticulos.articulos = [];

    [...tbodyQuitarArticulos].forEach((articulo) => {
      quitarArticulos.articulos.push({
        codigo: articulo.cells[0].innerText,
        descripcion: articulo.cells[1].innerText,
        serie: articulo.cells[2].innerText,
      });
    });

    $.ajax({
      url: "/urbano/taller/quitar-articulos",
      type: "post",
      dataType: "json",
      data: { quitarArticulos },
      success: function (data) {
        if (data.transaccion) {
          $(".btn-group").append(`
          <a class="btn btn-secondary btn-pdf" href="/urbano/taller/buscar-ingreso-egreso-articulos/${data.id}">PDF</a>
          `);
          $(".spinner-border").addClass("d-none");
          buscarArticulos.addClass("d-none");
          btnConfirmar.addClass("disabled");

          const now = moment().format("DD-MM-YYYY / hh:mm:ss");
          $(".date").removeClass("d-none").append(`FECHA: ${now}`);
        } else {
          alert(`No se quitaron articulos! Reportar error al administrador.`);
          $(".spinner-border").addClass("d-none");
        }
      },
    });
  });

  btnReset.on("click", function () {
    $("#inputBuscarOrden").prop("disabled", false).val("");
    $("#btnBuscarOrden").removeClass("disabled");
    const tables = $("tbody");
    tables.empty();
    $(".spinner-border").addClass("d-none");
    $(".date").empty().addClass("d-none");
    btnConfirmar.addClass("disabled");
    buscarArticulos.addClass("d-none");
    $(".btn-pdf").addClass("d-none");
  });
});

function quitarArticulo(codigo, descripcion, serie, index) {
  $("#inputBuscarOrden").prop("disabled", true);
  $("#btnBuscarOrden").addClass("disabled");
  const tbodyQuitarArticulos = $(".tbodyQuitarArticulos");
  tbodyQuitarArticulos.append(`
                <tr>
                  <td>${codigo}</td>
                  <td>${descripcion}</td>
                  <td>${serie}</td>
                </tr>
              `);

  const tr = `#tr-${index}`;
  $(tr).empty();
  $("#btnConfirmar").removeClass("disabled");
}
