"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUserProfile = exports.resetPassword = exports.forgotPassword = exports.loginUser = void 0;
const client_1 = require("@prisma/client");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const zod_1 = require("zod");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const crypto_1 = require("crypto");
const prisma = new client_1.PrismaClient();
const loginSchema = zod_1.z.object({
    email: zod_1.z.string().trim().toLowerCase().email('E-mail inválido.'),
    password: zod_1.z.string().min(1, 'Senha obrigatória.'),
});
const forgotPasswordSchema = zod_1.z.object({
    email: zod_1.z.string().trim().toLowerCase().email('E-mail inválido.'),
});
const resetPasswordSchema = zod_1.z.object({
    email: zod_1.z.string().trim().toLowerCase().email('E-mail inválido.'),
    token: zod_1.z.string().trim().min(1, 'Token obrigatório.'),
    password: zod_1.z.string().min(6, 'Senha precisa ter no mínimo 6 caracteres.'),
});
const loginUser = async (req, res) => {
    try {
        const { email, password } = loginSchema.parse(req.body);
        const admin = await prisma.admin.findUnique({ where: { email } });
        if (!admin || !admin.isActive) {
            return res.status(401).json({ message: 'E-mail ou senha inválidos.' });
        }
        const isPasswordValid = await bcryptjs_1.default.compare(password, admin.password);
        if (!isPasswordValid) {
            return res.status(401).json({ message: 'E-mail ou senha inválidos.' });
        }
        if (!process.env.JWT_SECRET) {
            console.error('JWT_SECRET não definido');
            return res.status(500).json({ message: 'Erro de configuração.' });
        }
        const token = jsonwebtoken_1.default.sign({ userId: admin.id, email: admin.email, role: admin.role }, process.env.JWT_SECRET, { expiresIn: '24h' });
        return res.status(200).json({
            token,
            user: { id: admin.id, name: admin.name, email: admin.email, role: admin.role },
        });
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            return res.status(400).json({ message: 'Erro de validação.', details: error.issues });
        }
        console.error('Erro no login:', error);
        return res.status(500).json({ message: 'Erro interno.' });
    }
};
exports.loginUser = loginUser;
const forgotPassword = async (req, res) => {
    try {
        const { email } = forgotPasswordSchema.parse(req.body);
        const admin = await prisma.admin.findUnique({ where: { email } });
        const genericMessage = {
            message: 'Se um usuário com este e-mail existir, um link de recuperação foi enviado.',
        };
        if (!admin || !admin.isActive) {
            return res.status(200).json(genericMessage);
        }
        const resetToken = (0, crypto_1.randomBytes)(32).toString('hex');
        const tokenHash = (0, crypto_1.createHash)('sha256').update(resetToken).digest('hex');
        const ttlMin = Number(process.env.PASSWORD_RESET_EXPIRES_MINUTES ?? 30);
        const expires = new Date(Date.now() + ttlMin * 60 * 1000);
        await prisma.admin.update({
            where: { id: admin.id },
            data: {
                passwordResetToken: tokenHash,
                passwordResetExpires: expires,
            },
        });
        const baseUrl = (process.env.FRONTEND_URL ?? 'http://localhost:5173').replace(/\/$/, '');
        const resetLink = `${baseUrl}/reset-password?token=${encodeURIComponent(resetToken)}&email=${encodeURIComponent(admin.email)}`;
        const mailer = req.app.get('mailer');
        if (!mailer) {
            console.error('Mailer não configurado.');
            if (process.env.NODE_ENV !== 'production') {
                console.log('🔗 RESET LINK (dev):', resetLink);
                return res.status(200).json(genericMessage);
            }
            return res.status(500).json({ message: 'Configuração de e-mail ausente.' });
        }
        try {
            await mailer.sendMail({
                from: process.env.SMTP_FROM ?? '"Gnomon" <noreply@gnomon.app>',
                to: admin.email,
                subject: 'Recuperação de Senha - Gnomon',
                html: `
          <h1>Recuperação de Senha</h1>
          <p>Olá, ${admin.name}!</p>
          <p>Clique no link para redefinir sua senha (expira em ${ttlMin} minutos):</p>
          <p><a href="${resetLink}">${resetLink}</a></p>
          <p>Se você não solicitou, ignore este e-mail.</p>
        `,
            });
            console.log('✅ E-mail enviado para:', admin.email);
        }
        catch (emailError) {
            console.error('❌ Erro ao enviar e-mail:', emailError);
            if (process.env.NODE_ENV !== 'production') {
                console.log('🔗 RESET LINK (dev):', resetLink);
                return res.status(200).json(genericMessage);
            }
            return res.status(502).json({ message: 'Erro ao enviar e-mail.' });
        }
        return res.status(200).json(genericMessage);
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            return res.status(400).json({ message: 'Erro de validação.', details: error.issues });
        }
        console.error('Erro ao processar recuperação:', error);
        return res.status(500).json({ message: 'Erro interno.' });
    }
};
exports.forgotPassword = forgotPassword;
const resetPassword = async (req, res) => {
    try {
        const { email, token, password } = resetPasswordSchema.parse(req.body);
        const tokenHash = (0, crypto_1.createHash)('sha256').update(token.trim()).digest('hex');
        const admin = await prisma.admin.findFirst({
            where: {
                email,
                passwordResetToken: tokenHash,
                passwordResetExpires: { gt: new Date() },
                isActive: true,
            },
        });
        if (!admin) {
            return res.status(400).json({ message: 'Token inválido ou expirado.' });
        }
        const rounds = Number(process.env.BCRYPT_SALT_ROUNDS ?? 10);
        const hashedPassword = await bcryptjs_1.default.hash(password, rounds);
        await prisma.admin.update({
            where: { id: admin.id },
            data: {
                password: hashedPassword,
                passwordResetToken: null,
                passwordResetExpires: null,
            },
        });
        return res.status(200).json({ message: 'Senha redefinida com sucesso.' });
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            return res.status(400).json({ message: 'Erro de validação.', details: error.issues });
        }
        console.error('Erro no resetPassword:', error);
        return res.status(500).json({ message: 'Erro interno.' });
    }
};
exports.resetPassword = resetPassword;
const getUserProfile = async (req, res) => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            return res.status(401).json({ message: 'Não autorizado.' });
        }
        const admin = await prisma.admin.findUnique({
            where: { id: userId },
            select: { id: true, name: true, email: true, role: true, isActive: true, createdAt: true },
        });
        if (!admin || !admin.isActive) {
            return res.status(404).json({ message: 'Usuário não encontrado.' });
        }
        return res.status(200).json(admin);
    }
    catch (error) {
        console.error('Erro no getUserProfile:', error);
        return res.status(500).json({ message: 'Erro interno.' });
    }
};
exports.getUserProfile = getUserProfile;
