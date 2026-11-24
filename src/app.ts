import express from 'express';
import cors from 'cors';
import { authRoutes } from './api/routes/auth.routes';
import { tratadorErros } from './api/middlewares/error.middleware';

const app = express();

app.use(cors());
app.use(express.json());

// Rota de Healthcheck (Verificação do Sistema)
app.get("/health", (req, res) => {
    return res.status(200).json({
        status: 'UP',
        menssagem: 'API Raízes Nordeste operacional!',
        data: {
            timestamp: new Date().toISOString(),
            versao: '1.0.0'
        }
    });
});

// Rotas da API
app.use(authRoutes);

// Middleware global de erros (SEMPRE após todas as rotas)
app.use(tratadorErros);

export { app };