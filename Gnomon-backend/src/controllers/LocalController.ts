import { Request, Response } from 'express';
import { PrismaClient, LocalType, Prisma } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();

// ✅ Schema de validação com enum correto
const localSchema = z.object({
  name: z.string().min(1, "O nome do local é obrigatório."),
  description: z.string().optional().nullable(),
  code: z.string().optional().nullable(),
  type: z.nativeEnum(LocalType),
  x: z.number(),
  y: z.number(),
  z: z.number().optional().default(0),
  floor: z.number().int().default(0),
  building: z.string().optional().nullable(),
  iconUrl: z.string().url("URL do ícone inválida.").optional().nullable(),
  imageUrl: z.string().url("URL da imagem inválida.").optional().nullable(),
  accessible: z.boolean().default(true),
  mapId: z.number().int("O ID do mapa deve ser um número inteiro."),
});

/**
 * GET /api/locals
 */
export const getAllLocais = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { type, floor, building, search, accessible } = req.query;

    // ✅ Usar Prisma.LocalWhereInput para tipagem correta
    const where: Prisma.LocalWhereInput = { isActive: true };

    if (type && Object.values(LocalType).includes(type as LocalType)) {
      where.type = type as LocalType;
    }
    
    if (floor) {
      where.floor = Number(floor);
    }
    
    if (building) {
      where.building = String(building);
    }
    
    if (accessible !== undefined) {
      where.accessible = accessible === 'true';
    }
    
    if (search) {
      where.OR = [
        { name: { contains: String(search), mode: 'insensitive' } },
        { code: { contains: String(search), mode: 'insensitive' } },
      ];
    }

    const locais = await prisma.local.findMany({
      where,
      include: { map: true },
      orderBy: { name: 'asc' },
    });

    return res.status(200).json(locais);
  } catch (error) {
    console.error('Erro ao buscar locais:', error);
    return res.status(500).json({ message: 'Erro ao buscar locais.' });
  }
};

/**
 * GET /api/locals/:id
 */
export const getLocalById = async (req: Request, res: Response): Promise<Response> => {
  const { id } = req.params;
  
  try {
    const local = await prisma.local.findUnique({
      where: { id: Number(id) },
      include: { map: true },
    });

    if (!local) {
      return res.status(404).json({ message: 'Local não encontrado.' });
    }

    return res.status(200).json(local);
  } catch (error) {
    console.error('Erro ao buscar local:', error);
    return res.status(500).json({ message: 'Erro ao buscar local.' });
  }
};

/**
 * POST /api/locals
 */
export const createLocal = async (req: Request, res: Response): Promise<Response> => {
  try {
    // ✅ Validar com Zod
    const validatedData = localSchema.parse(req.body);

    // ✅ Criar com tipo explícito do Prisma
    const data: Prisma.LocalCreateInput = {
      name: validatedData.name,
      description: validatedData.description ?? null,
      code: validatedData.code ?? null,
      type: validatedData.type,
      x: validatedData.x,
      y: validatedData.y,
      z: validatedData.z ?? 0,
      floor: validatedData.floor ?? 0,
      building: validatedData.building ?? null,
      iconUrl: validatedData.iconUrl ?? null,
      imageUrl: validatedData.imageUrl ?? null,
      accessible: validatedData.accessible ?? true,
      map: {
        connect: { id: validatedData.mapId }
      }
    };

    const newLocal = await prisma.local.create({
      data,
      include: { map: true },
    });

    return res.status(201).json(newLocal);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        message: 'Dados inválidos.', 
        details: error.issues 
      });
    }
    
    console.error('Erro ao criar local:', error);
    return res.status(500).json({ message: 'Erro ao criar local.' });
  }
};

/**
 * PUT /api/locals/:id
 */
export const updateLocal = async (req: Request, res: Response): Promise<Response> => {
  const { id } = req.params;
  
  try {
    // ✅ Validar com schema parcial
    const validatedData = localSchema.partial().parse(req.body);

    // ✅ Construir data com tipo explícito
    const data: Prisma.LocalUpdateInput = {};

    if (validatedData.name !== undefined) data.name = validatedData.name;
    if (validatedData.description !== undefined) data.description = validatedData.description;
    if (validatedData.code !== undefined) data.code = validatedData.code;
    if (validatedData.type !== undefined) data.type = validatedData.type;
    if (validatedData.x !== undefined) data.x = validatedData.x;
    if (validatedData.y !== undefined) data.y = validatedData.y;
    if (validatedData.z !== undefined) data.z = validatedData.z;
    if (validatedData.floor !== undefined) data.floor = validatedData.floor;
    if (validatedData.building !== undefined) data.building = validatedData.building;
    if (validatedData.iconUrl !== undefined) data.iconUrl = validatedData.iconUrl;
    if (validatedData.imageUrl !== undefined) data.imageUrl = validatedData.imageUrl;
    if (validatedData.accessible !== undefined) data.accessible = validatedData.accessible;
    
    // ✅ MapId usa connect, não valor direto
    if (validatedData.mapId !== undefined) {
      data.map = { connect: { id: validatedData.mapId } };
    }

    const updated = await prisma.local.update({
      where: { id: Number(id) },
      data,
      include: { map: true },
    });

    return res.status(200).json(updated);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        message: 'Dados inválidos.', 
        details: error.issues 
      });
    }
    
    console.error('Erro ao atualizar local:', error);
    return res.status(500).json({ message: 'Erro ao atualizar local.' });
  }
};

/**
 * DELETE /api/locals/:id
 */
export const deleteLocal = async (req: Request, res: Response): Promise<Response> => {
  const { id } = req.params;
  
  try {
    await prisma.local.delete({
      where: { id: Number(id) },
    });

    return res.status(204).send();
  } catch (error) {
    console.error('Erro ao deletar local:', error);
    return res.status(500).json({ message: 'Erro ao deletar local.' });
  }
};