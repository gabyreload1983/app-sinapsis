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
          console.log("ok");
          $(".spinner-border").addClass("d-none");
          buscarArticulos.addClass("d-none");
          btnConfirmar.addClass("disabled");
          btnReset.addClass("disabled");
          btnImprimir.removeClass("d-none");
          const now = moment().format("DD-MM-YYYY / hh:mm:ss");
          $(".date").removeClass("d-none").append(`FECHA: ${now}`);
        } else {
          console.log(`No se guardaron articulos!`);
          $(".spinner-border").addClass("d-none");
        }
      },
    });
  });

  btnReset.on("click", function () {
    const tables = $("tbody");
    tables.empty();
    $("#inputBuscarArticulo").val("");
    $("#inputBuscarOrden").val("");
    $(".date").empty().addClass("d-none");
    btnConfirmar.addClass("disabled");
    btnImprimir.addClass("d-none");
    buscarArticulos.addClass("d-none");
  });

  btnImprimir.on("click", function () {
    $(".tbodyBuscarArticulo").empty();
    btnConfirmar.addClass("disabled");
    btnReset.removeClass("disabled");
    btnImprimir.addClass("d-none");
    window.print();
  });
});

function articulo_seleccionado(codigo, descripcion, trabaserie) {
  const tbodyAgregarArticulos = $(".tbodyAgregarArticulos");
  const btnConfirmar = $("#btnConfirmar");

  if (trabaserie === "S") {
    btnConfirmar.addClass("disabled");
    let serie = prompt("Ingrese numero de serie");
    if (serie) {
      $.ajax({
        url: "/urbano/taller/buscar-serie",
        type: "get",
        dataType: "json",
        data: { serie, codigo },
        success: function (data) {
          console.log(data);
          if (data.serieOk) {
            btnConfirmar.removeClass("disabled");

            tbodyAgregarArticulos.append(`
              <tr>
                <td>${codigo}</td>
                <td>${descripcion}</td>
                <td>${serie}</td>
              </tr>
            `);

            /*  formAgregarArticulos.append(`
            <div class="mb-3">
              <input class="bg-light rounded p-1" type="text" name="codigo" value=${codigo} readonly>
              <input class="bg-light rounded p-1" type="text" name="descripcion" value=${descripcion} readonly>
              <input class="bg-light rounded p-1" type="text" name="serie" value=${serie} readonly>
            </div>
          `); */
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
    /*   formAgregarArticulos.append(`
    <div class="mb-3">
      <input class="bg-light rounded p-1" type="text" name="codigo" value=${codigo} readonly>
      <input class="bg-light rounded p-1" type="text" name="descripcion" value=${descripcion} readonly>
      <input class="bg-light rounded p-1" type="text" name="serie" value="" readonly>
    </div>
    `); */
  }
}
