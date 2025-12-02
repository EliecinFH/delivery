const logger = require('./logger');

class AddressExtractor {
    constructor() {
        // Padrões para extração de endereço
        this.patterns = {
            rua: /(?:rua|av|avenida|alameda|praça|travessa|estrada|rodovia)\s+([^,\n]+)/i,
            numero: /(?:n[úu]mero|n[úu]m|n[º°]|#)\s*:?\s*(\d+[a-z]?)/i,
            complemento: /(?:apto|apartamento|bloco|sala|andar|andar|apt|bl)\s+([^,\n]+)/i,
            bairro: /(?:bairro|b\.?)\s*:?\s*([^,\n]+)/i,
            cidade: /(?:cidade|munic[íi]pio)\s*:?\s*([^,\n]+)/i,
            estado: /(?:estado|uf)\s*:?\s*([A-Z]{2})/i,
            cep: /(?:cep|c\.?e\.?p\.?)\s*:?\s*(\d{5}-?\d{3})/i,
            referencia: /(?:refer[êe]ncia|ref|pr[óo]ximo|perto|perto de)\s*:?\s*([^,\n]+)/i
        };
    }

    /**
     * Extrai endereço de uma mensagem de texto
     * @param {string} text - Texto da mensagem
     * @returns {Object|null} - Objeto com endereço extraído ou null
     */
    extractFromText(text) {
        if (!text || typeof text !== 'string') {
            return null;
        }

        const endereco = {};

        // Tentar extrair cada componente
        for (const [key, pattern] of Object.entries(this.patterns)) {
            const match = text.match(pattern);
            if (match) {
                endereco[key] = match[1].trim();
            }
        }

        // Se não encontrou nada com padrões, tentar extrair de formato livre
        if (Object.keys(endereco).length === 0) {
            return this.extractFreeFormat(text);
        }

        // Validar se tem pelo menos rua e número
        if (endereco.rua && endereco.numero) {
            return endereco;
        }

        return null;
    }

    /**
     * Extrai endereço de formato livre (ex: "Rua das Flores, 123, Centro, São Paulo")
     */
    extractFreeFormat(text) {
        // Remover caracteres especiais e normalizar
        const normalized = text
            .replace(/[^\w\s,.-]/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();

        // Tentar identificar padrão: Rua, Número, Bairro, Cidade
        const parts = normalized.split(',').map(p => p.trim());

        if (parts.length >= 2) {
            const endereco = {};

            // Primeira parte geralmente é a rua
            if (parts[0]) {
                endereco.rua = parts[0];
            }

            // Segunda parte pode ser número ou bairro
            if (parts[1]) {
                // Verificar se é número
                const numeroMatch = parts[1].match(/(\d+[a-z]?)/i);
                if (numeroMatch) {
                    endereco.numero = numeroMatch[1];
                } else {
                    endereco.bairro = parts[1];
                }
            }

            // Terceira parte pode ser bairro ou cidade
            if (parts[2]) {
                if (!endereco.bairro) {
                    endereco.bairro = parts[2];
                } else {
                    endereco.cidade = parts[2];
                }
            }

            // Quarta parte geralmente é cidade ou estado
            if (parts[3]) {
                if (!endereco.cidade) {
                    endereco.cidade = parts[3];
                } else {
                    endereco.estado = parts[3].substring(0, 2).toUpperCase();
                }
            }

            // Validar se tem pelo menos rua e número
            if (endereco.rua && endereco.numero) {
                return endereco;
            }
        }

        return null;
    }

    /**
     * Extrai endereço de uma conversa completa
     * Analisa as últimas mensagens para encontrar informações de endereço
     */
    async extractFromConversation(phoneNumber, Conversation) {
        try {
            const conversation = await Conversation.findOne({ phoneNumber })
                .sort({ 'messages.timestamp': -1 });

            if (!conversation || !conversation.messages || conversation.messages.length === 0) {
                return null;
            }

            // Analisar as últimas 10 mensagens do usuário
            const userMessages = conversation.messages
                .filter(msg => msg.sender === 'user')
                .slice(0, 10)
                .reverse();

            // Combinar todas as mensagens do usuário
            const combinedText = userMessages
                .map(msg => msg.content)
                .join(' ');

            // Tentar extrair endereço
            const endereco = this.extractFromText(combinedText);

            if (endereco) {
                // Salvar endereço extraído na conversa
                conversation.enderecoExtraido = {
                    ...endereco,
                    extraidoEm: new Date()
                };
                await conversation.save();

                logger.info(`Endereço extraído para ${phoneNumber}:`, endereco);
            }

            return endereco;
        } catch (error) {
            logger.error('Erro ao extrair endereço da conversa:', error);
            return null;
        }
    }

    /**
     * Valida se um endereço está completo
     */
    isValidAddress(address) {
        if (!address) return false;
        
        // Mínimo necessário: rua e número
        return !!(address.rua && address.numero);
    }

    /**
     * Formata endereço para exibição
     */
    formatAddress(address) {
        if (!this.isValidAddress(address)) {
            return null;
        }

        let formatted = `${address.rua}, ${address.numero}`;
        
        if (address.complemento) {
            formatted += `, ${address.complemento}`;
        }
        
        if (address.bairro) {
            formatted += ` - ${address.bairro}`;
        }
        
        if (address.cidade) {
            formatted += `, ${address.cidade}`;
        }
        
        if (address.estado) {
            formatted += `/${address.estado}`;
        }
        
        if (address.cep) {
            formatted += ` - CEP: ${address.cep}`;
        }
        
        if (address.referencia) {
            formatted += `\nReferência: ${address.referencia}`;
        }

        return formatted;
    }
}

module.exports = new AddressExtractor();

