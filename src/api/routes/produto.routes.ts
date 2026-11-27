import { Router } from "express";
import { ProdutoController } from "../controllers/produto.controller";


const produtoRoutes = Router();
const produtoController = new ProdutoController();

// Listar produtos do cardápio
produtoRoutes.get('/produtos', (req, res, next) => produtoController.listar(req, res, next));

export { produtoRoutes };