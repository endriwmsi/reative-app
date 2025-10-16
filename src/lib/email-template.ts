export const emailTemplate = {
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
