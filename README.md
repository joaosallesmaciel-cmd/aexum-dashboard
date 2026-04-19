# Aexum Dashboard

Dashboard privado de ferramentas — aexum.com.br

## Ferramentas
- `/posts` — Gerador de Posts para Instagram

## Deploy no Vercel

1. Faça upload desta pasta no GitHub
2. Conecte o repositório no Vercel
3. Adicione a variável de ambiente: `ANTHROPIC_API_KEY`
4. Aponte o domínio `aexum.com.br` nas configurações do Vercel

## Desenvolvimento local

```bash
npm install
cp .env.example .env.local
# edite .env.local com sua chave
npm run dev
```

Acesse: http://localhost:3000
