import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import jwt from 'jsonwebtoken';
// O import do nodemailer foi removido, pois agora usamos a instância injetada.
import { randomBytes, createHash } from 'crypto';

const prisma = new PrismaClient();

interface AuthRequest extends Request {
  user?: { userId: number };
}

// --- Schemas de Validação com Zod ---

const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .email('Formato de e-mail inválido.');

const registerSchema = z.object({
  name: z.string().min(1, 'O nome é obrigatório.').min(3, 'O nome precisa ter no mínimo 3 caracteres.'),
  email: emailSchema,
  password: z.string().min(1, 'A senha é obrigatória.').min(6, 'A senha precisa ter no mínimo 6 caracteres.'),
});

const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'A senha é obrigatória.'),
});

const forgotPasswordSchema = z.object({
  email: emailSchema,
});

const resetPasswordSchema = z.object({
  email: emailSchema,
  token: z.string().trim().min(1, 'Token é obrigatório.'),
  password: z.string().min(6, 'A senha precisa ter no mínimo 6 caracteres.'),
});

// --- Funções do Controller ---

export const registerUser = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { name, email, password } = registerSchema.parse(req.body);
    // Custo do hash vindo do .env, com fallback para 10.
    const rounds = Number(process.env.BCRYPT_SALT_ROUNDS ?? 10);
    const hashedPassword = await bcrypt.hash(password, rounds);

    const user = await prisma.user.create({
      data: { name, email, password: hashedPassword },
    });

    return res.status(201).json({ id: user.id, name: user.name, email: user.email });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: 'Erro de validação.', details: error.issues });
    }
    if (error?.code === 'P2002' && error?.meta?.target?.includes('email')) {
      return res.status(409).json({ message: 'Este e-mail já está em uso.' });
    }
    console.error('Erro no registerUser:', error);
    return res.status(500).json({ message: 'Ocorreu um erro interno no servidor.' });
  }
};

export const loginUser = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { email, password } = loginSchema.parse(req.body);

    // Busca case-insensitive (evita 401 por causa de maiúsculas/minúsculas)
    let user = null as any;
    try {
      user = await prisma.user.findFirst({
        where: { email: { equals: email, mode: 'insensitive' as any } },
      });
    } catch {
      // Fallback para bancos/versões que não suportam "mode"
      user = await prisma.user.findUnique({ where: { email } });
    }

    const isPasswordValid = user ? await bcrypt.compare(password, user.password) : false;
    if (!user || !isPasswordValid) {
      return res.status(401).json({ message: 'E-mail ou senha inválidos.' });
    }

    if (!process.env.JWT_SECRET) {
      console.error('A chave secreta JWT_SECRET não está definida no .env');
      return res.status(500).json({ message: 'Erro de configuração interna do servidor.' });
    }

    const token = jwt.sign({ userId: user.id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '24h' });

    return res.status(200).json({
      token,
      user: { id: user.id, name: user.name, email: user.email },
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: 'Erro de validação.', details: error.issues });
    }
    console.error('Erro no loginUser:', error);
    return res.status(500).json({ message: 'Ocorreu um erro interno no login.' });
  }
};

