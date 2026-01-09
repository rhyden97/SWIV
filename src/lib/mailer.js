import nodemailer from "nodemailer";

const sanitize = (val) => {
  if (!val) return "";
  let clean = val.trim();
  if (
    (clean.startsWith('"') && clean.endsWith('"')) ||
    (clean.startsWith("'") && clean.endsWith("'"))
  ) {
    clean = clean.slice(1, -1);
  }
  return clean.trim();
};

const escapeHtml = (value) =>
  String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

const safeUrl = (value) => {
  try {
    const url = new URL(String(value));
    if (url.protocol === "http:" || url.protocol === "https:") {
      return escapeHtml(url.href);
    }
  } catch {}
  return "#";
};

const getTransporter = () => {
  const host = sanitize(process.env.SMTP_HOST);
  const port = Number(sanitize(process.env.SMTP_PORT)) || 587;
  const user = sanitize(process.env.SMTP_USER);
  const pass = sanitize(process.env.SMTP_PASSWORD || process.env.SMTP_PASS);

  return nodemailer.createTransport({
    host,
    port,
    auth: { user, pass },
  });
};

const getFromEmail = () => {
  return (
    sanitize(process.env.SMTP_FROM) ||
    sanitize(process.env.SMTP_USER) ||
    "no-reply@localhost"
  );
};

const wrapTemplate = (title, content, accentColor = "#4F46E5") => `
  <!DOCTYPE html>
  <html lang="es">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${escapeHtml(title)}</title>
    <style>
      body { margin: 0; padding: 0; background-color: #F3F4F6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #1F2937; }
      .container { max-width: 580px; margin: 30px auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.08); }
      .header { background-color: ${accentColor}; padding: 24px; text-align: center; }
      .header h1 { color: #ffffff; margin: 0; font-size: 20px; font-weight: 700; }
      .content { padding: 32px; font-size: 15px; line-height: 1.6; color: #4B5563; }
      .footer { background-color: #F9FAFB; padding: 16px 32px; text-align: center; font-size: 12px; color: #6B7280; border-top: 1px solid #E5E7EB; }
      .btn { display: inline-block; background-color: ${accentColor}; color: #ffffff !important; text-decoration: none; padding: 10px 24px; border-radius: 6px; font-weight: 600; font-size: 14px; margin-top: 16px; }
      .card { background-color: #F9FAFB; border: 1px solid #E5E7EB; border-radius: 6px; padding: 16px; margin: 20px 0; }
      .code { font-family: monospace; background-color: #E5E7EB; padding: 3px 6px; border-radius: 4px; color: #111827; font-weight: bold; }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header"><h1>SWGVI ERP</h1></div>
      <div class="content">${content}</div>
      <div class="footer"><p>&copy; ${new Date().getFullYear()} SWGVI. Correo automático de notificación.</p></div>
    </div>
  </body>
  </html>
`;

const renderCard = (rows) => `
  <div class="card">
    <div style="display: table; width: 100%;">
      ${rows
        .map(
          ([label, value, isCode]) => `
        <div style="display: table-row;">
          <div style="display: table-cell; padding: 6px 0; font-weight: 600; color: #4B5563; font-size: 13px;">${escapeHtml(label)}:</div>
          <div style="display: table-cell; padding: 6px 0; text-align: right; color: #111827; font-size: 14px;">
            ${isCode ? `<span class="code">${escapeHtml(value)}</span>` : escapeHtml(value)}
          </div>
        </div>`,
        )
        .join("")}
    </div>
  </div>`;

export async function sendWelcomeEmail(to, nombre, email, passwordTemp) {
  const transporter = getTransporter();
  const from = getFromEmail();
  const loginUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

  const card = renderCard([
    ["Usuario / Email", email, false],
    ["Contraseña Temporal", passwordTemp, true],
  ]);

  const html = wrapTemplate(
    "Bienvenido al equipo - Credenciales de Acceso",
    `
      <h2 style="color: #111827; margin-top: 0;">¡Hola, ${escapeHtml(nombre)}!</h2>
      <p>Te damos la bienvenida a <strong>SWGVI</strong>. Se ha creado tu cuenta operativa en el sistema ERP con las siguientes credenciales:</p>
      ${card}
      <p style="font-size: 13px; color: #6B7280;">* Te recomendamos ingresar y cambiar tu contraseña inmediatamente desde tu perfil.</p>
      <div style="text-align: center; margin-top: 24px;">
        <a href="${safeUrl(loginUrl)}/login" class="btn">Ingresar al Sistema</a>
      </div>
    `,
    "#4F46E5",
  );

  return transporter.sendMail({
    from: `"SWGVI ERP" <${from}>`,
    to,
    subject: "Bienvenido al equipo - Credenciales de Acceso",
    html,
  });
}

