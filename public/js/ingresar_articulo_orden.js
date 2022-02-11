$(function () {
  const btn_consultar = $("#btn_consultar");
  const btn_confirmar = $("#btn_confirmar");
  const btn_modificar = $("#btn_modificar");
  const btn_cancelar = $("#btn_cancelar");
  const btn_imprimir = $("#btn_imprimir");
  const btn_nueva_busqueda = $("#btn_nueva_busqueda");
  const form_articulo_orden = $("#form_articulo_orden");
  const tecnico = $("#tecnico");
  const orden_reparacion = $("#orden_reparacion");
  const codigo_articulo = $("#codigo_articulo");
  const numero_serie = $("#numero_serie");
  const descripcion_orden = $(".descripcion_orden");
  const descripcion_articulo = $(".descripcion_articulo");
  const error = $(".error");
  const info = $(".info");
  const success = $(".success");
  const print_date = $("#print_date");
  const tbody_articulos = $("#tbody_articulos");
  const table_articulos = $("#table_articulos");
  const busqueda_articulo_descrip = $("#busqueda_articulo_descrip");

  btn_consultar.on("click", function (e) {
    success.addClass("d-none");
    descripcion_orden.empty();
    descripcion_articulo.empty();
    e.preventDefault();

    form_articulo_orden.validate({
      rules: {
        vendedor: "required",
        tecnico: "required",
        orden_reparacion: "required",
        codigo_articulo: "required",
      },
      messages: {
        vendedor: "Seleccione un vendedor!",
        tecnico: "Seleccione un tecnico!",
        orden_reparacion: "Ingrese orden de reparacion!",
        codigo_articulo: "Ingrese codigo de articulo!",
      },
    });

    if (form_articulo_orden.valid()) {
      $.ajax({
        url: "/urbano/taller/ingresar-articulo-orden-buscar",
        type: "post",
        dataType: "json",
        data: form_articulo_orden.serialize(),
        success: function (data) {
          if (data.form.error) {
            error.empty();
            success.addClass("d-none");
            error.removeClass("d-none");
            error.append(data.form.error);
          }
          if (data.form.mensaje) {
            tbody_articulos.empty();
            table_articulos.addClass("d-none");
            busqueda_articulo_descrip.val("");
            busqueda_articulo_descrip.attr("readonly", true);
            error.empty();
            error.addClass("d-none");
            descripcion_orden.append(`Cliente: ${data.form.orden.nombre}`);
            descripcion_articulo.append(data.form.articulo.descrip);
            //Dehabilitar form
            btn_consultar.addClass("d-none");
            tecnico.attr("disabled", true);
            orden_reparacion.attr("readonly", true);
            codigo_articulo.attr("readonly", true);
            numero_serie.attr("readonly", true);
            //Habilitar opciones
            btn_confirmar.removeClass("d-none");
            btn_modificar.removeClass("d-none");
            btn_cancelar.removeClass("d-none");
            btn_cancelar.focus();
          }
        },
      });
    } else {
      const label_error = $("label.error");
      label_error.addClass("text-danger fw-bold");
    }
  });

  btn_confirmar.on("click", function () {
    btn_consultar.addClass("d-none");
    btn_confirmar.addClass("d-none");
    btn_modificar.addClass("d-none");
    btn_cancelar.addClass("d-none");
    info.removeClass("d-none");
    tecnico.removeAttr("disabled");
    $.ajax({
      url: "/urbano/taller/ingresar-articulo-orden-confirmar",
      type: "post",
      dataType: "json",
      data: form_articulo_orden.serialize(),
      success: function (data) {
        if (!data.error) {
          tecnico.attr("disabled", true);
          info.addClass("d-none");
          success.removeClass("d-none");
          btn_nueva_busqueda.removeClass("d-none");
          btn_imprimir.removeClass("d-none");
          print_date.append(` - Fecha: ${data.date}`);
        } else {
          error.append(
            `Error reserva: ${data.reserva} - Error ingreso: ${data.ingreso}`
          );
        }
      },
    });
  });

  btn_modificar.on("click", function () {
    btn_confirmar.addClass("d-none");
    btn_modificar.addClass("d-none");
    btn_cancelar.addClass("d-none");
    //Habilitar form
    btn_consultar.removeClass("d-none");
    tecnico.removeAttr("disabled", false);
    orden_reparacion.attr("readonly", false);
    codigo_articulo.attr("readonly", false);
    numero_serie.attr("readonly", false);
    //Busqueda
    busqueda_articulo_descrip.attr("readonly", false);
  });

  btn_cancelar.on("click", function () {
    //Habilitar form
    btn_consultar.removeClass("d-none");
    tecnico.removeAttr("disabled", false);
    orden_reparacion.attr("readonly", false);
    codigo_articulo.attr("readonly", false);
    numero_serie.attr("readonly", false);
    busqueda_articulo_descrip.attr("readonly", false);
    form_articulo_orden[0].reset();

    btn_confirmar.addClass("d-none");
    btn_modificar.addClass("d-none");
    btn_cancelar.addClass("d-none");
    descripcion_orden.empty();
    descripcion_articulo.empty();
  });

  btn_nueva_busqueda.on("click", function () {
    //Habilitar form
    success.addClass("d-none");
    tecnico.removeAttr("disabled", false);
    orden_reparacion.attr("readonly", false);
    codigo_articulo.attr("readonly", false);
    numero_serie.attr("readonly", false);
    busqueda_articulo_descrip.attr("readonly", false);
    form_articulo_orden[0].reset();

    btn_consultar.removeClass("d-none");
    btn_nueva_busqueda.addClass("d-none");
    btn_imprimir.addClass("d-none");
    btn_confirmar.addClass("d-none");
    btn_modificar.addClass("d-none");
    btn_cancelar.addClass("d-none");
    descripcion_orden.empty();
    descripcion_articulo.empty();
    print_date.empty();
  });

  btn_imprimir.on("click", function () {
    window.print();
  });
});
