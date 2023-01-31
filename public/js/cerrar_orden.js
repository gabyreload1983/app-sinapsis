$(function () {
  // cerrar
  $(".btn-cerrar").on("click", function (e) {
    const orden = $(this).attr("id").slice(0, 5);
    const diagnostico = $(this).attr("diagnostico");
    let sendMailFlag = "";

    const Toast = Swal.mixin({
      toast: true,
      position: "top-end",
      showConfirmButton: false,
      timer: 3000,
      timerProgressBar: true,
      didOpen: (toast) => {
        toast.addEventListener("mouseenter", Swal.stopTimer);
        toast.addEventListener("mouseleave", Swal.resumeTimer);
      },
    });

    Swal.fire({
      title: `Cerrar Orden ${orden}???`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Confirmar!",
      cancelButtonText: "Cancelar",
    }).then((result) => {
      if (result.isConfirmed) {
        Swal.fire({
          allowOutsideClick: false,
          title: `Enviar mail de notificacion???`,
          icon: "warning",
          showCancelButton: true,
          confirmButtonColor: "#3085d6",
          cancelButtonColor: "#d33",
          confirmButtonText: "Cerrar orden y Enviar!",
          cancelButtonText: "Solo cerrar.",
          cancelButtonColor: "#519030",
        }).then((result) => {
          let title = `Cerrando orden ${orden}`;
          if (result.isConfirmed) {
            sendMailFlag = true;
            title = `Cerrando orden ${orden} y enviadndo email...`;
          }
          Swal.fire({
            title,
            allowOutsideClick: false,
            didOpen: () => {
              Swal.showLoading();
              $.ajax({
                url: "/urbano/taller/cerrar-orden",
                type: "post",
                dataType: "json",
                data: { orden, diagnostico, sendMailFlag },
                success: function (data) {
                  if (data.transaccion) {
                    Toast.fire({
                      icon: "success",
                      title: `Se cerro orden ${data.orden} con exito!`,
                    }).then(() => location.reload());
                  } else {
                    Toast.fire({
                      icon: "danger",
                      title: `Error al cerrar orden ${data.orden}`,
                    }).then(() => location.reload());
                  }
                },
              });
            },
          });
        });
      }
    });
  });
});
