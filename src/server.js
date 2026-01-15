import express from "express";
import { config } from "dotenv";
import cors from "cors"; // Importa o middleware CORS

import router from "./routes/index.routes.js";

config(); // Carrega variáveis de ambiente do arquivo .env
const port = process.env.PORT || 3000; // Define a porta do servidor

// Inicializa o Express
const app = express();

// Middlewares
app.use(cors({
  origin: '*', // Em produção, especificar domínios permitidos
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rotas
app.use("/api", router)

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    error: 'Algo deu errado!',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Rota não encontrada'
  });
});

// Iniciar o servidor
app.listen(port, () => {
  console.log(`🚀 Antera Chat API rodando na porta ${port}`);
  console.log(`📍 http://localhost:${port}/api`);
  console.log(`🌱 Ambiente: ${process.env.NODE_ENV || 'development'}`);
});
