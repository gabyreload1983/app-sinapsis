"use strict";
const nodemailer = require("nodemailer");
const moment = require("moment");
const PDFDocument = require("pdfkit");
const fs = require("fs");
const absolutePath = require("../utils");

const transporter = nodemailer.createTransport({
  host: process.env.MAIL_HOST,
  port: 465,
  secure: true,
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASSWORD,
  },
});

exports.sendMail = async (mail, body, subject) => {
  return await transporter.sendMail({
    from: process.env.MAIL_FROM,
    to: mail,
    bcc: `${process.env.MAIL_BCC}`,
    subject: subject,
    html: body,
  });
};

const sendMailPdf = async (mail, body, subject, filePath = "") => {
  return await transporter.sendMail({
    from: process.env.MAIL_FROM,
    to: mail,
    bcc: `${process.env.MAIL_BCC}`,
    subject: subject,
    html: body,
    attachments: {
      path: filePath,
    },
  });
};

//enviar pdf a tecnico
exports.sendPdf = async (data, email) => {
  const year = moment().format("YYYY");
  const date = moment().format("YYYYMMDD-HHmmss");
  const orden = data.orden.slice(10);
  const pdfPath = `${absolutePath}/pdfTransactions/${orden}-${date}.pdf`;

  const doc = new PDFDocument({ size: "A4" });

  doc.image(`${absolutePath}/public/images/sinapsis.jpg`, 20, 30, {
    width: 300,
  });

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

  doc.pipe(fs.createWriteStream(pdfPath));
  doc.end();

  const body = `Cliente: ${data.cliente} - Orden ${data.orden}`;
  const subject = `${data.sentido} - ORDEN ${orden}`;

  return await sendMailPdf(email, body, subject, pdfPath);
};

