import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../../infrastructure/database/prisma';

// Schema de validação para o login
const loginSchema = z.object({
    email: z.string().email('Formato de e-mail inválido.'),
    senha: z.string().min(6, 'A senha deve conter no mínimo 6 caracteres.'),
});

// Schema de validação para Cadastro de Usuário (com LGPD)
const cadastroSchema = z.object({
    nome: z.string().min(3, 'O nome deve conter no mínimo 3 caracteres.'),
    email: z.string().email('Formato de e-mail inválido.'),
    senha: z.string().min(6, 'A senha deve conter no mínimo 6 caracteres.'),
    perfil: z.enum(['ADMIN', 'GERENTE', 'ATENDENTE', 'CLIENTE']).default('CLIENTE'),
    consentimentoLGPD: z.boolean().refine((val) => val === true, {
        message: 'O consentimento com os termos da LGPD é obrigatório para cadastro.',
    }),
});

export class AuthController {
    // Método para login POST /auth/login
    async login(req: Request, res: Response, next: NextFunction) {
        try {
            const { email, senha } = loginSchema.parse(req.body);

            const usuario = await prisma.usuario.findUnique({
                where: { email },
            });

            if (!usuario) {
                return res.status(401).json({
                    timestamp: new Date().toISOString(),
                    status: 401,
                    error: 'Unauthoried',
                    mensagem: 'E-mail ou senha inválidos.'
                });
            }

            const senhaValida = await bcrypt.compare(senha, usuario.senhaHash);

            if (!senhaValida) {
                return res.status(401).json({
                    timestamp: new Date().toISOString(),
                    status: 401,
                    error: 'Unauthoried',
                    mensagem: 'E-mail ou senha inválidos.'
                });
            }

            const jwtSecret = process.env.JWT_SECRET ||
                'raizes_nordeste_jwt_secret_super_seguro_2026';

            const token = jwt.sign(
                {
                    id: usuario.id,
                    nome: usuario.nome,
                    email: usuario.email,
                    perfil: usuario.perfil,
                },

                jwtSecret,
                { expiresIn: '8h' }
            );

            return res.status(200).json({
                mensagem: 'Login realizado com sucesso',
                accessToken: token,
                usuario: {
                    id: usuario.id,
                    nome: usuario.nome,
                    email: usuario.email,
                    perfil: usuario.perfil,
                },
            });
        } catch (error) {
            return next(error);
        }
    }

    // Método para Cadastro POST /auth/registro
    async cadastrar(req: Request, res: Response, next: NextFunction) {
        try {
            const dados = cadastroSchema.parse(req.body);

            // Verifica se o email ja existe
            const usuarioExistente = await prisma.usuario.findUnique({
                where: { email: dados.email },
            });

            if (usuarioExistente) {
                return res.status(400).json({
                    timestamp: new Date().toISOString(),
                    status: 400,
                    error: 'Conflict',
                    mensagem: 'Já existe um usuário cadastrado com este e-mail.',
                });
            }

            const salt = await bcrypt.genSalt(10);
            const senhaHash = await bcrypt.hash(dados.senha, salt);

            const novoUsuario = await prisma.usuario.create({
                data: {
                    nome: dados.nome,
                    email: dados.email,
                    senhaHash,
                    perfil: dados.perfil,
                    consentimentoLGPD: dados.consentimentoLGPD,
                    dataConsentimento: new Date(),
                },
                select: {
                    id: true,
                    nome: true,
                    email: true,
                    perfil: true,
                    dataConsentimento: true,
                    criadoEm: true,
                }
            });

            return res.status(201).json({
                mensagem: 'Cadastro realizado com sucesso!',
                usuario: novoUsuario,
            });

        } catch (error) {
            return next(error);
        }

    }

    // Dados do usuário logado via token
    async perfil(req: Request, res: Response) {
        return res.status(200).json({
            usuario: req.usuario,
        });
    }
}