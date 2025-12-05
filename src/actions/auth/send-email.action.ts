"use server";

import transporter from "@/lib/mailer";

const emailTemplate = {
  // Main email wrapper - minimalista e elegante
  wrapper: `
    background: linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 100%);
    margin: 0;
    padding: 40px 20px;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Inter', Roboto, sans-serif;
    line-height: 1.6;
  `,

  // Container principal
  container: `
    max-width: 560px;
    margin: 0 auto;
    background: #ffffff;
    border-radius: 2px;
    overflow: hidden;
    box-shadow: 0 4px 40px rgba(0, 0, 0, 0.08);
  `,

  // Header minimalista com linha dourada
  header: `
    background: #ffffff;
    padding: 0;
    border-top: 3px solid #d4af37;
    position: relative;
  `,

  // Logo section
  logoSection: `
    padding: 48px 48px 24px 48px;
    text-align: center;
    border-bottom: 1px solid #f5f5f5;
  `,

  // Brand name
  brand: `
    font-size: 24px;
    font-weight: 300;
    color: #1a1a1a;
    margin: 0;
    letter-spacing: 2px;
    text-transform: uppercase;
  `,

  // Subtle tagline
  tagline: `
    font-size: 12px;
    color: #8a8a8a;
    margin: 8px 0 0 0;
    font-weight: 400;
    letter-spacing: 1px;
    text-transform: uppercase;
  `,

  // Content area
  content: `
    padding: 48px 48px 40px 48px;
    background: #ffffff;
  `,

  // Main title - elegante e minimalista
  title: `
    font-size: 28px;
    color: #1a1a1a;
    margin: 0 0 32px 0;
    font-weight: 300;
    line-height: 1.3;
    text-align: center;
    letter-spacing: -0.5px;
  `,

  // Description text
  description: `
    font-size: 16px;
    color: #4a4a4a;
    line-height: 1.7;
    margin: 0 0 40px 0;
    text-align: center;
    font-weight: 400;
  `,

  // Button container
  buttonWrapper: `
    text-align: center;
    margin: 40px 0;
  `,

  // CTA Button - sofisticado com dourado
  button: `
    display: inline-block;
    background: linear-gradient(135deg, #d4af37 0%, #b8941f 100%);
    color: #ffffff;
    text-decoration: none;
    padding: 16px 40px;
    border-radius: 1px;
    font-weight: 500;
    font-size: 14px;
    text-align: center;
    text-transform: uppercase;
    letter-spacing: 1px;
    transition: all 0.3s ease;
    box-shadow: 0 2px 8px rgba(212, 175, 55, 0.3);
    border: none;
  `,

  // Elegant divider
  divider: `
    width: 60px;
    height: 1px;
    background: #d4af37;
    margin: 40px auto;
    border: none;
  `,

  // Info box minimalista
  infoBox: `
    background: #fafafa;
    border: 1px solid #f0f0f0;
    padding: 24px;
    margin: 32px 0;
    border-radius: 1px;
    border-left: 2px solid #d4af37;
  `,

  infoText: `
    margin: 0;
    color: #6a6a6a;
    font-size: 14px;
    line-height: 1.6;
    font-weight: 400;
  `,

  // Footer elegante
  footer: `
    background: #f8f8f8;
    padding: 32px 48px;
    text-align: center;
    border-top: 1px solid #f0f0f0;
  `,

  // Footer branding
  footerBrand: `
    font-size: 16px;
    color: #1a1a1a;
    margin: 0 0 8px 0;
    font-weight: 300;
    letter-spacing: 1px;
  `,

  // Footer description
  footerDesc: `
    font-size: 13px;
    color: #8a8a8a;
    margin: 0 0 24px 0;
    font-weight: 400;
    line-height: 1.5;
  `,

  // Copyright
  copyright: `
    font-size: 11px;
    color: #b0b0b0;
    margin: 0;
    font-weight: 400;
    letter-spacing: 0.5px;
  `,

  // Accent line
  accentLine: `
    width: 40px;
    height: 1px;
    background: #d4af37;
    margin: 16px auto 24px auto;
    border: none;
  `,
};

