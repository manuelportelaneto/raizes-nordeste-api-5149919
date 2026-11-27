import { Router } from 'express';
import { EstoqueController } from '../controllers/estoque.controller';
import { autenticarToken, autorizarPerfis } from '../middlewares/auth.middleware';

const estoqueRoutes = Router();
const estoqueController = new EstoqueController();

// Consulta pública ou autenticada de estoque por unidade
estoqueRoutes.get('/estoque/unidade/:unidadeId', (req, res, next) =>
    estoqueController.consultarPorUnidade(req, res, next)
);

// Movimentação manual de estoque protegida para ADMIN e GERENTE
estoqueRoutes.post(
    '/estoque/movimentacao',
    autenticarToken,
    autorizarPerfis(['ADMIN', 'GERENTE']),
    (req, res, next) => estoqueController.movimentar(req, res, next)
);

export { estoqueRoutes };