export const forgotPassword = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { email } = forgotPasswordSchema.parse(req.body);

    // Busca usuário (case-insensitive)
    let user = null as any;
    try {
      user = await prisma.user.findFirst({
        where: { email: { equals: email, mode: 'insensitive' as any } },
      });
    } catch {
      user = await prisma.user.findUnique({ where: { email } });
    }

    const genericMessage = {
      message: 'Se um usuário com este e-mail existir, um link de recuperação foi enviado.',
    };

    // Resposta genérica (não revela existência)
    if (!user) return res.status(200).json(genericMessage);

    // Gera token e salva HASH + expiração no banco
    const resetToken = randomBytes(32).toString('hex');
    const tokenHash = createHash('sha256').update(resetToken).digest('hex');
    const expires = new Date(Date.now() + 30 * 60 * 1000); // 30 min
    const user = await prisma.user.findUnique({ where: { email } });

    // Resposta genérica para evitar enumeração
    if (!user) {
      return res.status(200).json({ message: "Se um usuário com este e-mail existir, um link de recuperação foi enviado." });
    }

    // Token plano + hash no banco
    const resetToken = randomBytes(32).toString('hex');
    const tokenHash = createHash('sha256').update(resetToken).digest('hex');
    const ttlMin = Number(process.env.PASSWORD_RESET_EXPIRES_MINUTES ?? 30);
    const expires = new Date(Date.now() + ttlMin * 60 * 1000);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordResetToken: tokenHash,
        passwordResetExpires: expires,
      },
    });

    // Monta o link (remove barra final se houver)
    const baseUrl = (process.env.FRONTEND_URL ?? 'http://localhost:5173').replace(/\/$/, '');
    const resetLink = `${baseUrl}/reset-password?token=${encodeURIComponent(resetToken)}&email=${encodeURIComponent(
      user.email
    )}`;

    const smtpUser = process.env.EMAIL_USER;
    const smtpPass = process.env.EMAIL_PASS;

    if (!smtpUser || !smtpPass) {
      console.error('EMAIL_USER/EMAIL_PASS ausentes no .env');
      if (process.env.NODE_ENV !== 'production') {
        console.log('RESET LINK (fallback dev):', resetLink);
        return res.status(200).json(genericMessage);
      }
      return res.status(500).json({ message: 'Configuração de e-mail ausente.' });
    }

    // Helper p/ Gmail (tenta 465 → fallback 587)
    const makeTransport = (secure: boolean) =>
      nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: secure ? 465 : 587,
        secure,
        auth: { user: smtpUser, pass: smtpPass },
      });

    let transporter = makeTransport(true);
    try {
      await transporter.verify();
      console.log('SMTP (465/TLS) verificado com sucesso');
    } catch (e) {
      console.warn('465/TLS falhou, tentando 587/STARTTLS...', (e as any)?.code || (e as any)?.message);
      transporter = makeTransport(false);
      await transporter.verify();
      console.log('SMTP (587/STARTTLS) verificado com sucesso');
    }

    const info = await transporter.sendMail({
      from: `"Seu App" <${smtpUser}>`,

    // Link do front (path confirmado: /reset-password)
    const baseUrl = (process.env.FRONTEND_URL ?? 'http://localhost:5173').replace(/\/$/, '');
    const resetPath = '/reset-password';
    const resetLink = `${baseUrl}${resetPath}?token=${encodeURIComponent(resetToken)}&email=${encodeURIComponent(user.email)}`;

    // Envia e-mail com o mailer injetado na aplicação
    const mailer = req.app.get('mailer');
    await mailer.sendMail({
      from: process.env.SMTP_FROM, // Remetente vindo do .env
      to: user.email,
      subject: 'Recuperação de Senha',
      html: `
        <h1>Recuperação de Senha</h1>
        <p>Olá, ${user.name}!</p>
        <p>Clique no link para redefinir sua senha (expira em ${ttlMin} minutos):</p>
        <p><a href="${resetLink}" target="_blank" rel="noopener noreferrer">${resetLink}</a></p>
        <p>Se você não solicitou isso, ignore este e-mail.</p>
      `,
    });

    console.log('Resultado do envio de e-mail:', {
      messageId: info.messageId,
      accepted: info.accepted,
      rejected: info.rejected,
      response: info.response,
    });

    if (!info.accepted || info.accepted.length === 0) {
      console.warn('Servidor SMTP recusou o envio', info);
      if (process.env.NODE_ENV !== 'production') {
        console.log('RESET LINK (fallback dev):', resetLink);
        return res.status(200).json(genericMessage);
      }
      return res.status(502).json({ message: 'Servidor de e-mail recusou o envio.' });
    }

    return res.status(200).json(genericMessage);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: 'Erro de validação.', details: error.issues });
    }
    console.error('Erro ao enviar e-mail de recuperação:', error);
    return res.status(500).json({ message: 'Ocorreu um erro interno.' });
  }
};

export const resetPassword = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { email, token, password } = resetPasswordSchema.parse(req.body);

    const tokenHash = createHash('sha256').update(token.trim()).digest('hex');

    // Valida e-mail + token + expiração numa consulta
    const user = await prisma.user.findFirst({
      where: {
        email,
        passwordResetToken: tokenHash,
        passwordResetExpires: { gt: new Date() },
      },
    });

    if (!user) {
      return res.status(400).json({ message: 'Token inválido ou expirado.' });
    if (user.passwordResetExpires.getTime() < Date.now()) {
      return res.status(400).json({ message: 'Token expirado.' });
    }

    const tokenHash = createHash('sha256').update(token).digest('hex');
    if (tokenHash !== user.passwordResetToken) {
      return res.status(400).json({ message: 'Token inválido.' });
    }
    
    // Custo do hash vindo do .env, com fallback para 10.
    const rounds = Number(process.env.BCRYPT_SALT_ROUNDS ?? 10);
    const hashedPassword = await bcrypt.hash(password, rounds);

    const hashedPassword = await bcrypt.hash(password, 10);
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        passwordResetToken: null,
        passwordResetExpires: null,
      },
    });

    return res.status(200).json({ message: 'Senha redefinida com sucesso.' });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: 'Erro de validação.', details: error.issues });
    }
    console.error('Erro no resetPassword:', error);
    return res.status(500).json({ message: 'Ocorreu um erro interno.' });
  }
};

export const getUserProfile = async (req: AuthRequest, res: Response): Promise<Response> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ message: 'Não autorizado, ID do usuário não encontrado no token.' });
    }
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true, createdAt: true },
    });
    if (!user) return res.status(404).json({ message: 'Usuário não encontrado.' });
    return res.status(200).json(user);
  } catch (error) {
    console.error('Erro no getUserProfile:', error);
    return res.status(500).json({ message: 'Erro interno no servidor.' });
  }
};