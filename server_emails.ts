import pg from "pg";

export interface EmailLog {
  id: string;
  timestamp: string;
  to: string;
  orderId?: string;
  emailType?: string;
  subject: string;
  body: string;
  status: "success" | "failure" | "simulated" | "disabled";
  error?: string;
}

// Global in-memory log of sent/simulated emails as fallback
export const emailDeliveryLogs: EmailLog[] = [];

// Clean human-readable status labels
export const statusLabels: Record<string, string> = {
  "pedido_iniciado": "Pedido Iniciado",
  "pago_pendiente": "Pago Pendiente",
  "pago_aprobado": "Compra Aprobada / Pago Confirmado ✓",
  "pago_rechazado": "Pago Rechazado",
  "en_preparacion": "En Preparación",
  "listo_para_retirar": "Listo para Retirar",
  "despachado_correo": "Enviado / Despachado 🚚",
  "enviado": "Enviado / Despachado 🚚",
  "pedido_cancelado": "Cancelado ✕",
  "pedido_reembolsado": "Reembolsado ↺"
};

// Decoupled DB pool reference to prevent circular imports
let dbPoolInstance: pg.Pool | null = null;

export function setEmailDbPool(pool: pg.Pool) {
  dbPoolInstance = pool;
  // Initialize table
  initEmailLogsTable();
}

