# 📦 Guia: Criar Repositório Separado para Restaurante-Delivery

Se você quiser mover o sistema `restaurante-delivery` para um repositório Git separado, siga estes passos:

## 🚀 Opção 1: Criar Novo Repositório no GitHub

### Passo 1: Criar Repositório no GitHub
1. Acesse https://github.com/new
2. Nome do repositório: `restaurante-delivery-whatsapp`
3. Descrição: "Sistema de atendimento WhatsApp para restaurante e delivery"
4. Escolha se será público ou privado
5. **NÃO** marque "Initialize with README" (já temos arquivos)
6. Clique em "Create repository"

### Passo 2: Inicializar Git na Pasta Restaurante-Delivery

```bash
# Navegue até a pasta restaurante-delivery
cd restaurante-delivery

# Inicialize o repositório Git
git init

# Adicione todos os arquivos
git add .

# Faça o primeiro commit
git commit -m "Initial commit: Sistema restaurante-delivery separado"

# Adicione o repositório remoto (substitua SEU_USUARIO pelo seu usuário do GitHub)
git remote add origin https://github.com/SEU_USUARIO/restaurante-delivery-whatsapp.git

# Renomeie a branch para main (se necessário)
git branch -M main

# Envie para o GitHub
git push -u origin main
```

### Passo 3: Remover do Repositório Principal (Opcional)

Se quiser remover a pasta `restaurante-delivery` do repositório principal:

```bash
# Na raiz do projeto principal
cd ..

# Adicione restaurante-delivery ao .gitignore
echo "restaurante-delivery/" >> .gitignore

# Commit a mudança
git add .gitignore
git commit -m "Remove restaurante-delivery (agora em repositório separado)"
git push
```

## 🔄 Opção 2: Usar Git Submodule (Manter no Mesmo Repositório)

Se quiser manter ambos no mesmo repositório mas com histórico separado:

```bash
# Na raiz do projeto principal
cd restaurante-delivery
git init
git add .
git commit -m "Initial commit restaurante-delivery"

# Volte para a raiz
cd ..

# Adicione como submodule (se quiser)
# Mas isso é mais complexo e geralmente não é necessário
```

## ⚠️ Importante

1. **Backup**: Faça backup antes de mover arquivos
2. **Histórico**: O novo repositório não terá o histórico do repositório principal
3. **Dependências**: Certifique-se de que o `.env` não seja commitado (adicione ao `.gitignore`)
4. **Documentação**: Atualize os READMEs com links para o novo repositório

## 📝 Checklist

- [ ] Criar repositório no GitHub
- [ ] Inicializar Git na pasta restaurante-delivery
- [ ] Criar arquivo `.gitignore` apropriado
- [ ] Fazer primeiro commit
- [ ] Conectar ao repositório remoto
- [ ] Fazer push inicial
- [ ] Atualizar documentação com links
- [ ] (Opcional) Remover do repositório principal

## 🔐 Arquivo .gitignore Recomendado

Crie `restaurante-delivery/.gitignore`:

```
# Dependências
node_modules/
package-lock.json

# Variáveis de ambiente
.env
.env.local
.env.*.local

# Logs
logs/
*.log

# WhatsApp Auth
.wwebjs_auth/
.wwebjs_cache/

# Sistema
.DS_Store
Thumbs.db
*.swp
*.swo
*~

# IDEs
.vscode/
.idea/
*.sublime-project
*.sublime-workspace
```

