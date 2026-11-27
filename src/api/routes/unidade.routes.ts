import { Router } from 'express';
import { UnidadeController } from '../controllers/unidade.controller';

const unidadeRoutes = Router();
const unidadeController = new UnidadeController();

// Listar todas as unidades
unidadeRoutes.get('/unidades', (req, res, next) => unidadeController.listar(req, res, next));

export { unidadeRoutes };