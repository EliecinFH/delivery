const path = require('path');
// Carrega o .env da raiz do projeto restaurante-delivery
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const config = {
    // Configurações do Restaurante
    RESTAURANTE_NOME: process.env.RESTAURANTE_NOME || 'Restaurante',
    RESTAURANTE_DESCRICAO: process.env.RESTAURANTE_DESCRICAO || 'Sabor e qualidade em cada prato',
    RESTAURANTE_CNPJ: process.env.RESTAURANTE_CNPJ || '00.000.000/0001-00',
    RESTAURANTE_ENDERECO: process.env.RESTAURANTE_ENDERECO || 'Rua Principal, 123 - Centro',
    RESTAURANTE_CIDADE: process.env.RESTAURANTE_CIDADE || 'São Paulo - SP',
    RESTAURANTE_TELEFONE: process.env.RESTAURANTE_TELEFONE || '(11) 99999-9999',
    RESTAURANTE_EMAIL: process.env.RESTAURANTE_EMAIL || 'contato@restaurante.com.br',
    
    // Configurações do Bot
    PROPRIETARIO_NUMERO: process.env.PROPRIETARIO_NUMERO || '557196177635@c.us',
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/restaurante-delivery',
    BOT_NAME: process.env.BOT_NAME || 'Assistente do Restaurante',
    BOT_DESCRIPTION: 'Assistente virtual para pedidos e atendimento',
    
    // Configurações de Horário
    HORARIO_FUNCIONAMENTO: {
        SEGUNDA_SEXTA: process.env.HORARIO_SEGUNDA_SEXTA || '11:00 - 23:00',
        SABADO: process.env.HORARIO_SABADO || '11:00 - 00:00',
        DOMINGO: process.env.HORARIO_DOMINGO || '11:00 - 22:00'
    },
    
    // Configurações de Delivery
    TAXA_ENTREGA_PADRAO: parseFloat(process.env.TAXA_ENTREGA_PADRAO || '5.00'),
    TEMPO_ENTREGA_ESTIMADO: parseInt(process.env.TEMPO_ENTREGA_ESTIMADO || '30'), // minutos
    RAIO_ENTREGA: parseFloat(process.env.RAIO_ENTREGA || '10'), // km
    
    // Configurações de Mesas
    NUMERO_MESAS: parseInt(process.env.NUMERO_MESAS || '20'),
    CAPACIDADE_MESA_PADRAO: parseInt(process.env.CAPACIDADE_MESA_PADRAO || '4'),
    
    // Configurações de Performance
    TEMPO_ESPERA_MENU: 2000, // 2 segundos
    LOG_PATH: process.env.LOG_FILE_PATH || 'logs/app.log',
    
    // Configurações de IA
    AI_MODEL: process.env.AI_MODEL || 'gpt-3.5-turbo',
    AI_TEMPERATURE: parseFloat(process.env.AI_TEMPERATURE || '0.7'),
    AI_MAX_TOKENS: parseInt(process.env.AI_MAX_TOKENS || '500'),
    
    // Configurações de Impressão
    IMPRESSORA_TIPO: process.env.IMPRESSORA_TIPO || 'network', // 'usb' ou 'network'
    IMPRESSORA_IP: process.env.IMPRESSORA_IP || '192.168.1.100',
    IMPRESSORA_PORTA: parseInt(process.env.IMPRESSORA_PORTA || '9100'),
    IMPRESSORA_USB_VENDOR_ID: process.env.IMPRESSORA_USB_VENDOR_ID,
    IMPRESSORA_USB_PRODUCT_ID: process.env.IMPRESSORA_USB_PRODUCT_ID
};

module.exports = config;

