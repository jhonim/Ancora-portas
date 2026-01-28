# Âncora - Sistema de Orçamentos

## Configuração do Supabase

Para que o sistema funcione com dados reais e persistência, siga os passos abaixo:

### 1. Criar Projeto
1. Crie uma conta em [supabase.com](https://supabase.com).
2. Crie um novo projeto.

### 2. Criar Tabelas
1. No painel do seu projeto, vá para **SQL Editor** (ícone de terminal na barra lateral esquerda).
2. Clique em **New query**.
3. Copie o conteúdo do arquivo `supabase_schema.sql` deste projeto.
4. Cole no editor do Supabase e clique em **Run**.

### 3. Configurar Autenticação
1. Vá para **Authentication** > **Providers**.
2. Certifique-se de que "Email" está habilitado.
3. (Opcional) Desabilite "Confirm email" em **Authentication** > **URL Configuration** se quiser testar logins imediatamente sem confirmar email.

### 4. Conectar o App
Para conectar este frontend ao seu projeto Supabase, você precisa definir as variáveis de ambiente. Em um ambiente local, você pode criar um arquivo `.env` na raiz (se estiver usando build tools como Vite/Create React App) ou substituir as constantes diretamente em `services/supabaseService.ts` nas linhas:

```typescript
const SUPABASE_URL = 'SUA_URL_DO_PROJETO_SUPABASE';
const SUPABASE_KEY = 'SUA_CHAVE_ANON_PUBLICA';
```

Você encontra essas chaves no painel do Supabase em **Settings** (engrenagem) > **API**.

---

## Funcionalidades Atuais

*   **Cálculo de Orçamento**: (Altura + Rolo) * Largura * Quantidade.
*   **Seleção Automática**:
    *   **Motor**: Baseado no peso total da porta individual.
    *   **Eixo**: Baseado na largura do vão.
*   **PDF**: Geração de orçamento limpo contendo apenas totais e lista de opcionais.
*   **Admin**: Gerenciamento completo de tabelas (Perfis, Motores, Eixos, Opcionais).
