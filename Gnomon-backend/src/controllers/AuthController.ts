import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import jwt from 'jsonwebtoken';
import { randomBytes, createHash } from 'crypto';

const prisma = new PrismaClient();

interface AuthRequest extends Request {
  user?: { userId: number; role: string; email: string };
}

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email('E-mail inválido.'),
  password: z.string().min(1, 'Senha obrigatória.'),
});

const forgotPasswordSchema = z.object({
  email: z.string().trim().toLowerCase().email('E-mail inválido.'),
});

const resetPasswordSchema = z.object({
  email: z.string().trim().toLowerCase().email('E-mail inválido.'),
  token: z.string().trim().min(1, 'Token obrigatório.'),
  password: z.string().min(6, 'Senha precisa ter no mínimo 6 caracteres.'),
});

const registerStaffSchema = z.object({
  name: z.string().trim().min(1, 'Nome é obrigatório.'),
  email: z.string().trim().toLowerCase().email('E-mail inválido.'),
  password: z.string().min(6, 'Senha precisa ter no mínimo 6 caracteres.'),
  role: z.enum(['STAFF', 'ADMIN']).default('STAFF'), // Default to STAFF, can be ADMIN if explicitly set by an ADMIN
});

export const loginUser = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { email, password } = loginSchema.parse(req.body);

    const admin = await prisma.admin.findUnique({ where: { email } });
    
    if (!admin || !admin.isActive) {
      return res.status(401).json({ message: 'E-mail ou senha inválidos.' });
    }

    const isPasswordValid = await bcrypt.compare(password, admin.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'E-mail ou senha inválidos.' });
    }

    if (!process.env.JWT_SECRET) {
      console.error('JWT_SECRET não definido');
      return res.status(500).json({ message: 'Erro de configuração.' });
    }

    const token = jwt.sign(
      { userId: admin.id, email: admin.email, role: admin.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    return res.status(200).json({
      token,
      user: { id: admin.id, name: admin.name, email: admin.email, role: admin.role },
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: 'Erro de validação.', details: error.issues });
    }
    console.error('Erro no login:', error);
    return res.status(500).json({ message: 'Erro interno.' });
  }
};

export const forgotPassword = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { email } = forgotPasswordSchema.parse(req.body);

    const admin = await prisma.admin.findUnique({ where: { email } });

    const genericMessage = {
      message: 'Se um usuário com este e-mail existir, um link de recuperação foi enviado.',
    };

    if (!admin || !admin.isActive) {
      return res.status(200).json(genericMessage);
    }

    const resetToken = randomBytes(32).toString('hex');
    const tokenHash = createHash('sha256').update(resetToken).digest('hex');
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
    } catch (emailError: any) {
      console.error('❌ Erro ao enviar e-mail:', emailError);
      
      if (process.env.NODE_ENV !== 'production') {
        console.log('🔗 RESET LINK (dev):', resetLink);
        return res.status(200).json(genericMessage);
      }
      
      return res.status(502).json({ message: 'Erro ao enviar e-mail.' });
    }

    return res.status(200).json(genericMessage);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: 'Erro de validação.', details: error.issues });
    }
    console.error('Erro ao processar recuperação:', error);
    return res.status(500).json({ message: 'Erro interno.' });
  }
};

export const resetPassword = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { email, token, password } = resetPasswordSchema.parse(req.body);

    const tokenHash = createHash('sha256').update(token.trim()).digest('hex');

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
    const hashedPassword = await bcrypt.hash(password, rounds);

    await prisma.admin.update({
      where: { id: admin.id },
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
    return res.status(500).json({ message: 'Erro interno.' });
  }
};

export const getUserProfile = async (req: AuthRequest, res: Response): Promise<Response> => {
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
  } catch (error) {
    console.error('Erro no getUserProfile:', error);
    return res.status(500).json({ message: 'Erro interno.' });
  }
};

export const registerStaff = async (req: AuthRequest, res: Response): Promise<Response> => {
  try {
    // Check if the requesting user has permission to register staff
    if (!req.user || (req.user.role !== 'ADMIN' && req.user.role !== 'STAFF')) {
      return res.status(403).json({ message: 'Acesso negado. Você não tem permissão para cadastrar funcionários.' });
    }

    const { name, email, password, role } = registerStaffSchema.parse(req.body);

    // Only ADMIN can register other ADMINs
    if (role === 'ADMIN' && req.user.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Acesso negado. Somente administradores podem cadastrar outros administradores.' });
    }

    // Check if user already exists
    const existingAdmin = await prisma.admin.findUnique({ where: { email } });
    if (existingAdmin) {
      return res.status(409).json({ message: 'Já existe um funcionário com este e-mail.' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newStaff = await prisma.admin.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role,
        isActive: true,
      },
    });

    return res.status(201).json({
      message: 'Funcionário cadastrado com sucesso!',
      user: { id: newStaff.id, name: newStaff.name, email: newStaff.email, role: newStaff.role },
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: 'Erro de validação.', details: error.issues });
    }
    console.error('Erro no registerStaff:', error);
    return res.status(500).json({ message: 'Erro interno.' });
  }
};