async function initEmailLogsTable() {
  if (!dbPoolInstance) return;
  try {
    await dbPoolInstance.query(`
      CREATE TABLE IF NOT EXISTS public.email_logs (
        id VARCHAR(100) PRIMARY KEY,
        order_id TEXT,
        email_type VARCHAR(50),
        recipient TEXT NOT NULL,
        subject TEXT NOT NULL,
        body TEXT NOT NULL,
        status VARCHAR(50) NOT NULL,
        error TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);
    console.log("[Emails System] Tabla 'email_logs' garantizada en PostgreSQL.");
  } catch (err) {
    console.error("[Emails System] Error creando tabla de logs de correo:", err);
  }
}

/**
 * Check if a certain email type was already successfully sent for an order
 */
export async function isEmailAlreadySent(orderId: string, emailType: string): Promise<boolean> {
  const normId = String(orderId).trim();
  
  // 1. Check in-memory list
  const memoryDuplicate = emailDeliveryLogs.some(
    log => String(log.orderId).trim() === normId &&
           log.emailType === emailType &&
           (log.status === "success" || log.status === "simulated")
  );
  if (memoryDuplicate) return true;

  // 2. Check Database public.email_logs
  if (dbPoolInstance) {
    try {
      const res = await dbPoolInstance.query(
        "SELECT COUNT(*) FROM public.email_logs WHERE order_id = $1 AND email_type = $2 AND status IN ('success', 'simulated');",
        [normId, emailType]
      );
      return parseInt(res.rows[0].count, 10) > 0;
    } catch (err) {
      console.error("[Emails System] Error verificando envío duplicado en DB:", err);
    }
  }

  return false;
}

/**
 * Persist log entry in database and fallback list
 */
export async function logEmailDelivery(log: EmailLog & { emailType: string }) {
  emailDeliveryLogs.unshift(log);
  if (emailDeliveryLogs.length > 100) emailDeliveryLogs.pop();

  if (dbPoolInstance) {
    try {
      await dbPoolInstance.query(
        `INSERT INTO public.email_logs (id, order_id, email_type, recipient, subject, body, status, error, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
         ON CONFLICT (id) DO NOTHING;`,
        [
          log.id,
          log.orderId ? String(log.orderId).trim() : null,
          log.emailType,
          log.to,
          log.subject,
          log.body,
          log.status,
          log.error || null
        ]
      );
    } catch (err) {
      console.error("[Emails System] Error guardando log en base de datos:", err);
    }
  }
}

export async function getEmailLogs(): Promise<EmailLog[]> {
  if (dbPoolInstance) {
    try {
      const res = await dbPoolInstance.query(
        `SELECT id, order_id as "orderId", email_type as "emailType", recipient as "to", 
                subject, body, status, error, created_at as "timestamp" 
         FROM public.email_logs 
         ORDER BY created_at DESC 
         LIMIT 60;`
      );
      return res.rows.map((row: any) => ({
        id: row.id,
        timestamp: row.timestamp ? new Date(row.timestamp).toISOString() : new Date().toISOString(),
        to: row.to,
        orderId: row.orderId || undefined,
        emailType: row.emailType || undefined,
        subject: row.subject,
        body: row.body,
        status: row.status,
        error: row.error || undefined
      }));
    } catch (err) {
      console.error("[Emails System] Error obteniendo logs de DB, cayendo en memoria:", err);
    }
  }
  return emailDeliveryLogs;
}

export async function clearAllEmailLogs(): Promise<void> {
  emailDeliveryLogs.length = 0;
  if (dbPoolInstance) {
    try {
      await dbPoolInstance.query("TRUNCATE TABLE public.email_logs;");
    } catch (err) {
      console.error("[Emails System] Error vaciando tabla email_logs:", err);
    }
  }
}

/**
 * Replace template placeholders like {{customerName}}, {{orderId}}, etc.
 */
function replacePlaceholders(template: string, data: Record<string, string>): string {
  let result = template;
  for (const [key, val] of Object.entries(data)) {
    result = result.replace(new RegExp(`{{\\s*${key}\\s*}}`, "g"), val || "");
  }
  return result;
}

/**
 * Core function to send or simulate sending an email via Resend API.
 */
export async function sendEmail(params: {
  settings: any;
  to: string;
  subject: string;
  html: string;
  text?: string;
}): Promise<{ success: boolean; status: "success" | "failure" | "simulated" | "disabled"; error?: string }> {
  const { settings, to, subject, html, text } = params;

  // Guard: If email sender feature is explicitly disabled
  if (!settings.emailSenderEnabled) {
    return { success: true, status: "disabled" };
  }

  // Force Resend API provider exclusively
  const from = (settings.emailSenderFromAddress || process.env.EMAIL_SENDER_FROM_ADDRESS || "").trim() || "Ventas Juem <onboarding@resend.dev>";
  const apiKey = (settings.resendApiKey || process.env.RESEND_API_KEY || "").trim();

  if (!apiKey) {
    console.log(`[Email Simulator] Destinatario: ${to}. Asunto: "${subject}". Resend no configurado (falta API Key).`);
    return { success: true, status: "simulated" };
  }

  const maskedKey = apiKey.substring(0, 7) + "..." + apiKey.substring(apiKey.length - 4);
  console.log(`[Resend Mailbox] Iniciando despacho. Usando API Key: ${maskedKey} (Largo: ${apiKey.length})`);

  try {
    console.log(`[Resend Mailbox] Enviando correo a través de la API de Resend para: ${to}`);
    
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        from,
        to: [to],
        subject,
        html,
        text: text || "Por favor, use un cliente de correo con soporte HTML para ver este mensaje."
      })
    });

    const responseData = await response.json() as any;
    if (response.ok && responseData && responseData.id) {
      console.log(`[Resend Mailbox] Correo enviado exitosamente a: ${to} (ID: ${responseData.id})`);
      return { success: true, status: "success" };
    } else {
      const errMsg = responseData?.message || JSON.stringify(responseData) || `Status ${response.status}`;
      console.error(`[Resend Mailbox Error] Error al despachar a ${to}: ${errMsg}`);
      return { success: false, status: "failure", error: errMsg };
    }
  } catch (err: any) {
    const errMsg = String(err.message || err);
    console.error(`[Resend Mailbox Error] Excepción al despachar a ${to}: ${errMsg}`);
    return { success: false, status: "failure", error: errMsg };
  }
}

function getHumanReadablePaymentMethod(method: string): string {
  if (!method) return "Transferencia/Efectivo";
  const m = method.toLowerCase();
  if (m.includes("mercadopago") || m.includes("mercado_pago")) return "Mercado Pago Uruguay (Tarjeta de Crédito / Débito)";
  if (m.includes("transfer") || m.includes("transferencia")) return "Transferencia Bancaria Directa (BROU / Itaú / Santander)";
  if (m.includes("cash") || m.includes("efectivo")) return "Efectivo contra Entrega / Retiro";
  if (m.includes("coordinating") || m.includes("coordinar")) return "A Coordinar por WhatsApp";
  return method;
}

/**
 * 1. Generate COMPRA CONFIRMADA Email HTML
 */
export function generateOrderCreatedEmailHtml(order: any, settings: any): { subject: string; html: string } {
  const rawOrderId = order.id || "";
  const orderId = rawOrderId.length > 8 ? rawOrderId.substring(0, 6).toUpperCase() : rawOrderId;
  const customerName = order.customerName || "Cliente";
  const items = order.items || [];
  const subtotal = order.subtotal || 0;
  const discount = order.discountAmount || 0;
  const shippingCost = order.shippingCost || 0;
  const total = order.total || 0;
  const coupon = order.couponCode || "Ninguno";
  const notes = order.notes || "Ninguna";
  const paymentMethod = getHumanReadablePaymentMethod(order.paymentMethod || order.payment_method);
  const siteTitle = settings.siteTitle || "Ventas Juem";

  // Fecha format
  const creationDate = order.createdAt ? new Date(order.createdAt) : new Date();
  const fechaCompraCompilada = creationDate.toLocaleString("es-UY", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });

  const defaultSubject = `¡Gracias por tu compra! Tu pedido #${orderId} ha sido recibido`;
  const customSubjectTemplate = settings.emailTemplateOrderCreatedSubject;
  const subject = customSubjectTemplate 
    ? replacePlaceholders(customSubjectTemplate, { orderId, customerName, total: `$${total}`, siteTitle })
    : defaultSubject;

  const defaultBody = "Muchas gracias por realizar tu compra con nosotros. Tu pago ha sido aprobado correctamente y tu pedido ya está siendo preparado para entrega. Aquí tienes los detalles completos de tu compra:";
  const customBodyTemplate = settings.emailTemplateOrderCreatedBody;
  const bodyText = customBodyTemplate
    ? replacePlaceholders(customBodyTemplate, { orderId, customerName, total: `$${total}`, siteTitle })
    : defaultBody;

  const itemsRows = items.map((item: any) => {
    const sizeStr = item.sizeSelected ? ` - Talle: ${item.sizeSelected}` : "";
    const colorStr = item.colorSelected ? ` - Color: ${item.colorSelected}` : "";
    const nameWithVariant = `${item.productName}${sizeStr}${colorStr}`;
    return `
      <tr>
        <td style="padding: 12px 10px; border-bottom: 1px solid #f1f5f9; font-size: 13px; color: #334155;">
          <strong>${nameWithVariant}</strong>
        </td>
        <td style="padding: 12px 10px; border-bottom: 1px solid #f1f5f9; font-size: 13px; color: #334155; text-align: center;">
          ${item.quantity}
        </td>
        <td style="padding: 12px 10px; border-bottom: 1px solid #f1f5f9; font-size: 13px; color: #334155; text-align: right;">
          $${item.unitPrice}
        </td>
        <td style="padding: 12px 10px; border-bottom: 1px solid #f1f5f9; font-size: 13px; color: #1e293b; text-align: right; font-weight: bold;">
          $${item.totalPrice}
        </td>
      </tr>
    `;
  }).join("");

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; padding: 40px 10px; color: #0f172a; line-height: 1.5;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.05);">
        
        <!-- Header -->
        ${settings.emailHeaderImageUrl ? `
          <div style="background-color: #0c1221; text-align: center; border-bottom: 4px solid #f59e0b; overflow: hidden; line-height: 0;">
            <img src="${settings.emailHeaderImageUrl}" alt="${siteTitle}" style="width: 100%; max-width: 600px; height: auto; display: block; margin: 0 auto; object-fit: cover;" />
          </div>
        ` : `
          <div style="background-color: #4f46e5; padding: 35px 30px; text-align: center; color: #ffffff;">
            ${settings.logoType === "image" && settings.logoImageUrl ? `
              <div style="margin-bottom: 12px; text-align: center;">
                <img src="${settings.logoImageUrl}" alt="${siteTitle}" style="max-height: 60px; max-width: 220px; object-fit: contain; display: inline-block; vertical-align: middle; border-radius: 8px; background-color: rgba(255, 255, 255, 0.15); padding: 4px;" />
              </div>
            ` : `
              <h1 style="margin: 0; font-size: 26px; font-weight: 800; letter-spacing: -0.025em;">${siteTitle}</h1>
            `}
            <p style="margin: 8px 0 0 0; font-size: 14px; opacity: 0.9; font-weight: 500;">¡Tu compra ha sido aprobada con éxito! 🎉</p>
          </div>
        `}

        <!-- Body -->
        <div style="padding: 30px;">
          ${settings.emailHeaderImageUrl && settings.logoType === "image" && settings.logoImageUrl ? `
            <div style="text-align: center; margin-bottom: 25px;">
              <img src="${settings.logoImageUrl}" alt="${siteTitle}" style="max-height: 55px; max-width: 180px; object-fit: contain;" />
            </div>
          ` : ""}
          <h2 style="margin: 0 0 15px 0; font-size: 18px; font-weight: 700; color: #1e1b4b; ${settings.emailHeaderImageUrl ? 'text-align: center;' : ''}">¡Hola, ${customerName}!</h2>
          <p style="margin: 0 0 25px 0; font-size: 14px; color: #475569; white-space: pre-wrap;">
            ${bodyText}
          </p>

          <!-- Order Summary Dashboard Card -->
          <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 18px; margin-bottom: 25px;">
            <div style="display: flex; justify-content: space-between; border-bottom: 1px solid #f1f5f9; padding-bottom: 8px; margin-bottom: 8px; font-size: 13px;">
              <span style="color: #64748b; font-weight: 600;">Número de Pedido:</span>
              <span style="color: #4f46e5; font-weight: 700; font-family: monospace;">#${orderId}</span>
            </div>
            <div style="display: flex; justify-content: space-between; border-bottom: 1px solid #f1f5f9; padding-bottom: 8px; margin-bottom: 8px; font-size: 13px;">
              <span style="color: #64748b; font-weight: 600;">Fecha de Compra:</span>
              <span style="color: #0f172a; font-weight: 500;">${fechaCompraCompilada}</span>
            </div>
            <div style="display: flex; justify-content: space-between; font-size: 13px;">
              <span style="color: #64748b; font-weight: 600;">Método de Pago:</span>
              <span style="color: #0f172a; font-weight: bold;">${paymentMethod}</span>
            </div>
          </div>

          <!-- Items Title -->
          <h3 style="margin: 0 0 12px 0; font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: #475569; border-bottom: 2px solid #f1f5f9; padding-bottom: 6px;">Productos Comprados</h3>
          
          <!-- Items Table -->
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 25px;">
            <thead>
              <tr style="background-color: #f8fafc;">
                <th style="padding: 10px; text-align: left; font-size: 11px; font-weight: 700; text-transform: uppercase; color: #64748b;">Artículo</th>
                <th style="padding: 10px; text-align: center; font-size: 11px; font-weight: 700; text-transform: uppercase; color: #64748b; width: 60px;">Cant.</th>
                <th style="padding: 10px; text-align: right; font-size: 11px; font-weight: 700; text-transform: uppercase; color: #64748b; width: 80px;">Precio</th>
                <th style="padding: 10px; text-align: right; font-size: 11px; font-weight: 700; text-transform: uppercase; color: #64748b; width: 90px;">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              ${itemsRows}
            </tbody>
          </table>

          <!-- Financial summary block -->
          <div style="width: 280px; margin-left: auto; margin-bottom: 30px; border-top: 2px solid #f1f5f9; padding-top: 10px;">
            <div style="display: flex; justify-content: space-between; padding: 4px 0; font-size: 13px; color: #475569;">
              <span>Subtotal:</span>
              <span style="color: #0f172a; font-weight: 500;">$${subtotal}</span>
            </div>
            ${discount > 0 ? `
            <div style="display: flex; justify-content: space-between; padding: 4px 0; font-size: 13px; color: #e11d48; font-weight: 600;">
              <span>Descuento (Cupón: ${coupon}):</span>
              <span>-$${discount}</span>
            </div>
            ` : ""}
            <div style="display: flex; justify-content: space-between; padding: 4px 0; font-size: 13px; color: #475569;">
              <span>Costo de Envío:</span>
              <span style="color: #0f172a; font-weight: 500;">${shippingCost === 0 ? "Gratis" : `$${shippingCost}`}</span>
            </div>
            <div style="display: flex; justify-content: space-between; padding: 10px 0; border-top: 1px dashed #cbd5e1; font-weight: 800; font-size: 17px; color: #4f46e5; margin-top: 5px;">
              <span>Total Pagado:</span>
              <span>$${total}</span>
            </div>
          </div>

          <!-- Notes -->
          ${notes && notes.trim() && notes !== "Ninguna" ? `
          <div style="margin-bottom: 25px; font-size: 13px; color: #475569; background-color: #fafafa; border-left: 3px solid #4f46e5; padding: 12px 15px; border-radius: 0 8px 8px 0;">
            <strong style="color: #0f172a; display: block; margin-bottom: 3px;">Instrucciones de Despacho / Notas:</strong> 
            "${notes}"
          </div>
          ` : ""}

          <!-- Instrucciones de Pago por Transferencia / Abitab / Redpagos -->
          ${(function() {
            const rawPaymentMethod = String(order.paymentMethod || order.payment_method || "").toLowerCase();
            const isTransfer = rawPaymentMethod.includes("transfer") || rawPaymentMethod.includes("banco");
            if (!isTransfer) return "";
            
            const details = settings.transferDetails && settings.transferDetails.trim() 
              ? settings.transferDetails 
              : "Realiza tu transferencia bancaria directa de forma rápida y segura desde BROU, Itaú, Santander, BBVA o cualquier banco de Uruguay. También aceptamos giros por Abitab y Redpagos. Al enviar tu pedido, indícanos por WhatsApp para facilitarte los datos de cuenta específicos o de giros.";

            return `
            <div style="margin-bottom: 25px; font-size: 13px; color: #1e1b4b; background-color: #f5f3ff; border: 1px solid #ddd6fe; padding: 18px; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.05); text-align: left;">
              <div style="display: flex; align-items: center; margin-bottom: 10px;">
                <span style="font-size: 20px; margin-right: 8px;">🏦</span>
                <strong style="color: #4f46e5; font-size: 14px;">Datos de Transferencia Bancaria y Redes de Cobranza (Abitab / Redpagos):</strong>
              </div>
              <p style="margin: 0; font-size: 12.5px; color: #4c1d95; line-height: 1.6; white-space: pre-wrap;">
                ${details}
              </p>
              <div style="margin-top: 12px; font-size: 11.5px; color: #6d28d9; font-weight: 500; font-style: italic; border-top: 1px dashed #ddd6fe; padding-top: 8px;">
                💡 RECUERDA: Una vez hecho el pago o giro, envía el comprobante de pago respondiendo a este correo o vía WhatsApp para despachar de inmediato tu pedido.
              </div>
            </div>
            `;
          })()}

          <!-- CTA to Support WhatsApp -->
          <div style="text-align: center; margin-top: 35px; border-top: 1px solid #f1f5f9; padding-top: 25px;">
            <p style="font-size: 12px; color: #64748b; margin-bottom: 12px;">¿Tienes alguna consulta rápida o deseas apurar tu paquete por WhatsApp?</p>
            <a href="https://wa.me/${(settings.whatsappNumber || "").replace(/\D/g, "")}" style="display: inline-block; background-color: #25d366; color: #ffffff; padding: 11px 22px; border-radius: 12px; text-decoration: none; font-weight: 700; font-size: 13px; box-shadow: 0 4px 6px -1px rgba(37, 211, 102, 0.2); text-transform: uppercase; letter-spacing: 0.05em;">
              Conectar vía WhatsApp 📱
            </a>
          </div>
        </div>

        <!-- Footer -->
        <div style="background-color: #f8fafc; padding: 25px 30px; text-align: center; border-top: 1px solid #e2e8f0; font-size: 11px; color: #64748b; line-height: 1.4;">
          Este correo ha sido generado de forma automática por la plataforma de ventas de ${siteTitle}.
          <br />
          Si hay algún dato erróneo en tu facturación, ponte en contacto de inmediato con nuestro soporte.
        </div>
      </div>
    </div>
  `;

  return { subject, html };
}

/**
 * 2. Generate PEDIDO ENVIADO/DESPACHADO Email HTML
 */
export function generateOrderShippedEmailHtml(order: any, settings: any): { subject: string; html: string } {
  const rawOrderId = order.id || "";
  const orderId = rawOrderId.length > 8 ? rawOrderId.substring(0, 6).toUpperCase() : rawOrderId;
  const customerName = order.customerName || "Cliente";
  const items = order.items || [];
  const trackingNumber = order.trackingNumber || order.tracking_number || "";
  const trackingCarrier = order.trackingCarrier || order.tracking_carrier || "";
  const siteTitle = settings.siteTitle || "Ventas Juem";

  const defaultSubject = `¡Tu pedido #${orderId} ha sido enviado! 🚚`;
  const subject = defaultSubject;

  const itemsRows = items.map((item: any) => {
    const sizeStr = item.sizeSelected ? ` - Talle: ${item.sizeSelected}` : "";
    const colorStr = item.colorSelected ? ` - Color: ${item.colorSelected}` : "";
    const nameWithVariant = `${item.productName}${sizeStr}${colorStr}`;
    return `
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #f1f5f9; font-size: 13px; color: #334155;">
          <strong>${nameWithVariant}</strong>
        </td>
        <td style="padding: 10px; border-bottom: 1px solid #f1f5f9; font-size: 13px; color: #334155; text-align: center; font-weight: bold;">
          ${item.quantity}
        </td>
      </tr>
    `;
  }).join("");

  // Tracking section HTML block if tracking info exists
  let trackingHtml = "";
  if (trackingNumber && trackingNumber.trim() !== "") {
    let trackingLink = "";
    const carrierLower = trackingCarrier.toLowerCase();
    if (carrierLower.includes("ues")) {
      trackingLink = `https://www.ues.com.uy/rastreo-de-envios?tracking=${trackingNumber}`;
    } else if (carrierLower.includes("dac")) {
      trackingLink = `https://www.dac.com.uy/vpa/index.html`; 
    } else {
      trackingLink = `https://www.correo.com.uy/`;
    }

    trackingHtml = `
      <div style="background-color: #eff6ff; border: 1px solid #bfdbfe; border-radius: 12px; padding: 22px 18px; margin-bottom: 25px; text-align: center;">
        <span style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: #1d4ed8; letter-spacing: 0.1em; display: block; margin-bottom: 6px;">Información de Seguimiento</span>
        <div style="font-size: 14px; font-weight: bold; color: #1e3a8a; margin-bottom: 6px;">
          Transportadora / Courier: <span style="text-transform: uppercase; color: #1d4ed8;">${trackingCarrier || "Correo"}</span>
        </div>
        <div style="font-size: 18px; font-family: monospace; font-weight: bold; color: #0f172a; margin-bottom: 15px; letter-spacing: 0.05em;">
          Código: ${trackingNumber}
        </div>
        <a href="${trackingLink}" target="_blank" style="display: inline-block; background-color: #1d4ed8; color: #ffffff; padding: 11px 24px; border-radius: 10px; text-decoration: none; font-weight: 800; font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em; box-shadow: 0 4px 6px -1px rgba(29, 78, 216, 0.2);">
          Rastrear mi paquete 📦
        </a>
      </div>
    `;
  } else {
    trackingHtml = `
      <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; padding: 18px; margin-bottom: 25px; text-align: center; color: #166534; font-size: 13px; line-height: 1.4;">
        <strong>Despacho local completado:</strong> Tu pedido ha sido derivado a nuestro cadete del área correspondiente. Recibirás tu pedido de calzado muy pronto en la dirección especificada.
      </div>
    `;
  }

  // Google review button
  const reviewLink = "https://g.page/r/search/review"; // Fallback reviews link

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; padding: 40px 10px; color: #0f172a; line-height: 1.5;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.05);">
        
        <!-- Header -->
        ${settings.emailHeaderImageUrl ? `
          <div style="background-color: #0c1221; text-align: center; border-bottom: 4px solid #f59e0b; overflow: hidden; line-height: 0;">
            <img src="${settings.emailHeaderImageUrl}" alt="${siteTitle}" style="width: 100%; max-width: 600px; height: auto; display: block; margin: 0 auto; object-fit: cover;" />
          </div>
        ` : `
          <div style="background-color: #10b981; padding: 35px 30px; text-align: center; color: #ffffff;">
            ${settings.logoType === "image" && settings.logoImageUrl ? `
              <div style="margin-bottom: 12px; text-align: center;">
                <img src="${settings.logoImageUrl}" alt="${siteTitle}" style="max-height: 60px; max-width: 220px; object-fit: contain; display: inline-block; vertical-align: middle; border-radius: 8px; background-color: rgba(255, 255, 255, 0.15); padding: 4px;" />
              </div>
            ` : `
              <h1 style="margin: 0; font-size: 26px; font-weight: 800; letter-spacing: -0.025em;">${siteTitle}</h1>
            `}
            <p style="margin: 8px 0 0 0; font-size: 14px; opacity: 0.9; font-weight: 500;">¡Tu pedido va en camino! 🚚🚀</p>
          </div>
        `}

        <!-- Body -->
        <div style="padding: 30px;">
          ${settings.emailHeaderImageUrl && settings.logoType === "image" && settings.logoImageUrl ? `
            <div style="text-align: center; margin-bottom: 25px;">
              <img src="${settings.logoImageUrl}" alt="${siteTitle}" style="max-height: 55px; max-width: 180px; object-fit: contain;" />
            </div>
          ` : ""}
          <h2 style="margin: 0 0 15px 0; font-size: 18px; font-weight: 700; color: #064e3b; ${settings.emailHeaderImageUrl ? 'text-align: center;' : ''}">¡Hola, ${customerName}!</h2>
          <p style="margin: 0 0 20px 0; font-size: 14px; color: #475569;">
            Te queremos informar que tu pedido <strong style="color: #0f172a;">#${orderId}</strong> ha sido enviado por nuestro equipo. Aquí dispones del detalle de tu despacho:
          </p>

          <!-- Tracking section inside email -->
          ${trackingHtml}

          <!-- Delivery / Date Info Box -->
          <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 15px; margin-bottom: 25px;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 5px; font-size: 13px;">
              <span style="color: #64748b; font-weight: 600;">Pedido de referencia:</span>
              <span style="color: #0f172a; font-weight: 700; font-family: monospace;">#${orderId}</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 5px; font-size: 13px;">
              <span style="color: #64748b; font-weight: 600;">Fecha de Envío:</span>
              <span style="color: #0f172a; font-weight: 500;">${new Date().toLocaleDateString("es-UY")}</span>
            </div>
            <div style="display: flex; justify-content: space-between; font-size: 13px;">
              <span style="color: #64748b; font-weight: 600;">Estado Actual del Pedido:</span>
              <span style="color: #10b981; font-weight: bold;">ENVIADO / DESPACHADO</span>
            </div>
          </div>

          <!-- Items list in this shipment -->
          <h3 style="margin: 0 0 12px 0; font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: #475569; border-bottom: 2px solid #f1f5f9; padding-bottom: 6px;">Productos en el Envío</h3>
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 25px;">
            <thead>
              <tr style="background-color: #f8fafc;">
                <th style="padding: 10px; text-align: left; font-size: 11px; font-weight: 700; text-transform: uppercase; color: #64748b;">Artículo</th>
                <th style="padding: 10px; text-align: center; font-size: 11px; font-weight: 700; text-transform: uppercase; color: #64748b; width: 80px;">Cantidad</th>
              </tr>
            </thead>
            <tbody>
              ${itemsRows}
            </tbody>
          </table>

          <!-- Leave a review box (Amber themed, very warm and professional) -->
          <div style="text-align: center; background-color: #fef3c7; border: 1px solid #fde68a; border-radius: 12px; padding: 25px 18px; margin-bottom: 25px;">
            <div style="font-size: 16px; font-weight: 800; color: #92400e; margin-bottom: 5px;">🌟 ¡Tu opinión nos ayuda a crecer! 🌟</div>
            <p style="font-size: 12px; color: #b45309; margin: 0 auto 15px auto; max-width: 420px; line-height: 1.45;">
              Nos encantaría que dejes tu reseña sobre tu experiencia con nuestro calzado. Tus valoraciones ayudan a que más personas encuentren su talle y diseño ideal.
            </p>
            <a href="${reviewLink}" target="_blank" style="display: inline-block; background-color: #d97706; color: #ffffff; padding: 11px 24px; border-radius: 10px; text-decoration: none; font-weight: 800; font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em; box-shadow: 0 4px 6px -1px rgba(217, 119, 6, 0.2);">
              Dejar una Valoración ⭐
            </a>
          </div>

          <!-- Contact WhatsApp Support -->
          <div style="text-align: center; margin-top: 35px; border-top: 1px solid #f1f5f9; padding-top: 25px;">
            <p style="font-size: 12px; color: #64748b; margin-bottom: 12px;">¿Tienes alguna consulta o inconveniente con el envío?</p>
            <a href="https://wa.me/${(settings.whatsappNumber || "").replace(/\D/g, "")}" style="display: inline-block; background-color: #25d366; color: #ffffff; padding: 10px 20px; border-radius: 12px; text-decoration: none; font-weight: 700; font-size: 13px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); text-transform: uppercase;">
              Soporte vía WhatsApp
            </a>
          </div>
        </div>

        <!-- Footer -->
        <div style="background-color: #f8fafc; padding: 20px 30px; text-align: center; border-top: 1px solid #e2e8f0; font-size: 11px; color: #64748b;">
          Este correo ha sido generado de forma automática por la plataforma de venta de ${siteTitle}.
          <br />
          Si no realizaste este pedido, por favor ignora este correo.
        </div>
      </div>
    </div>
  `;

  return { subject, html };
}

/**
 * 3. FALLBACK GENERAL TEMPLATE FOR OTHER STATUS UPDATES
 */
export function generateOrderStatusChangedEmailHtml(params: {
  order: any;
  oldStatus: string;
  newStatus: string;
  settings: any;
}): { subject: string; html: string } {
  const { order, newStatus, settings } = params;
  const rawOrderId = order.id || "";
  const orderId = rawOrderId.length > 8 ? rawOrderId.substring(0, 6).toUpperCase() : rawOrderId;
  const customerName = order.customerName || "Cliente";
  const siteTitle = settings.siteTitle || "Ventas Juem";
  const statusText = statusLabels[newStatus] || newStatus;

  const defaultSubject = `Actualización de Estado - Pedido #${orderId}`;
  const customSubjectTemplate = settings.emailTemplateOrderStatusChangedSubject;
  const subject = customSubjectTemplate
    ? replacePlaceholders(customSubjectTemplate, { orderId, customerName, statusText, siteTitle })
    : defaultSubject;

  const defaultBody = "Te notificamos que el estado de tu pedido #{{orderId}} ha sido actualizado por nuestro equipo de logística.";
  const customBodyTemplate = settings.emailTemplateOrderStatusChangedBody;
  const bodyText = customBodyTemplate
    ? replacePlaceholders(customBodyTemplate, { orderId, customerName, statusText, siteTitle })
    : replacePlaceholders(defaultBody, { orderId });

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; padding: 40px 10px; color: #0f172a; line-height: 1.5;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.05);">
        
        <!-- Header -->
        ${settings.emailHeaderImageUrl ? `
          <div style="background-color: #0c1221; text-align: center; border-bottom: 4px solid #f59e0b; overflow: hidden; line-height: 0;">
            <img src="${settings.emailHeaderImageUrl}" alt="${siteTitle}" style="width: 100%; max-width: 600px; height: auto; display: block; margin: 0 auto; object-fit: cover;" />
          </div>
        ` : `
          <div style="background-color: #2563eb; padding: 30px; text-align: center; color: #ffffff;">
            ${settings.logoType === "image" && settings.logoImageUrl ? `
              <div style="margin-bottom: 12px; text-align: center;">
                <img src="${settings.logoImageUrl}" alt="${siteTitle}" style="max-height: 60px; max-width: 220px; object-fit: contain; display: inline-block; vertical-align: middle; border-radius: 8px; background-color: rgba(255, 255, 255, 0.15); padding: 4px;" />
              </div>
            ` : `
              <h1 style="margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.025em;">${siteTitle}</h1>
            `}
            <p style="margin: 8px 0 0 0; font-size: 14px; opacity: 0.9;">¡El estado de tu pedido ha cambiado!</p>
          </div>
        `}

        <!-- Body -->
        <div style="padding: 30px;">
          ${settings.emailHeaderImageUrl && settings.logoType === "image" && settings.logoImageUrl ? `
            <div style="text-align: center; margin-bottom: 25px;">
              <img src="${settings.logoImageUrl}" alt="${siteTitle}" style="max-height: 55px; max-width: 180px; object-fit: contain;" />
            </div>
          ` : ""}
          <h2 style="margin: 0 0 15px 0; font-size: 18px; font-weight: 700; ${settings.emailHeaderImageUrl ? 'text-align: center;' : ''}">Hola, ${customerName}</h2>
          <p style="margin: 0 0 25px 0; font-size: 14px; color: #475569; white-space: pre-wrap;">
            ${bodyText}
          </p>

          <!-- Current Status Display -->
          <div style="text-align: center; background-color: #eff6ff; border: 1px solid #bfdbfe; border-radius: 12px; padding: 25px 15px; margin-bottom: 25px;">
            <span style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: #1d4ed8; letter-spacing: 0.1em; display: block; margin-bottom: 5px;">Nuevo Estado del Pedido</span>
            <span style="font-size: 20px; font-weight: 800; color: #1e3a8a;">${statusText}</span>
          </div>

          <p style="margin: 0 0 20px 0; font-size: 13px; color: #64748b; line-height: 1.5;">
            ${newStatus === "pago_confirmado" || newStatus === "pago_aprobado" ? "Hemos confirmado tu pago con éxito. Tu pedido pasa al sector de embalaje." : ""}
            ${newStatus === "en_preparacion" ? "Tu calzado o indumentaria ya se está siendo preparado y verificado." : ""}
            ${newStatus === "listo_para_retirar" ? "¡Buenas noticias! Tu pedido ya está listo para ser retirado en nuestros depósitos físicos de entrega." : ""}
            ${newStatus === "pedido_cancelado" ? "Tu pedido ha sido cancelado. Si tienes dudas sobre los motivos o reintegros, no dudes en escribirnos." : ""}
            ${newStatus === "pedido_reembolsado" ? "El importe de tu compra ha sido devuelto de forma exitosa." : ""}
          </p>

          <!-- Order Summary Details -->
          <div style="background-color: #f8fafc; border-radius: 12px; padding: 15px; margin-bottom: 25px; border: 1px solid #e2e8f0; font-size: 12px; color: #475569;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
              <span>Referencia de la Orden:</span>
              <strong style="color: #0f172a;">#${orderId}</strong>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
              <span>Importe Total:</span>
              <strong style="color: #0f172a;">$${order.total || 0}</strong>
            </div>
            <div style="display: flex; justify-content: space-between;">
              <span>Línea telefónica del cliente:</span>
              <strong style="color: #0f172a;">${order.customerPhone || "N/A"}</strong>
            </div>
          </div>

          <!-- Support Box -->
          <div style="text-align: center; margin-top: 35px; border-top: 1px solid #f1f5f9; padding-top: 25px;">
            <p style="font-size: 12px; color: #64748b; margin-bottom: 15px;">¿Tienes alguna duda de tu método de entrega?</p>
            <a href="https://wa.me/${(settings.whatsappNumber || "").replace(/\D/g, "")}" style="display: inline-block; background-color: #25d366; color: #ffffff; padding: 10px 20px; border-radius: 12px; text-decoration: none; font-weight: 700; font-size: 13px; text-transform: uppercase;">
              Soporte por WhatsApp
            </a>
          </div>
        </div>

        <!-- Footer -->
        <div style="background-color: #f8fafc; padding: 20px 30px; text-align: center; border-top: 1px solid #e2e8f0; font-size: 11px; color: #64748b;">
          Este correo ha sido enviado automáticamente por ${siteTitle}. No es necesario responder directamente a este remitente.
        </div>
      </div>
    </div>
  `;

  return { subject, html };
}

/**
 * 4. DISPATCHER: MAIN CHIEF DECOUPLED ORDER EMAIL DISPATCH SYSTEM
 */
export async function dispatchOrderEmail(
  eventType: "purchase_confirmed" | "order_shipped", 
  order: any, 
  settings: any
): Promise<{ success: boolean; status: string; error?: string; message?: string }> {
  
  if (!order || !order.id) {
    return { success: false, status: "error", error: "Pedido o ID de pedido inexistente." };
  }

  const recipient = order.customerEmail || order.customer_email;
  if (!recipient || recipient === "cliente@tienda.com" || !recipient.includes("@")) {
    console.warn(`[Dispatcher Warning] Email de destino no válido o placeholder para pedido ID: ${order.id}. Muted.`);
    return { success: false, status: "muted", message: "Email del comprador es un placeholder o no es válido." };
  }

  // A. PREVENT DUPLICATES
  const duplicate = await isEmailAlreadySent(order.id, eventType);
  if (duplicate) {
    console.log(`[Email Dispatcher] Envío duplicado evitado para pedido #${order.id} (Tipo: ${eventType})`);
    return { success: true, status: "duplicate", message: "Envío duplicado prevenido con antelación." };
  }

  // B. RENDER CORRESPONDING RESPONSIVE HTML
  let subject = "";
  let html = "";

  try {
    if (eventType === "purchase_confirmed") {
      const render = generateOrderCreatedEmailHtml(order, settings);
      subject = render.subject;
      html = render.html;
    } else if (eventType === "order_shipped") {
      const render = generateOrderShippedEmailHtml(order, settings);
      subject = render.subject;
      html = render.html;
    } else {
      return { success: false, status: "error", error: `Evento de e-mail no admitido: ${eventType}` };
    }
  } catch (renderErr: any) {
    console.error(`[Email Dispatcher Error] Error de renderizado de plantilla para ${eventType}:`, renderErr);
    return { success: false, status: "error", error: `Error durante renderizado: ${renderErr.message}` };
  }

  // C. CORE TRANSMISSION SEND ACTION
  const result = await sendEmail({
    settings,
    to: recipient,
    subject,
    html
  });

  // D. RECORD LOG TRANSACTION
  const logId = "email-log-" + Math.random().toString(36).substring(2, 10);
  await logEmailDelivery({
    id: logId,
    timestamp: new Date().toISOString(),
    to: recipient,
    orderId: order.id,
    emailType: eventType,
    subject,
    body: html,
    status: result.status,
    error: result.error
  });

  return { success: result.success, status: result.status, error: result.error };
}
