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

          data.articulos.forEach((articulo) => {
            tbodyArticulosOrden.append(`
            <tr>
              <td>${articulo.codart}</td>
              <td>${articulo.descart}</td>
              <td>${articulo.serie}</td>
            </tr>
            `);
          });
        } else {
          buscarArticulos.addClass("d-none");
          alert(`Orden ${orden_reparacion} no existe...`);
        }
      },
    });
  });

  $("#inputBuscarOrden").on("keypress", function (e) {
    if (e.keyCode === 13) btnBuscarOrden.click();
  });

  const btnBuscarArticulo = $("#btnBuscarArticulo");

  btnBuscarArticulo.on("click", function () {
    const inputBuscarArticulo = $("#inputBuscarArticulo").val();
    $("#inputBuscarOrden").prop("disabled", true);
    $("#btnBuscarOrden").addClass("disabled");

    tbodyBuscarArticulo.empty();
    $.ajax({
      url: "/urbano/taller/buscar-articulo",
      type: "get",
      dataType: "json",
      data: { articulo: inputBuscarArticulo },
      success: function (data) {
        if (data.articulos) {
          data.articulos.forEach((articulo) => {
            tbodyBuscarArticulo.append(`
            <tr style="cursor:pointer" onclick="articulo_seleccionado('${articulo.codigo}','${articulo.descripcion}', '${articulo.trabaserie}')">
              <td>${articulo.codigo}</td>
              <td>${articulo.descripcion}</td>
              <td>${articulo.stock}</td>
            </tr>
            `);
          });
        } else {
          alert(`No se encontro ningun articulo.`);
        }
      },
    });
  });

  $("#inputBuscarArticulo").on("keypress", function (e) {
    if (e.keyCode === 13) btnBuscarArticulo.click();
  });

  btnConfirmar.on("click", function () {
    btnConfirmar.addClass("disabled");
    tbodyBuscarArticulo.empty();
    const tbodyOrdenHeader = $(".tbodyOrdenHeader");
    const tbodyAgregarArticulos = $(".tbodyAgregarArticulos")[0].children;

    const ingresoArticulos = {};
    ingresoArticulos.orden = tbodyOrdenHeader[0].children[0].cells[0].innerText;
    ingresoArticulos.codigo =
      tbodyOrdenHeader[0].children[0].cells[1].innerText;
    ingresoArticulos.cliente =
      tbodyOrdenHeader[0].children[0].cells[2].innerText;
    ingresoArticulos.tecnico =
      tbodyOrdenHeader[0].children[0].cells[3].innerText;
    ingresoArticulos.usuario =
      tbodyOrdenHeader[0].children[0].cells[4].innerText;

    ingresoArticulos.articulos = [];

    [...tbodyAgregarArticulos].forEach((articulo) => {
      ingresoArticulos.articulos.push({
        codigo: articulo.cells[0].innerText,
        descripcion: articulo.cells[1].innerText,
        serie: articulo.cells[2].innerText,
      });
    });

    $(".spinner-border").removeClass("d-none");

    $.ajax({
      url: "/urbano/taller/ingresar-articulos",
      type: "post",
      dataType: "json",
      data: { ingresoArticulos },
      success: function (data) {
        if (data.transaccion) {
          $(".btn-group").append(`
          <a class="btn btn-secondary btn-pdf" href="/urbano/taller/buscar-ingreso-egreso-articulos/${data.id}">PDF</a>
          `);
          $(".spinner-border").addClass("d-none");
          buscarArticulos.addClass("d-none");
          // btnConfirmar.addClass("disabled");
          // btnReset.addClass("disabled");

          const now = moment().format("DD-MM-YYYY / hh:mm:ss");
          $(".date").removeClass("d-none").append(`FECHA: ${now}`);
        } else {
          alert(`No se guardaron articulos! Reportar error al administrador.`);
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
    $("#inputBuscarArticulo").val("");
    $("#inputBuscarOrden").val("");
    $(".date").empty().addClass("d-none");
    btnConfirmar.addClass("disabled");
    buscarArticulos.addClass("d-none");
    $(".btn-pdf").addClass("d-none");
  });
});

function articulo_seleccionado(codigo, descripcion, trabaserie) {
  const tbodyAgregarArticulos = $(".tbodyAgregarArticulos");
  const btnConfirmar = $("#btnConfirmar");

  if (trabaserie === "S") {
    btnConfirmar.addClass("disabled");
    let serie = prompt("Ingrese numero de serie").replaceAll("'", "-");
    if (serie) {
      $.ajax({
        url: "/urbano/taller/buscar-serie",
        type: "get",
        dataType: "json",
        data: { serie, codigo },
        success: function (data) {
          if (data.serieOk) {
            btnConfirmar.removeClass("disabled");

            tbodyAgregarArticulos.append(`
              <tr>
                <td>${codigo}</td>
                <td>${descripcion}</td>
                <td>${serie}</td>
              </tr>
            `);
          } else {
            alert("Serie pertenece a otro producto!");
          }
        },
      });
    }
  } else {
    btnConfirmar.removeClass("disabled");
    tbodyAgregarArticulos.append(`
      <tr>
        <td>${codigo}</td>
        <td>${descripcion}</td>
        <td></td>
      </tr>
    `);
  }
}