export async function sendSaleReceiptEmail(
  to,
  nombreCliente,
  receiptUrl,
  total,
  idVenta,
) {
  const transporter = getTransporter();
  const from = getFromEmail();

  const card = renderCard([
    ["Código de Venta", `#${idVenta}`, false],
    ["Fecha", new Date().toLocaleDateString("es-BO"), false],
    ["Total Pagado", `Bs. ${Number(total).toFixed(2)}`, false],
  ]);

  const html = wrapTemplate(
    "Comprobante de compra - SWGVI",
    `
      <h2 style="color: #111827; margin-top: 0;">¡Gracias por tu compra, ${escapeHtml(nombreCliente)}!</h2>
      <p>Tu compra ha sido procesada de manera exitosa. Adjuntamos los detalles de tu pedido:</p>
      ${card}
      <div style="text-align: center; margin-top: 24px;">
        <a href="${safeUrl(receiptUrl)}" class="btn" style="background-color: #10B981;">Ver Recibo PDF</a>
      </div>
    `,
    "#10B981",
  );

  return transporter.sendMail({
    from: `"SWGVI" <${from}>`,
    to,
    subject: `Comprobante de compra de SWGVI (Venta #${idVenta})`,
    html,
  });
}

export async function sendPurchaseOrderEmail(
  to,
  nombreProveedor,
  purchaseOrderUrl,
  idOrden,
) {
  const transporter = getTransporter();
  const from = getFromEmail();

  const card = renderCard([
    ["Orden de Compra", `#${idOrden}`, false],
    ["Fecha de Emisión", new Date().toLocaleDateString("es-BO"), false],
  ]);

  const html = wrapTemplate(
    "Nueva Orden de Compra - SWGVI",
    `
      <h2 style="color: #111827; margin-top: 0;">Estimado/a ${escapeHtml(nombreProveedor)},</h2>
      <p>Le hacemos llegar una nueva orden de compra emitida desde nuestro departamento de adquisiciones:</p>
      ${card}
      <div style="text-align: center; margin-top: 24px;">
        <a href="${safeUrl(purchaseOrderUrl)}" class="btn" style="background-color: #3B82F6;">Descargar Orden de Compra PDF</a>
      </div>
      <p style="font-size: 13px; color: #6B7280; margin-top: 20px;">Por favor confirme la recepción de este pedido y el tiempo estimado de entrega.</p>
    `,
    "#3B82F6",
  );

  return transporter.sendMail({
    from: `"Adquisiciones SWGVI" <${from}>`,
    to,
    subject: `Nueva Orden de Compra (OC #${idOrden}) - SWGVI`,
    html,
  });
}

export async function sendPasswordResetEmail(to, nombre, passwordTemp) {
  const transporter = getTransporter();
  const from = getFromEmail();
  const loginUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

  const card = renderCard([
    ["Usuario / Email", to, false],
    ["Nueva Contraseña", passwordTemp, true],
  ]);

  const html = wrapTemplate(
    "Restablecimiento de Contraseña - SWGVI",
    `
      <h2 style="color: #111827; margin-top: 0;">¡Hola, ${escapeHtml(nombre)}!</h2>
      <p>Se ha generado una nueva contraseña temporal para tu cuenta en <strong>SWGVI</strong>:</p>
      ${card}
      <p style="font-size: 13px; color: #6B7280;">* Te recomendamos ingresar y cambiar tu contraseña inmediatamente desde tu perfil.</p>
      <div style="text-align: center; margin-top: 24px;">
        <a href="${safeUrl(loginUrl)}/login" class="btn" style="background-color: #EF4444;">Ingresar al Dashboard</a>
      </div>
    `,
    "#EF4444",
  );

  return transporter.sendMail({
    from: `"SWGVI ERP" <${from}>`,
    to,
    subject: "Restablecimiento de Contraseña - SWGVI",
    html,
  });
}
