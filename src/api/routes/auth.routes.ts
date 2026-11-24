import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { autenticarToken } from '../middlewares/auth.middleware';

const authRoutes = Router();
const authController = new AuthController();

// Rota de login público
authRoutes.post('/auth/login', (req, res, next) => authController.login(req, res, next,

));

// Rota de cadastro público com consentimento LGPD
authRoutes.post('/usuarios', (req, res, next) => authController.cadastrar(req, res, next,

));

// Rota protegida para consultar o próprio perfil logado
authRoutes.get('/auth/me', autenticarToken, (req, res) =>
    authController.perfil(req, res,)

);

// Exporta as rotas
export { authRoutes };