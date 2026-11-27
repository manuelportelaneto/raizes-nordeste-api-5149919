import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';

export function tratadorErros(
    erro: Error,
    req: Request,
    res: Response,
    next: NextFunction
) {
    const timestamp = new Date().toISOString();

    //Erros de validação do Zod
    if (erro instanceof ZodError) {
        return res.status(400).json({
            timestamp,
            status: 400,
            error: 'Bad Request',
            message: 'Falha na validação dos dados enviados.',
            detalhes: erro.issues.map((e) => ({
                campo: e.path.join('.'),
                mensagem: e.message,
            })),
        });
    }

    // Erros genéricos de regra de negócio ou servidor
    console.error('Erro inesperado: ', erro);

    return res.status(500).json({
        timestamp,
        status: 500,
        error: 'Internal Server Error',
        mensagem: erro.message || 'Erro inesperado no servidor.',
    });
}