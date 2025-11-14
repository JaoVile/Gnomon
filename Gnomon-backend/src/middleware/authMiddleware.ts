import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// Estende o tipo Request para incluir user
interface AuthRequest extends Request {
  user?: {
    userId: number;
    email: string;
    role: string;
  };
}

/**
 * Middleware de autenticação JWT
 * Valida o token Bearer e anexa os dados do usuário em req.user
 */
export function authMiddleware(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Response | void {
  try {
    const authHeader = req.headers.authorization;

    // Verifica se o header Authorization existe e tem formato correto
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Token de autenticação não fornecido.' });
    }

    // Extrai o token
    const token = authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ message: 'Token inválido.' });
    }

    // Verifica se JWT_SECRET está configurado
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      console.error('JWT_SECRET não configurado no .env');
      return res.status(500).json({ message: 'Erro de configuração do servidor.' });
    }

    // Verifica e decodifica o token
    const decoded = jwt.verify(token, secret);

    // Valida o payload do token
    if (
      typeof decoded === 'object' &&
      decoded !== null &&
      'userId' in decoded &&
      'email' in decoded &&
      'role' in decoded
    ) {
      // Anexa os dados do usuário na request
      req.user = {
        userId: decoded.userId as number,
        email: decoded.email as string,
        role: decoded.role as string,
      };

      return next();
    } else {
      return res.status(401).json({ message: 'Token com formato inválido.' });
    }
  } catch (error: any) {
    // Trata erros específicos do JWT
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expirado.' });
    }
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Token inválido.' });
    }

    console.error('Erro no middleware de autenticação:', error);
    return res.status(401).json({ message: 'Falha na autenticação.' });
  }
}

/**
 * Middleware para verificar se o usuário é ADMIN
 * DEVE ser usado APÓS o authMiddleware
 */
export function requireAdmin(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Response | void {
  if (!req.user) {
    return res.status(401).json({ message: 'Não autenticado.' });
  }

  if (req.user.role !== 'ADMIN') {
    return res.status(403).json({ message: 'Acesso negado. Apenas administradores.' });
  }

  return next();
}

/**
 * Middleware para verificar se o usuário é ADMIN ou STAFF
 * DEVE ser usado APÓS o authMiddleware
 */
export function requireStaff(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Response | void {
  if (!req.user) {
    return res.status(401).json({ message: 'Não autenticado.' });
  }

  if (req.user.role !== 'ADMIN' && req.user.role !== 'STAFF') {
    return res.status(403).json({ message: 'Acesso negado.' });
  }

  return next();
}