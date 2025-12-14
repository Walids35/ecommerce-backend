export const PDF_CONFIG = {
  // Company branding
  companyName: process.env.COMPANY_NAME || 'E-Commerce Store',
  companyAddress: process.env.COMPANY_ADDRESS || '123 Rue du Commerce, 75001 Paris, France',
  companyPhone: process.env.COMPANY_PHONE || '+33 1 23 45 67 89',
  companyEmail: process.env.COMPANY_EMAIL || process.env.RESEND_FROM_EMAIL || 'contact@example.com',
  companyWebsite: process.env.COMPANY_WEBSITE || 'www.example.com',

  // Tax/Legal identifiers (French business)
  companySiret: process.env.COMPANY_SIRET || '',
  companyTva: process.env.COMPANY_TVA || '',

  // Document settings
  validityDays: 30, // Quote validity period
  currency: 'TND',

  // PDF styling
  colors: {
    primary: '#000000',
    secondary: '#666666',
    accent: '#333333',
    background: '#ffffff',
  },

  fonts: {
    regular: 'Helvetica',
    bold: 'Helvetica-Bold',
  },
} as const;

export const TERMS_AND_CONDITIONS_FR = {
  devis: [
    'Ce devis est valable 30 jours à compter de sa date d\'émission.',
    'Les prix sont exprimés en dinars tunisiens (TND) toutes taxes comprises.',
    'Le paiement est dû à la commande.',
    'Les articles restent la propriété de notre société jusqu\'au paiement complet.',
  ],
  facture: [
    'Facture acquittée - Paiement reçu.',
    'Les prix sont exprimés en dinars tunisiens (TND) toutes taxes comprises.',
    'Les articles restent la propriété de notre société jusqu\'au paiement complet.',
    'Pour toute réclamation, veuillez nous contacter dans les 7 jours suivant la réception.',
  ],
};
