# 🗄️ Integração com Supabase (Banco de Dados)

Parabéns! Seu site agora está integrado ao Supabase. Isso significa que seus produtos e configurações ficarão salvos na nuvem e não serão perdidos ao reiniciar o servidor.

Siga os passos abaixo para finalizar a configuração:

## 1. Configurar o Banco de Dados (Supabase)

1. Acesse o painel do seu projeto no Supabase: [https://fqcczeccwajvxaxibyii.supabase.co](https://fqcczeccwajvxaxibyii.supabase.co)
2. Vá até o **SQL Editor** (ícone de código na barra lateral esquerda).
3. Cole o conteúdo do arquivo `server/schema.sql` e clique em **RUN**.
   - Isso criará as tabelas `products`, `categories`, `banners`, `settings` e `users`.

## 2. Migrar seus Dados Atuais

Para enviar os produtos que você já cadastrou para o banco de dados:

1. No terminal do VS Code, execute:
   ```bash
   node server/migrate_data.js
   ```
   - Você verá mensagens de sucesso para cada tabela migrada.

2. **IMPORTANTE**: Após migrar, volte ao **SQL Editor** no Supabase e execute o conteúdo de `server/fix_sequence.sql`.
   - Isso corrige os IDs automáticos para que novos produtos não deem erro.

## 3. Configurar no Vercel (Produção)

Para que o site funcione online, você precisa adicionar as variáveis de ambiente no Vercel:

1. Vá ao painel do seu projeto no Vercel -> **Settings** -> **Environment Variables**.
2. Adicione as seguintes variáveis (copie do arquivo `server/.env`):
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `JWT_SECRET` (pode usar o padrão ou criar um novo)

## 4. Testar

- Reinicie seu servidor local (`npm run dev` ou `node server/index.js`).
- Acesse o Admin Panel e verifique se os produtos aparecem.
- Tente editar um produto. A alteração deve persistir no Supabase!

---

**Observação sobre Imagens**:
O upload de imagens continua temporário no Vercel. Recomendamos usar URLs externas (Imgur/Drive) no campo "URL Externa" ao cadastrar produtos, ou configurar um Storage Bucket no Supabase futuramente.
