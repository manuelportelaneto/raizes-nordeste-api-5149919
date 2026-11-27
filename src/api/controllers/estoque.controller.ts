import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { prisma } from '../../infrastructure/database/prisma';


const movimentacaoSchema = z.object({
    unidadeId: z.number().int().positive('O ID da unidade deve ser um inteiro positivo.'),
    produtoId: z.number().int().positive('O ID do produto deve ser um inteiro positivo.'),
    tipo: z.enum(['ENTRADA', 'SAIDA']),
    quantidade: z.number().int().positive('A quantidade deve ser um inteiro positivo.'),
    data: z.coerce.date().optional(),
    observacao: z.string().optional(),

});

export class EstoqueController {
    // GET /estoque/unidade/:unidadeID
    async consultarPorUnidade(req: Request, res: Response, next: NextFunction) {
        try {
            const unidadeId = Number(req.params.unidadeId);

            if (isNaN(unidadeId)) {
                return res.status(400).json({
                    timestamp: new Date().toISOString(),
                    status: 400,
                    error: 'Bad Request',
                    mensagem: 'ID de unidade inválido.'
                });
            }

            const unidade = await prisma.unidade.findUnique({
                where: { id: unidadeId },
            });

            if (!unidade) {
                return res.status(404).json({
                    timestamp: new Date().toISOString(),
                    status: 404,
                    error: 'Not Found',
                    mensagem: `Unidade com ID ${unidadeId} não encontrada.`,
                });
            }

            const estoques = await prisma.estoqueUnidade.findMany({
                where: { unidadeId },
                include: {
                    produto: {
                        select: {
                            id: true,
                            nome: true,
                            preco: true,
                            categoria: true,
                        },
                    },
                },
            });

            return res.status(200).json({
                unidade: unidade.nomeFantasia,
                totalItens: estoques.length,
                estoques: estoques.map((e) => {
                    const quantidade = e.quantidade;
                    const indisponivel = e.indisponivel || quantidade <= 0;
                    const baixoEstoque = quantidade > 0 && quantidade <= 10;

                    return {
                        produtoid: e.produtoId,
                        nome: e.produto.nome,
                        preco: e.produto.preco,
                        categoria: e.produto.categoria,
                        quantidadeDisponivel: e.quantidade,
                        indisponivel, // true se quantidade for 0 ou menor
                        baixoEstoque, // true se quantidade for entre 1 e 10 unidades (alerta para o restaurante!)
                        atualizadoEm: e.atualizadoEm.toISOString(), // Data da última atualização
                    };
                }),
            });

        } catch (error) {
            next(error);
        }
    }

    // POST /estoque/movimentação (Entrada/Saída de mercadorias)
    async movimentar(req: Request, res: Response, next: NextFunction) {
        try {
            const dados = movimentacaoSchema.parse(req.body);
            const estoqueAtual = await prisma.estoqueUnidade.findUnique({
                where: {
                    produtoId_unidadeId: {
                        produtoId: dados.produtoId,
                        unidadeId: dados.unidadeId,
                    },
                },
            });

            if (!estoqueAtual) {
                return res.status(404).json({
                    timestamp: new Date().toISOString(),
                    status: 404,
                    error: 'Not Found',
                    mensagem: 'Registro de estoque não encontrado para este produto nesta unidade.',
                });
            }

            let novaQuantidade = estoqueAtual.quantidade;

            if (dados.tipo === 'ENTRADA') {
                novaQuantidade += dados.quantidade;
            } else {
                if (estoqueAtual.quantidade < dados.quantidade) {
                    return res.status(409).json({
                        timestamp: new Date().toISOString(),
                        status: 409,
                        error: 'Conflict',
                        mensagem: `Estoque insuficiente para saída. Saldo atual: ${estoqueAtual.quantidade}, solicitado: ${dados.quantidade}`,
                    });
                }
                novaQuantidade -= dados.quantidade;
            }

            const estoqueAtualizado = await prisma.estoqueUnidade.update({
                where: {
                    id: estoqueAtual.id
                },
                data: {
                    quantidade: novaQuantidade,
                    indisponivel: novaQuantidade <= 0,
                },
            });

            // Registro de Auditoria (LGPD / Rastreabilidade)
            await prisma.logAuditoria.create({
                data: {
                    usuarioId: req.usuario?.id,  // Supondo autenticação JWT
                    acao: 'MOVIMENTACAO_ESTOQUE',
                    entidade: 'EstoqueUnidade',
                    entidadeId: estoqueAtual.id,
                    detalhes: `Movimentação ${dados.tipo} de ${dados.quantidade} un. Novo saldo: ${novaQuantidade}.`,
                },
            });

            return res.status(200).json({
                mensagem: 'Estoque atualizado com sucesso!',
                saldoAnterior: estoqueAtual.quantidade,
                novoSaldo: estoqueAtualizado.quantidade,
                indisponivel: estoqueAtualizado.indisponivel,
            });
        } catch (error) {
            return next(error);
        }
    }
}