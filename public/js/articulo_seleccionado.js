function articulo_seleccionado(codigo, descripcion) {
  const codigo_articulo = $("#codigo_articulo");
  const descripcion_articulo = $(".descripcion_articulo");
  codigo_articulo.val(codigo);
  descripcion_articulo.empty(9);
  descripcion_articulo.append(descripcion);
}
