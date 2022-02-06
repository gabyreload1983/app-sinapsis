$(function () {
  const btn_buscar = $("#btn_buscar");
  const btn_confirmar = $("#btn_confirmar");
  const btn_modificar = $("#btn_modificar");
  const btn_cancelar = $("#btn_cancelar");
  const btn_imprimir = $("#btn_imprimir");
  const btn_nueva_busqueda = $("#btn_nueva_busqueda");
  const form_articulo_orden = $("#form_articulo_orden");
  const tecnico = $("#tecnico");
  const orden_reparacion = $("#ordenReparacion");
  const codigo_articulo = $("#codigoArticulo");
  const numero_serie = $("#numeroSerie");
  const descripcion_orden = $(".descripcion_orden");
  const descripcion_articulo = $(".descripcion_articulo");
  const error = $(".error");
  const info = $(".info");
  const success = $(".success");
  const print_date = $("#print_date");

  btn_buscar.on("click", function (e) {
    console.log("buscar");
    success.addClass("d-none");
    descripcion_orden.empty();
    descripcion_articulo.empty();
    e.preventDefault();

    form_articulo_orden.validate({
      rules: {
        vendedor: "required",
        tecnico: "required",
        ordenReparacion: "required",
        codigoArticulo: "required",
      },
      messages: {
        vendedor: "Seleccione un vendedor!",
        tecnico: "Seleccione un tecnico!",
        ordenReparacion: "Ingrese orden de reparacion!",
        codigoArticulo: "Ingrese codigo de articulo!",
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
            error.empty();
            error.addClass("d-none");
            descripcion_orden.append(data.form.orden.nombre);
            descripcion_articulo.append(data.form.articulo.descrip);
            //Dehabilitar form
            btn_buscar.addClass("disabled");
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
    console.log("confirmar");

    tecnico.removeAttr("disabled");
    btn_buscar.addClass("d-none");
    btn_confirmar.addClass("d-none");
    btn_modificar.addClass("d-none");
    btn_cancelar.addClass("d-none");
    info.removeClass("d-none");
    $.ajax({
      url: "/urbano/taller/ingresar-articulo-orden-confirmar",
      type: "post",
      dataType: "json",
      data: form_articulo_orden.serialize(),
      success: function (data) {
        // ... do something with the data...

        if (data.confirmacion) {
          info.addClass("d-none");
          success.removeClass("d-none");
          btn_nueva_busqueda.removeClass("d-none");
          btn_imprimir.removeClass("d-none");
          print_date.append(` - Fecha: ${new Date().toLocaleDateString()}`);
          //Habilitar form
          /*  btn_buscar.removeClass("disabled");
          tecnico.removeAttr("disabled", false);
          orden_reparacion.attr("readonly", false);
          codigo_articulo.attr("readonly", false);
          numero_serie.attr("readonly", false);
          form_articulo_orden[0].reset();
          descripcion_orden.empty();
          descripcion_articulo.empty(); */
        }
      },
    });
  });

  btn_modificar.on("click", function () {
    console.log("modificar");

    btn_confirmar.addClass("d-none");
    btn_modificar.addClass("d-none");
    btn_cancelar.addClass("d-none");
    //Habilitar form
    btn_buscar.removeClass("disabled");
    tecnico.removeAttr("disabled", false);
    orden_reparacion.attr("readonly", false);
    codigo_articulo.attr("readonly", false);
    numero_serie.attr("readonly", false);
  });

  btn_cancelar.on("click", function () {
    console.log("cancelar");
    //Habilitar form
    btn_buscar.removeClass("disabled");
    tecnico.removeAttr("disabled", false);
    orden_reparacion.attr("readonly", false);
    codigo_articulo.attr("readonly", false);
    numero_serie.attr("readonly", false);
    form_articulo_orden[0].reset();

    btn_confirmar.addClass("d-none");
    btn_modificar.addClass("d-none");
    btn_cancelar.addClass("d-none");
    descripcion_orden.empty();
    descripcion_articulo.empty();
  });

  btn_nueva_busqueda.on("click", function () {
    console.log("nueva busqueda");
    //Habilitar form
    success.addClass("d-none");
    tecnico.removeAttr("disabled", false);
    orden_reparacion.attr("readonly", false);
    codigo_articulo.attr("readonly", false);
    numero_serie.attr("readonly", false);
    form_articulo_orden[0].reset();

    btn_buscar.removeClass("disabled");
    btn_buscar.removeClass("d-none");
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
    console.log("imprimir");
    window.print();
  });
});
