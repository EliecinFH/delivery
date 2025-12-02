const escpos = require('escpos');
// Instalar escpos-usb e escpos-network separadamente se necessário
// const escposUSB = require('escpos-usb');
// const escposNetwork = require('escpos-network');
const logger = require('../utils/logger');

class PrintService {
    constructor() {
        this.printer = null;
        this.printerType = null; // 'usb' ou 'network'
        this.printerConfig = null;
    }

    /**
     * Conecta à impressora USB
     */
    async connectUSB(vendorId, productId) {
        try {
            // Nota: escpos-usb pode precisar de instalação separada
            // Para usar USB, instale: npm install escpos-usb
            const escposUSB = require('escpos-usb');
            const device = new escposUSB.USB(vendorId, productId);
            this.printer = new escpos.Printer(device);
            this.printerType = 'usb';
            this.printerConfig = { vendorId, productId };
            
            await device.open();
            logger.info('Impressora USB conectada com sucesso');
            return true;
        } catch (error) {
            logger.error('Erro ao conectar impressora USB:', error);
            logger.error('Certifique-se de que escpos-usb está instalado: npm install escpos-usb');
            return false;
        }
    }

    /**
     * Conecta à impressora de rede
     */
    async connectNetwork(ip, port = 9100) {
        try {
            // Nota: escpos-network pode precisar de instalação separada
            // Para usar network, instale: npm install escpos-network
            const escposNetwork = require('escpos-network');
            const device = new escposNetwork.Network(ip, port);
            this.printer = new escpos.Printer(device);
            this.printerType = 'network';
            this.printerConfig = { ip, port };
            
            await device.open();
            logger.info(`Impressora de rede conectada: ${ip}:${port}`);
            return true;
        } catch (error) {
            logger.error('Erro ao conectar impressora de rede:', error);
            logger.error('Certifique-se de que escpos-network está instalado: npm install escpos-network');
            return false;
        }
    }

    /**
     * Verifica se a impressora está conectada
     */
    isConnected() {
        return this.printer !== null;
    }

    /**
     * Imprime ticket de cozinha
     */
    async printKitchenTicket(pedido) {
        if (!this.isConnected()) {
            throw new Error('Impressora não conectada');
        }

        try {
            const now = new Date();
            const timeStr = now.toLocaleTimeString('pt-BR', { 
                hour: '2-digit', 
                minute: '2-digit' 
            });

            this.printer
                .font('a')
                .align('ct')
                .size(1, 1)
                .text('COZINHA')
                .text('==================')
                .text('')
                .text(`PEDIDO: ${pedido.numeroPedido}`)
                .text(`TIPO: ${pedido.tipoPedido.toUpperCase()}`)
                .text(`HORA: ${timeStr}`)
                .text('')
                .align('lt')
                .text('ITENS PARA PREPARAR:')
                .text('====================')
                .text('');

            // Imprimir itens
            if (pedido.itens && pedido.itens.length > 0) {
                pedido.itens.forEach((item, index) => {
                    this.printer
                        .text(`${index + 1}. ${item.nome || 'Item'}`)
                        .text(`   Qtd: ${item.quantidade}`)
                        .text(`   Preço: R$ ${(item.preco * item.quantidade).toFixed(2)}`);
                    
                    if (item.observacoes) {
                        this.printer.text(`   Obs: ${item.observacoes}`);
                    }
                    
                    this.printer.text('');
                });
            }

            if (pedido.observacoes) {
                this.printer
                    .text('OBSERVAÇÕES:')
                    .text('------------')
                    .text(pedido.observacoes)
                    .text('');
            }

            this.printer
                .text('==================')
                .align('ct')
                .text('PREPARAR COM CARINHO!')
                .text('')
                .cut();

            await this.printer.close();
            
            // Marcar como impresso
            pedido.impresso.cozinha = true;
            await pedido.save();

            logger.info(`Ticket de cozinha impresso: ${pedido.numeroPedido}`);
            return true;
        } catch (error) {
            logger.error('Erro ao imprimir ticket de cozinha:', error);
            throw error;
        }
    }

