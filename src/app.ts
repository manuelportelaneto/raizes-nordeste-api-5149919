import express from 'express';
import cors from 'cors';

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

export { app };