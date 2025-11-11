import nodemailer from 'nodemailer';

export const mailer = nodemailer.createTransport({
  host: process.env.SMTP_HOST ?? 'smtp.gmail.com',
  port: Number(process.env.SMTP_PORT ?? 587),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export async function verifySMTP(): Promise<void> {
  try {
    await mailer.verify();
    console.log('✅ SMTP configurado e funcionando');
  } catch (error: any) {
    console.error('❌ SMTP FALHOU:', error?.message || error);
    console.error('Verifique SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS no .env');
    
    if (process.env.NODE_ENV === 'production') {
      throw new Error('SMTP obrigatório em produção');
    }
  }
}