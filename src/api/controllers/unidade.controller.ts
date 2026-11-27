import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../infrastructure/database/prisma';

export class UnidadeController {

    // GET /unidades
    async listar(req: Request, res: Response, next: NextFunction) {
        try {
            const unidades = await prisma.unidade.findMany({
                orderBy: { nomeFantasia: 'asc' },
            });

            return res.status(200).json({
                total: unidades.length,
                unidades,
            })

        } catch (error) {
            return next(error);

        }
    }

}