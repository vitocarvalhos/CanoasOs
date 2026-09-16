# Canoas Sales OS

CRM de execução comercial para operar leads, próximas ações e pipeline sem perder follow-ups.

## Rodar localmente

1. Copie `.env.example` para `.env.local` e informe a URL e a chave publicável do Supabase.
2. Instale as dependências com `pnpm install`.
3. Rode `pnpm dev` e abra `http://localhost:3000`.

O projeto usa somente a chave publicável no navegador. Nunca adicione `service_role` ou chaves secretas a variáveis `NEXT_PUBLIC_*`.

## Deploy na Vercel

Importe o repositório na Vercel e cadastre as duas variáveis de `.env.example` nos ambientes desejados. O comando de build é `pnpm build`.

Para confirmação de cadastro por e-mail, adicione a URL de produção e `https://seu-dominio.com/auth/confirm` às Redirect URLs do Supabase Auth.
