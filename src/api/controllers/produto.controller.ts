import { Request, Response, NextFunction } from "express";
import { prisma } from '../../infrastructure/database/prisma';

export class ProdutoController {

    // GET /produtos?categoria=CUSCUZ
    async listar(req: Request, res: Response, next: NextFunction) {
        try {
            const { categoria } = req.query;
            const whereClause: any = { ativo: true };

            if (categoria && typeof categoria === 'string') {
                whereClause.categoria = categoria.toUpperCase();
            }

            const produtos = await prisma.produto.findMany({
                where: whereClause,
                orderBy: { nome: 'asc' },
            });

            return res.status(200).json({
                total: produtos.length,
                produtos,
            });
        } catch (error) {
            return next(error);
        }
    }
}