import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface UsuarioAutenticado {

    id: number;
    nome: string;
    email: string;
    perfil: string;
}

// Extende a tipagem do Express para incluir o usuário na requisição
declare global {
    namespace Express {
        interface Request {
            usuario?: UsuarioAutenticado;
        }
    }
}

// Middleware para verificar se o usuário está logado
export function autenticarToken(req: Request, res: Response, next: NextFunction) {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        return res.status(401).json({
            timestamp: new Date().toISOString(),
            status: 401,
            error: 'Unauthorized',
            message: 'Token não fornecido'
        });
    }

    const [, token] = authHeader.split(' ');

    if (!token) {
        return res.status(401).json({
            timestamp: new Date().toISOString(),
            status: 401,
            error: 'Unauthorized',
            message: 'Formato de token inválido. Esperado: Bearer <token>',
        });
    }

    const jwtSecret = process.env.JWT_SECRET || 'raiz-nordeste-jwt-secret_super_seguro_2026';

    try {
        const payload = jwt.verify(token, jwtSecret) as UsuarioAutenticado;
        req.usuario = payload;
        return next();
    }
    catch (error) {
        return res.status(401).json({
            timestamp: new Date().toISOString(),
            status: 401,
            error: 'Unauthorized',
            message: 'Token inválido'
        });
    }
}

// Middleware para autorização baseada em papéis (RBAC: ADMIN, GERENTE, etc.)
export function autorizarPerfis(perfisPermitidos: string[]) {
    return (req: Request, res: Response, next: NextFunction) => {
        if (!req.usuario) {
            return res.status(401).json({
                timestamp: new Date().toISOString(),
                status: 401,
                error: 'Unauthorized',
                menssagem: 'Usuário não autenticado'
            });
        }

        if (!perfisPermitidos.includes(req.usuario.perfil)) {
            return res.status(403).json({
                timestamp: new Date().toISOString(),
                status: 403,
                error: 'Forbidden',
                menssagem: `Acesso negado. Perfil '${req.usuario.perfil}' não tem permissão para este recurso.`,
            });
        }

        return next();
    };
}  