export async function sendEmailAction({
  to,
  subject,
  meta,
}: {
  to: string;
  subject: string;
  meta: {
    description: string;
    link: string;
    buttonText?: string;
  };
}) {
  const currentYear = new Date().getFullYear();

  const mailOptions = {
    from: process.env.NODEMAILER_USER,
    to,
    subject: `HUB-LN • ${subject}`,
    html: `
      <!DOCTYPE html>
      <html lang="pt-BR">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${subject}</title>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&display=swap" rel="stylesheet">
        <!--[if mso]>
        <noscript>
          <xml>
            <o:OfficeDocumentSettings>
              <o:PixelsPerInch>96</o:PixelsPerInch>
            </o:OfficeDocumentSettings>
          </xml>
        </noscript>
        <![endif]-->
      </head>
      <body style="${emailTemplate.wrapper}">
        
        <!-- Email Container -->
        <div style="${emailTemplate.container}">
          
          <!-- Header with Golden Accent -->
          <div style="${emailTemplate.header}">
            <div style="${emailTemplate.logoSection}">
              <h1 style="${emailTemplate.brand}">HUB-LN</h1>
              <p style="${emailTemplate.tagline}">Excellence in Development</p>
            </div>
          </div>
          
          <!-- Main Content -->
          <div style="${emailTemplate.content}">
            <h2 style="${emailTemplate.title}">${subject}</h2>
            
            <hr style="${emailTemplate.divider}">
            
            <p style="${emailTemplate.description}">${meta.description}</p>
            
            <!-- Call to Action -->
            <div style="${emailTemplate.buttonWrapper}">
              <a href="${meta.link}" style="${emailTemplate.button}">
                ${meta.buttonText || "Prosseguir"}
              </a>
            </div>
            
            <hr style="${emailTemplate.divider}">
            
            <!-- Security Notice -->
            <div style="${emailTemplate.infoBox}">
              <p style="${emailTemplate.infoText}">
                <strong>Segurança:</strong> Se você não solicitou esta ação, pode ignorar este email com segurança. Nenhuma alteração será feita em sua conta.
              </p>
            </div>
          </div>
          
          <!-- Elegant Footer -->
          <div style="${emailTemplate.footer}">
            <h3 style="${emailTemplate.footerBrand}">Hub LN</h3>
            <hr style="${emailTemplate.accentLine}">
            <p style="${emailTemplate.footerDesc}">
              Transformando ideias em soluções digitais excepcionais.<br>
              Tecnologia de ponta com design sofisticado.
            </p>
            <p style="${emailTemplate.copyright}">
              © ${currentYear} Hub LN. Todos os direitos reservados.
            </p>
          </div>
          
        </div>
        
        <!-- Responsive Styles -->
        <style>
          @media only screen and (max-width: 600px) {
            .email-container {
              margin: 20px 10px !important;
            }
            .content-mobile {
              padding: 32px 24px !important;
            }
            .logo-mobile {
              padding: 32px 24px 16px 24px !important;
            }
            .footer-mobile {
              padding: 24px !important;
            }
            .title-mobile {
              font-size: 22px !important;
              line-height: 1.4 !important;
            }
            .description-mobile {
              font-size: 15px !important;
            }
            .button-mobile {
              padding: 14px 32px !important;
              font-size: 13px !important;
            }
            .brand-mobile {
              font-size: 20px !important;
            }
          }
          
          /* Button hover effect */
          .cta-button:hover {
            background: linear-gradient(135deg, #b8941f 0%, #9c7d1a 100%) !important;
            box-shadow: 0 4px 12px rgba(212, 175, 55, 0.4) !important;
          }
          
          /* High contrast mode support */
          @media (prefers-contrast: high) {
            .accent-gold {
              background: #8b6914 !important;
            }
          }
        </style>
        
      </body>
      </html>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    return { success: true, message: "Email enviado com sucesso!" };
  } catch (error) {
    console.error("sendEmailAction error", error);
    return {
      success: false,
      message: "Erro ao enviar email. Tente novamente mais tarde.",
    };
  }
}
