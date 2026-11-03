# Roleta do Amigo Secreto

Site simples (Next.js + Supabase, pronto para a Vercel) para organizar amigo secreto sem login.

## Como funciona

1. Alguém cria um grupo (nome, valor sugerido e data opcionais) e vira o organizador.
2. Manda o link `/g/CODIGO` para a galera.
3. Cada pessoa entra com um **nick**, **um tema de presente** (que vai para o pote de temas) e **regras do que evitar**.
4. O organizador clica em **Fazer o sorteio** (mínimo 3 pessoas). Ninguém tira a si mesmo e nem o organizador vê os pares.
5. Cada pessoa abre o grupo e **gira a roleta**: recebe um amigo aleatório e um tema aleatório (nunca o próprio), mais as regras do amigo.

Sem login: a identidade fica salva no navegador. Cada pessoa tem um **link pessoal** (e o organizador um link de organizador) para abrir em outro aparelho.

## Configurar o Supabase

1. Crie um projeto em https://supabase.com.
2. Abra **SQL Editor**, cole o conteúdo de `supabase/schema.sql` e rode.
3. Em **Project Settings > API**, copie a *Project URL* e a chave **service_role**.

O banco é acessado apenas pelo servidor (rotas `/api`), com a chave service_role. O RLS fica ligado sem policies, então a chave pública não lê nada.

## Rodar localmente

```bash
npm install
cp .env.example .env.local   # preencha SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY
npm run dev
```

Sem `.env.local`, o `npm run dev` usa um banco em memória (bom para testar a interface).

## Publicar na Vercel

1. Suba este projeto para um repositório no GitHub.
2. Na Vercel: **Add New > Project**, importe o repositório.
3. Em **Environment Variables**, adicione `SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY`.
4. Deploy.