    /**
     * Imprime ticket de entrega
     */
    async printDeliveryTicket(pedido) {
        if (!this.isConnected()) {
            throw new Error('Impressora não conectada');
        }

        try {
            const now = new Date();
            const dateStr = now.toLocaleDateString('pt-BR');
            const timeStr = now.toLocaleTimeString('pt-BR', { 
                hour: '2-digit', 
                minute: '2-digit' 
            });

            this.printer
                .font('a')
                .align('ct')
                .size(1, 1)
                .text('ENTREGA')
                .text('==================')
                .text('')
                .text(`PEDIDO: ${pedido.numeroPedido}`)
                .text(`DATA: ${dateStr}`)
                .text(`HORA: ${timeStr}`)
                .text('')
                .align('lt')
                .text('CLIENTE:')
                .text(`Nome: ${pedido.cliente.nome}`)
                .text(`Telefone: ${pedido.cliente.telefone}`)
                .text('')
                .text('ENDEREÇO:')
                .text(pedido.getEnderecoFormatado() || 'Não informado')
                .text('')
                .text('ITENS:')
                .text('------')
                .text('');

            // Imprimir itens
            pedido.itens.forEach((item, index) => {
                this.printer
                    .text(`${index + 1}. ${item.nome}`)
                    .text(`   Qtd: ${item.quantidade} x R$ ${item.preco.toFixed(2)}`)
                    .text(`   Subtotal: R$ ${(item.quantidade * item.preco).toFixed(2)}`)
                    .text('');
            });

            this.printer
                .text('==================')
                .align('rt')
                .text(`Subtotal: R$ ${pedido.subtotal.toFixed(2)}`)
                .text(`Taxa Entrega: R$ ${pedido.taxaEntrega.toFixed(2)}`);

            if (pedido.desconto > 0) {
                this.printer.text(`Desconto: R$ ${pedido.desconto.toFixed(2)}`);
            }

            this.printer
                .text(`TOTAL: R$ ${pedido.total.toFixed(2)}`)
                .text('')
                .align('lt')
                .text(`Pagamento: ${pedido.formaPagamento.toUpperCase()}`)
                .text(`Status: ${pedido.status.toUpperCase()}`);

            if (pedido.observacoes) {
                this.printer
                    .text('')
                    .text('OBSERVAÇÕES:')
                    .text(pedido.observacoes);
            }

            this.printer
                .text('')
                .text('==================')
                .align('ct')
                .text('OBRIGADO PELA PREFERÊNCIA!')
                .text('')
                .cut();

            await this.printer.close();
            
            // Marcar como impresso
            pedido.impresso.entrega = true;
            await pedido.save();

            logger.info(`Ticket de entrega impresso: ${pedido.numeroPedido}`);
            return true;
        } catch (error) {
            logger.error('Erro ao imprimir ticket de entrega:', error);
            throw error;
        }
    }

    /**
     * Imprime ticket de mesa
     */
    async printTableTicket(pedido, mesa) {
        if (!this.isConnected()) {
            throw new Error('Impressora não conectada');
        }

        try {
            const now = new Date();
            const dateStr = now.toLocaleDateString('pt-BR');
            const timeStr = now.toLocaleTimeString('pt-BR', { 
                hour: '2-digit', 
                minute: '2-digit' 
            });

            this.printer
                .font('a')
                .align('ct')
                .size(1, 1)
                .text('MESA')
                .text('==================')
                .text('')
                .text(`PEDIDO: ${pedido.numeroPedido}`)
                .text(`MESA: ${mesa.numero}`)
                .text(`DATA: ${dateStr}`)
                .text(`HORA: ${timeStr}`)
                .text('')
                .align('lt')
                .text('CLIENTE:')
                .text(`Nome: ${pedido.cliente.nome}`)
                .text(`Telefone: ${pedido.cliente.telefone}`)
                .text('')
                .text('ITENS:')
                .text('------')
                .text('');

            // Imprimir itens
            pedido.itens.forEach((item, index) => {
                this.printer
                    .text(`${index + 1}. ${item.nome}`)
                    .text(`   Qtd: ${item.quantidade} x R$ ${item.preco.toFixed(2)}`)
                    .text(`   Subtotal: R$ ${(item.quantidade * item.preco).toFixed(2)}`)
                    .text('');
            });

            this.printer
                .text('==================')
                .align('rt')
                .text(`TOTAL: R$ ${pedido.total.toFixed(2)}`)
                .text('')
                .align('lt')
                .text(`Pagamento: ${pedido.formaPagamento.toUpperCase()}`)
                .text(`Status: ${pedido.status.toUpperCase()}`);

            if (pedido.observacoes) {
                this.printer
                    .text('')
                    .text('OBSERVAÇÕES:')
                    .text(pedido.observacoes);
            }

            this.printer
                .text('')
                .text('==================')
                .align('ct')
                .text('OBRIGADO PELA PREFERÊNCIA!')
                .text('')
                .cut();

            await this.printer.close();
            
            // Marcar como impresso
            pedido.impresso.balcao = true;
            await pedido.save();

            logger.info(`Ticket de mesa impresso: ${pedido.numeroPedido} - Mesa ${mesa.numero}`);
            return true;
        } catch (error) {
            logger.error('Erro ao imprimir ticket de mesa:', error);
            throw error;
        }
    }

    /**
     * Teste de impressão
     */
    async testPrint() {
        if (!this.isConnected()) {
            throw new Error('Impressora não conectada');
        }

        try {
            this.printer
                .font('a')
                .align('ct')
                .size(1, 1)
                .text('TESTE DE IMPRESSÃO')
                .text('==================')
                .text('')
                .text('Se você está vendo isso,')
                .text('a impressora está funcionando!')
                .text('')
                .text(new Date().toLocaleString('pt-BR'))
                .text('')
                .cut();

            await this.printer.close();
            logger.info('Teste de impressão realizado com sucesso');
            return true;
        } catch (error) {
            logger.error('Erro no teste de impressão:', error);
            throw error;
        }
    }
}

module.exports = new PrintService();

