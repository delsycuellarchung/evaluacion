import nodemailer from 'nodemailer';

let transporter: any = null;

export const getEmailTransporter = () => {
  if (transporter) return transporter;

  const host = (process.env.SMTP_HOST || 'smtp.gmail.com').trim();
  const port = parseInt(process.env.SMTP_PORT || '587');
  const user = process.env.SMTP_USER?.trim();
  const pass = process.env.SMTP_PASS?.trim();

  console.log('📧 Email Config:', {
    host,
    port,
    user: user ? `${user.substring(0, 5)}...${user.substring(user.length - 5)}` : 'NOT SET',
    pass: pass ? `${pass.substring(0, 3)}...${pass.substring(pass.length - 3)}` : 'NOT SET',
    authType: 'basic'
  });

  if (!user || !pass) {
    console.error('❌ Email configuration not set. Set SMTP_USER and SMTP_PASS in .env.local');
    return null;
  }

  try {
    transporter = nodemailer.createTransport({
      host,
      port,
      secure: false,
      auth: {
        user,
        pass,
      },
      logger: true,
      debug: true,
    });

    console.log('✅ Nodemailer transporter created successfully');
    return transporter;
  } catch (error) {
    console.error('❌ Error creating transporter:', error);
    return null;
  }
};

export const sendFormEmail = async (params: {
  evaluatorName: string;
  evaluatorEmail: string;
  evaluadoName: string;
  evaluadoCargo?: string | null;
  formLink: string;
  mensajePersonalizado?: string;
  formData?: any;
}) => {
  const transporter = getEmailTransporter();
  if (!transporter) {
    throw new Error('Email service not configured');
  }

  const { evaluatorName, evaluatorEmail, evaluadoName, evaluadoCargo, formLink, mensajePersonalizado, formData } = params;

  const defaultOptions = ['Nunca', 'Rara vez', 'A veces', 'Frecuentemente', 'Siempre'];

  const buildQuestions = () => {
    try {
      if (!formData) return [];
      if (Array.isArray(formData.afirmaciones) && formData.afirmaciones.length > 0) {
        return formData.afirmaciones.map((a: any) => ({
          question: a.pregunta || a.texto || 'Pregunta',
          options: Array.isArray(a.opciones) && a.opciones.length > 0 ? a.opciones : defaultOptions,
          descripcion: a.descripcion || ''
        }));
      }
      const comps = Array.isArray(formData.competencias) ? formData.competencias.map((c: any) => ({ question: c.pregunta || 'Pregunta', options: Array.isArray(c.opciones) ? c.opciones : defaultOptions, descripcion: c.descripcion || '' })) : [];
      const ests = Array.isArray(formData.estilos) ? formData.estilos.map((c: any) => ({ question: c.pregunta || 'Pregunta', options: Array.isArray(c.opciones) ? c.opciones : defaultOptions, descripcion: c.descripcion || '' })) : [];
      return [...comps, ...ests];
    } catch (e) {
      return [];
    }
  };

  const instrucciones = (formData && Array.isArray(formData.instrucciones)) ? formData.instrucciones : [];
  const questions = buildQuestions().slice(0, 12); // cap preview to 12 rows

  const htmlContent = `
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background: linear-gradient(135deg, #f0f4ff 0%, #f8f9ff 100%); margin: 0; padding: 20px;">
      <div style="max-width: 600px; margin: 0 auto;">
        
        <!-- Header con branding -->
        <div style="background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); padding: 40px 30px; border-radius: 12px 12px 0 0; text-align: center; color: white;">
          <h1 style="font-size: 28px; margin: 0 0 8px 0; font-weight: 700;">Formulario de Evaluación</h1>
          <p style="font-size: 14px; margin: 0; opacity: 0.9;">Te invitamos a compartir tu feedback</p>
        </div>

        <!-- Contenido principal -->
        <div style="background: white; padding: 40px 30px; border-radius: 0 0 12px 12px; box-shadow: 0 10px 40px rgba(0, 0, 0, 0.08);">
          
          <!-- Saludo personalizado -->
          <div style="margin-bottom: 24px;">
            <p style="font-size: 18px; color: #0f172a; margin: 0 0 8px 0; font-weight: 600;">¡Hola, <span style="color: #4f46e5;">${evaluatorName}</span>!</p>
            <p style="font-size: 14px; color: #64748b; margin: 0; line-height: 1.6;">
              Esperamos tu valiosa evaluación sobre el desempeño de:
            </p>
          </div>

          <!-- Card con información del evaluado -->
          <div style="background: #f8f9ff; border-left: 4px solid #4f46e5; padding: 16px; border-radius: 8px; margin-bottom: 24px;">
            <p style="font-size: 16px; color: #0f172a; margin: 0 0 4px 0; font-weight: 700;">${evaluadoName}</p>
            ${evaluadoCargo ? `<p style="font-size: 13px; color: #64748b; margin: 0;">${evaluadoCargo}</p>` : ''}
          </div>

          <!-- Mensaje personalizado destacado -->
          ${mensajePersonalizado ? `
          <div style="background: #eff6ff; border: 2px solid #93c5fd; padding: 16px; border-radius: 8px; margin-bottom: 24px;">
            <p style="font-size: 13px; color: #0369a1; margin: 0 0 8px 0; font-weight: 600; text-transform: uppercase;">📋 Mensaje especial</p>
            <p style="font-size: 14px; color: #0f172a; margin: 0; line-height: 1.6;">${mensajePersonalizado}</p>
          </div>
          ` : ''}

          <!-- Descripción -->
          <div style="margin-bottom: 28px;">
            <p style="font-size: 14px; color: #475569; line-height: 1.7; margin: 0;">
              Tu feedback es fundamental para nuestro proceso de desarrollo y crecimiento. El formulario incluye preguntas sobre competencias y estilos de liderazgo. Tu honestidad y reflexión son vastamente apreciadas.
            </p>
          </div>

          <!-- Botón CTA -->
          <div style="text-align: center; margin-bottom: 32px;">
            <a href="${formLink}" style="
              display: inline-block;
              background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
              color: white;
              padding: 16px 48px;
              border-radius: 8px;
              text-decoration: none;
              font-weight: 600;
              font-size: 15px;
              box-shadow: 0 8px 24px rgba(79, 70, 229, 0.3);
              transition: transform 0.2s;
            " onmouseover="this.style.transform='translateY(-2px)'" onmouseout="this.style.transform='translateY(0)'">
              ➔ Completar Evaluación
            </a>
          </div>

          <!-- Detalles importantes -->
          <div style="background: #f8fafc; padding: 16px; border-radius: 8px; margin-bottom: 24px;">
            <p style="font-size: 12px; color: #475569; margin: 0 0 8px 0; font-weight: 600;">⏰ Información importante:</p>
            <ul style="font-size: 13px; color: #64748b; margin: 0; padding-left: 20px; line-height: 1.7;">
              <li>El enlace está disponible durante 24 horas</li>
              <li>Puedes guardar tu progreso y continuar después</li>
              <li>Toma aproximadamente 10-15 minutos completarlo</li>
              <li>Toda la información es confidencial</li>
            </ul>
          </div>

          <!-- Cierre -->
          <div style="border-top: 1px solid #e2e8f0; padding-top: 20px; text-align: center;">
            <p style="font-size: 13px; color: #64748b; margin: 0;">
              Si tienes preguntas, contáctanos.<br>
              <span style="color: #94a3b8; font-size: 12px;">Gracias por tu valioso aporte.</span>
            </p>
          </div>
        </div>

        <!-- Footer -->
        <div style="text-align: center; padding: 20px 30px; color: #94a3b8; font-size: 12px;">
          <p style="margin: 0;">Este es un mensaje automático. Por favor no respondas a este correo.</p>
          <p style="margin: 6px 0 0 0;">© Líderes | Sistema de Evaluación de Liderazgo</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const mailOptions = {
    from: `"Líderes" <${process.env.SMTP_USER}>`,
    to: evaluatorEmail,
    subject: `Formulario de Evaluación: ${evaluadoName}`,
    html: htmlContent,
  };

  try {
    console.log('📤 Enviando email a:', evaluatorEmail);
    const result = await transporter.sendMail(mailOptions);
    console.log('✅ Email enviado exitosamente:', result.messageId);
    return true;
  } catch (error: any) {
    console.error('❌ Error enviando email:', error.message);
    console.error('Full error:', error);
    throw error;
  }
};

