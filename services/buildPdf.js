PDFDocument = require("pdfkit");
const moment = require("moment");

function buildPdf(dataCallback, endCallback, data) {
  const year = moment().format("YYYY");
  const doc = new PDFDocument({ size: "A4" });
  doc.on("data", dataCallback);
  doc.on("end", endCallback);
  doc.image("./public/images/sinapsis.jpg", 20, 30, { width: 300 });

  doc.fontSize(20).text(`${data.sentido}`, 250, 30);
  doc
    .fontSize(10)
    .text(`FECHA: ${moment(data.date).format("DD-MM-YYYY HH:mm")}`, 390, 50);
  doc.fontSize(12).text(`USUARIO: ${data.usuario}`, 390, 70);
  doc.fontSize(14).text(`${data.orden}`, 50, 130);
  doc.fontSize(14).text(`${data.cliente}`, 50, 150);
  doc.fontSize(14).text(`TECNICO: ${data.tecnico}`, 50, 170);
  doc.moveTo(40, 200).lineTo(550, 200).stroke();
  doc.fontSize(14).text("ARTICULOS", 50, 230);
  let position = 240;
  for (let articulo of data.articulos) {
    doc
      .fontSize(10)
      .text(
        `${articulo.codigo} - ${articulo.descripcion} - ${articulo.serie}`,
        70,
        (position += 20)
      );
  }
  doc.fontSize(12).text(`${year} - GabySystem `, 220, 730);
  doc.fontSize(12).text(`(Developed) => Gabriel Godoy  `, 190, 750);
  doc.end();
}

module.exports = { buildPdf };