exports.getBodyCloseWorkOrder = (nrocompro) => {
  return `
    <p>Nos comunicamos de Sinapsis SRL para informarte que tu orden reparación nro ${nrocompro} esta lista para retirar.</p>
    <p>Para mas información, registrate en nuestra pagina y podras acceder al detalle de cada reparacion.</p>
    <a href="https://sinapsis.com.ar/#linkTo-login" target="_blank">Registrate o inicia sesion acá</a>
    <br/>
    <br/>
    <a href="https://www.youtube.com/watch?v=y0W0LmN3RYs" target="_blank">Tutorial para registrarte en nuestra pagina.</a>
    <br/>
    <br/>
    <p>Tambien podes consultanos por whatsapp</p>
    <a href="https://wa.me/3476309819?text=Hola Sinaspis, te consulto por la mi orden de reparacion ${nrocompro}" target="_blank">Hace click aca para abrir whatsapp</a>
    <br/>
    <br/>
    <br/>
    <table
    id="zs-output-sig"
    border="0"
    cellpadding="0"
    cellspacing="0"
    style="
      font-family: Arial, Helvetica, sans-serif;
      line-height: 0px;
      font-size: 1px;
      padding: 0px !important;
      border-spacing: 0px;
      margin: 0px;
      border-collapse: collapse;
      width: 500px;
    "
  >
    <tbody>
      <tr>
        <td style="padding: 0px !important">
          <table
            id="inner-table"
            border="0"
            cellpadding="0"
            cellspacing="0"
            style="
              font-family: Arial, Helvetica, sans-serif;
              line-height: 0px;
              font-size: 1px;
              padding: 0px !important;
              border-spacing: 0px;
              margin: 0px;
              border-collapse: collapse;
            "
          >
            <tbody>
              <tr>
                <td width="253" style="padding-right: 18px">
                  <table
                    border="0"
                    cellpadding="0"
                    cellspacing="0"
                    style="
                      font-family: Arial, Helvetica, sans-serif;
                      line-height: 0px;
                      font-size: 1px;
                      padding: 0px !important;
                      border-spacing: 0px;
                      margin: 0px auto;
                      border-collapse: collapse;
                    "
                  >
                    <tbody>
                      <tr>
                        <td
                          style="
                            border-collapse: collapse;
                            line-height: 0px;
                            padding-bottom: 20px;
                            padding-right: 1px;
                          "
                        >
                          <p style="margin: 0.04px">
                            <img
                              height="auto"
                              width="200"
                              alt="image"
                              border="0"
                              src="https://img2.gimm.io/3cdc658d-d569-4485-a486-dec07fad03f1/-/resize/506x132/img.png"
                            />
                          </p>
                        </td>
                      </tr>
                    </tbody>
                  </table>

                  <table
                    border="0"
                    cellpadding="0"
                    cellspacing="0"
                    style="
                      font-family: Arial, Helvetica, sans-serif;
                      line-height: 0px;
                      font-size: 1px;
                      padding: 0px !important;
                      border-spacing: 0px;
                      margin: 0px auto;
                      border-collapse: collapse;
                    "
                  >
                    <tbody>
                      <tr>
                        <td style="padding-right: 10px">
                          <p style="margin: 0.04px">
                            <a
                              style="font-size: 0px; line-height: 0px"
                              target="_blank"
                              rel="nofollow"
                              href="https://www.facebook.com/facesinapsis"
                              ><img
                                height="24"
                                width="24"
                                alt="facebook"
                                border="0"
                                src="https://cdn-icons-png.flaticon.com/512/733/733547.png"
                            /></a>
                          </p>
                        </td>
                        <td style="padding-right: 10px">
                          <p style="margin: 0.04px">
                            <a
                              style="font-size: 0px; line-height: 0px"
                              target="_blank"
                              rel="nofollow"
                              href="https://www.instagram.com/sinapsis_sl/"
                              ><img
                                height="24"
                                width="24"
                                alt="instagram"
                                border="0"
                                src="https://cdn-icons-png.flaticon.com/512/2111/2111463.png"
                            /></a>
                          </p>
                        </td>
                        <td style="padding-right: 10px">
                          <p style="margin: 0.04px">
                            <a
                              style="font-size: 0px; line-height: 0px"
                              target="_blank"
                              rel="nofollow"
                              href="https://goo.gl/maps/4JfV9WJgf4WjaAoP6"
                              ><img
                                height="24"
                                width="24"
                                alt="maps"
                                border="0"
                                src="https://cdn-icons-png.flaticon.com/512/1865/1865269.png"
                            /></a>
                          </p>
                        </td>
                        <td style="padding: 0px !important">
                          <p style="margin: 0.04px">
                            <a
                              style="font-size: 0px; line-height: 0px"
                              target="_blank"
                              rel="nofollow"
                              href="https://wa.me/3476309819/"
                              ><img
                                height="24"
                                width="24"
                                alt="whatsapp"
                                border="0"
                                src="https://cdn-icons-png.flaticon.com/512/5968/5968841.png"
                            /></a>
                          </p>
                        </td>
                        <td style="padding: 0px !important"></td>
                      </tr>
                      <tr>
                        <td
                          style="
                            border-collapse: collapse;
                            padding-bottom: 8px;
                          "
                        ></td>
                      </tr>
                    </tbody>
                  </table>
                </td>
                <td style="padding: 0px !important">
                  <table
                    border="0"
                    cellpadding="0"
                    cellspacing="0"
                    style="
                      font-family: Arial, Helvetica, sans-serif;
                      line-height: 0px;
                      font-size: 1px;
                      padding: 0px !important;
                      border-spacing: 0px;
                      margin: 0px;
                      border-collapse: collapse;
                    "
                  >
                    <tbody>
                      <tr>
                        <td
                          style="
                            border-collapse: collapse;
                            font-family: Tahoma, Geneva, sans-serif;
                            font-size: 14px;
                            font-style: normal;
                            line-height: 16px;
                            font-weight: 700;
                            padding-bottom: 6px;
                          "
                        >
                          <p style="margin: 0.04px">
                            <span
                              style="
                                font-family: Tahoma, Geneva, sans-serif;
                                font-size: 14px;
                                font-style: normal;
                                line-height: 16px;
                                font-weight: 700;
                                color: #0482b7;
                                display: inline;
                              "
                              >Soporte Técnico&nbsp;</span
                            >
                          </p>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                  <table
                    border="0"
                    cellpadding="0"
                    cellspacing="0"
                    style="
                      font-family: Arial, Helvetica, sans-serif;
                      line-height: 0px;
                      font-size: 1px;
                      padding: 0px !important;
                      border-spacing: 0px;
                      margin: 0px;
                      border-collapse: collapse;
                    "
                  >
                    <tbody>
                      <tr>
                        <td
                          style="
                            border-collapse: collapse;
                            font-family: Tahoma, Geneva, sans-serif;
                            font-size: 14px;
                            font-style: normal;
                            line-height: 16px;
                            font-weight: 400;
                            padding-bottom: 6px;
                          "
                        >
                          <p style="margin: 0.04px">
                            <span
                              style="
                                font-family: Tahoma, Geneva, sans-serif;
                                font-size: 14px;
                                font-style: normal;
                                line-height: 16px;
                                font-weight: 400;
                                color: #8b8b8b;
                                display: inline;
                              "
                            >
                              <a
                                href="https://sinapsis.com.ar/"
                                target="_blank"
                                style="text-decoration: none"
                              >
                                sinapsis.com.ar
                              </a>
                            </span>
                          </p>
                        </td>
                      </tr>
                      <tr>
                        <td
                          style="
                            border-collapse: collapse;
                            font-family: Tahoma, Geneva, sans-serif;
                            font-size: 14px;
                            font-style: normal;
                            line-height: 16px;
                            font-weight: 400;
                            padding-bottom: 6px;
                          "
                        >
                          <p style="margin: 0.04px">
                            <span
                              style="
                                font-family: Tahoma, Geneva, sans-serif;
                                font-size: 14px;
                                font-style: normal;
                                line-height: 16px;
                                font-weight: 400;
                                color: #8b8b8b;
                                display: inline;
                              "
                              >3476 431222</span
                            >
                          </p>
                        </td>
                      </tr>
                      <tr>
                        <td
                          style="
                            border-collapse: collapse;
                            font-family: Tahoma, Geneva, sans-serif;
                            font-size: 14px;
                            font-style: normal;
                            line-height: 16px;
                            font-weight: 400;
                            padding-bottom: 6px;
                          "
                        >
                          <p style="margin: 0.04px">
                            <span
                              style="
                                font-family: Tahoma, Geneva, sans-serif;
                                font-size: 14px;
                                font-style: normal;
                                line-height: 16px;
                                font-weight: 400;
                                color: #8b8b8b;
                                display: inline;
                              "
                              >CBU: 0340379000379001926007
                            </span>
                          </p>
                        </td>
                      </tr>
                      <tr>
                        <td
                          style="
                            border-collapse: collapse;
                            font-family: Tahoma, Geneva, sans-serif;
                            font-size: 14px;
                            font-style: normal;
                            line-height: 16px;
                            font-weight: 400;
                            padding-bottom: 6px;
                          "
                        >
                          <p style="margin: 0.04px">
                            <span
                              style="
                                font-family: Tahoma, Geneva, sans-serif;
                                font-size: 14px;
                                font-style: normal;
                                line-height: 16px;
                                font-weight: 400;
                                color: #8b8b8b;
                                display: inline;
                              "
                              >Alias: sinapsissrl
                            </span>
                          </p>
                        </td>
                      </tr>
                      <tr>
                        <td
                          style="
                            border-collapse: collapse;
                            font-family: Tahoma, Geneva, sans-serif;
                            font-size: 14px;
                            font-style: normal;
                            line-height: 16px;
                            font-weight: 400;
                            padding-bottom: 6px;
                          "
                        >
                          <p style="margin: 0.04px">
                            <span
                              style="
                                font-family: Tahoma, Geneva, sans-serif;
                                font-size: 14px;
                                font-style: normal;
                                line-height: 16px;
                                font-weight: 400;
                                color: #8b8b8b;
                                display: inline;
                              "
                              >CUIT: 30711382891
                            </span>
                          </p>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </td>
              </tr>
            </tbody>
          </table>
        </td>
      </tr>
    </tbody>
  </table>`;
};
