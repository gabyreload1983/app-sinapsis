$(function () {
  const Toast = Swal.mixin({
    toast: true,
    position: "top-end",
    showConfirmButton: false,
    timer: 2000,
    timerProgressBar: true,
    didOpen: (toast) => {
      toast.addEventListener("mouseenter", Swal.stopTimer);
      toast.addEventListener("mouseleave", Swal.resumeTimer);
    },
  });

  const btn_tomar = $(".btn_tomar");

  btn_tomar.on("click", function (e) {
    e.preventDefault();

    const orden_reparacion = $(this).attr("id").slice(0, 5);

    Swal.fire({
      title: `Esta seguro que quiere tomar la orden: ${orden_reparacion}???`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Confirmar!",
      cancelButtonText: "Cancelar",
    }).then((result) => {
      if (result.isConfirmed) {
        Swal.fire({
          title: `Tomando orden ${orden_reparacion}`,
          allowOutsideClick: false,
          didOpen: () => {
            Swal.showLoading();
            $.ajax({
              url: "/urbano/taller/tomar-orden",
              type: "post",
              dataType: "json",
              data: { orden_reparacion },
              success: function (data) {
                if (data.transaccion) {
                  Toast.fire({
                    icon: "success",
                    title: `Se tomo orden ${orden_reparacion} con exito!`,
                  }).then(() => location.reload());
                } else {
                  Toast.fire({
                    icon: "danger",
                    title: `Error al tomar orden ${orden_reparacion}`,
                  }).then(() => location.reload());
                }
              },
            });
          },
        });
      }
    });
  });
});
