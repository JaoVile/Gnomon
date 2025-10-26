import nodemailer from 'nodemailer';
export const mailer = nodemailer.createTransport({
host: process.env.SMTP_HOST,
port: Number(process.env.SMTP_PORT ?? 587),
secure: process.env.SMTP_SECURE === 'true', // 587=false, 465=true
auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
});

export async function verifySMTP() {
try {
await mailer.verify();
console.log('SMTP OK');
} catch (e) {
console.error('SMTP FAIL:', e);
}
}