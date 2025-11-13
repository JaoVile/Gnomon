"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.mailer = void 0;
exports.verifySMTP = verifySMTP;
const nodemailer_1 = __importDefault(require("nodemailer"));
exports.mailer = nodemailer_1.default.createTransport({
    host: process.env.SMTP_HOST ?? 'smtp.gmail.com',
    port: Number(process.env.SMTP_PORT ?? 587),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});
async function verifySMTP() {
    try {
        await exports.mailer.verify();
        console.log('✅ SMTP configurado e funcionando');
    }
    catch (error) {
        console.error('❌ SMTP FALHOU:', error?.message || error);
        console.error('Verifique SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS no .env');
        if (process.env.NODE_ENV === 'production') {
            throw new Error('SMTP obrigatório em produção');
        }
    }
}
