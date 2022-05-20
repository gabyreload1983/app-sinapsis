$(function () {
  const btn_guardar_diagnostico = $(".btn_guardar_diagnostico");
  const form_diagnostico = $(".form_diagnostico");

  form_diagnostico.on("submit", function (e) {
    e.preventDefault();
    const orden = this.id;
    const diagnostico = $("#diagnostico" + orden).val();

    if (diagnostico) {
      $.ajax({
        url: "/urbano/taller/guardar-diagnostico-orden",
        type: "post",
        dataType: "json",
        data: { orden, diagnostico },
        success: function (data) {
          if (data) {
            confirm(`Diagnostico guardado!`);
          } else {
            alert("No se guardo diagnostico.");
          }
        },
      });
    }
  });
});
