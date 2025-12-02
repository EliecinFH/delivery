const { Client, LocalAuth } = require("whatsapp-web.js");
const express = require("express");
const mongoose = require("mongoose");
const helmet = require("helmet");
const path = require("path");
const qrcode = require("qrcode");
const cors = require("cors");
const compression = require("compression");
require("dotenv").config();

// Importações
const connectDB = require("./config/database");
const logger = require("./utils/logger");
const messageHandler = require("./services/messageHandler");
const printService = require("./services/printService");
const config = require("./config/config");

// Importar modelos
const Conversation = require("./models/Conversation");
const PedidoRestaurante = require("./models/PedidoRestaurante");
const Mesa = require("./models/Mesa");
const Produto = require("./models/Produto");

// Conectar ao banco de dados
connectDB();

// Configuração do cliente WhatsApp
global.client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        headless: "new",
        args: [
            "--no-sandbox",
            "--disable-setuid-sandbox",
            "--disable-dev-shm-usage",
            "--disable-accelerated-2d-canvas",
            "--no-first-run",
            "--no-zygote",
            "--disable-gpu",
        ],
    },
});

// Variáveis para gerenciar QR Code
global.currentQRCode = null;
global.qrCodeListeners = [];

// Evento de QR Code
global.client.on("qr", (qrCode) => {
    console.log("📱 QR Code gerado");
    
    if (global.currentQRCode !== qrCode) {
        global.currentQRCode = qrCode;
        console.log("🚀 Novo QR Code gerado - Verifique a interface web para escaneá-lo");
        
        if (global.qrCodeListeners && global.qrCodeListeners.length > 0) {
            global.qrCodeListeners.forEach((listener) => {
                try {
                    listener(qrCode);
                } catch (err) {
                    console.error("Erro ao notificar listener:", err.message);
                }
            });
        }
    }
});

global.client.on("ready", () => {
    console.clear();
    console.log("✅ WhatsApp conectado com sucesso!");
    console.log("🍽️ Bot do restaurante está pronto para receber pedidos!");
    
    global.currentQRCode = null;
    global.isInitialized = true;
    global.isInitializing = false;
    
    if (global.client) {
        global.client.isConnected = true;
        console.log("Status de conexão: conectado");
    }
});

global.client.on("authenticated", () => {
    console.log("🔐 WhatsApp autenticado com sucesso!");
    
    if (global.client) {
        global.client.isConnected = true;
    }
});

global.client.on("auth_failure", (msg) => {
    console.log("❌ Falha na autenticação:", msg);
    global.isInitialized = false;
    global.isInitializing = false;
    
    if (global.client) {
        global.client.isConnected = false;
    }
});

global.client.on("disconnected", (reason) => {
    console.log("❌ WhatsApp desconectado:", reason);
    global.isInitialized = false;
    global.isInitializing = false;
    
    if (global.client) {
        global.client.isConnected = false;
    }
    
    setTimeout(() => {
        if (global.client && !global.client.isConnected && !global.isInitializing) {
            console.log("Tentando reconectar...");
            initializeWhatsApp();
        }
    }, 5000);
});

// Inicialização do WhatsApp
global.isInitializing = false;
global.initializationAttempts = 0;
global.isInitialized = false;

async function initializeWhatsApp() {
    if (global.isInitializing) {
        console.log("⏳ Bot já está sendo inicializado, aguardando...");
        return;
    }
    
    if (global.client) {
        try {
            if (global.client.isConnected === true) {
                console.log("✅ Bot já está conectado!");
                global.isInitialized = true;
                global.isInitializing = false;
                return;
            }
        } catch (err) {
            console.log("⚠️ Erro ao verificar status:", err.message);
        }
    }
    
    try {
        global.isInitializing = true;
        global.initializationAttempts++;
        console.log(`🚀 Iniciando WhatsApp Bot... Tentativa ${global.initializationAttempts}`);
        
        await global.client.initialize();
        console.log("✅ Bot inicializado com sucesso!");
        global.isInitialized = true;
        global.initializationAttempts = 0;
        global.isInitializing = false;
    } catch (error) {
        console.error(`❌ Erro na inicialização:`, error.message);
        global.isInitializing = false;
        setTimeout(() => {
            if (global.client && global.client.isConnected !== true) {
                console.log("🔄 Tentando novamente em 10 segundos...");
                initializeWhatsApp();
            }
        }, 10000);
    }
}

// Evento de mensagem
global.client.on("message", async (message) => {
    // Ignorar mensagens de grupo
    if (message.from.includes('@g.us')) return;

    try {
        await messageHandler.handleMessage(message, global.client);
    } catch (error) {
        logger.error('Erro ao processar mensagem:', error);
        await message.reply('Desculpe, ocorreu um erro. Por favor, tente novamente.');
    }
});

// Inicializar WhatsApp
console.log("🚀 Iniciando sistema de restaurante e delivery...");
console.log("📱 Preparando para inicializar WhatsApp Bot...");
initializeWhatsApp();

// Configuração do Express
const app = express();

// Middlewares
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'", "'unsafe-inline'"],
            imgSrc: ["'self'", "data:", "https:"],
        },
    },
}));
app.use(cors());
app.use(compression());
app.use(express.json({ limit: "10mb" }));

// Servir arquivos estáticos
app.use(express.static(path.join(__dirname, '../public')));

// Rotas da API
app.use("/api/mesas", require("./routes/mesaRoutes"));
app.use("/api/pedidos", require("./routes/pedidoRoutes"));
app.use("/api/produtos", require("./routes/produtoRoutes"));
app.use("/api/impressao", require("./routes/impressaoRoutes"));

// Rota para verificar status do sistema
app.get("/status", (req, res) => {
    try {
        if (!global.client) {
            return res.json({
                success: true,
                botStatus: 'nao_inicializado',
                hasQR: false,
                isInitializing: false,
                timestamp: new Date().toISOString(),
                system: 'operacional'
            });
        }

        let isConnected = false;
        let isInitializing = false;
        
        try {
            isConnected = global.client.isConnected === true;
        } catch (err) {
            console.log('Erro ao verificar status:', err.message);
        }
        
        const hasQR = global.currentQRCode ? true : false;
        
        let botStatus = 'desconectado';
        if (isConnected) {
            botStatus = 'conectado';
        } else if (isInitializing) {
            botStatus = 'iniciando';
        }
        
        res.json({
            success: true,
            botStatus: botStatus,
            hasQR: hasQR,
            isInitializing: isInitializing,
            timestamp: new Date().toISOString(),
            system: 'operacional'
        });
    } catch (error) {
        console.error('Erro ao verificar status:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Rota para QR Code
app.get("/qrcode", async (req, res) => {
    try {
        if (global.currentQRCode) {
            const qrCodeImage = await qrcode.toDataURL(global.currentQRCode);
            res.json({
                success: true,
                qrCode: qrCodeImage,
                hasQR: true
            });
        } else {
            res.json({
                success: true,
                qrCode: null,
                hasQR: false,
                message: global.isInitialized ? 'WhatsApp já está conectado' : 'Aguardando QR Code'
            });
        }
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Rota para página inicial
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, '../public/index.html'));
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    logger.info(`🍽️ Servidor do restaurante rodando na porta ${PORT}`);
    console.log(`🍽️ Servidor rodando em http://localhost:${PORT}`);
});

// Tratamento de erros
process.on("unhandledRejection", (error) => {
    logger.error("Erro não tratado:", error);
});

process.on("uncaughtException", (error) => {
    logger.error("Exceção não capturada:", error);
    process.exit(1);
});

