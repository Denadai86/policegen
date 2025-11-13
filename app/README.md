# PolicyGen (pasta app)

Este README local explica como rodar, configurar e fazer deploy da aplicação contida na pasta `app` deste projeto Next.js.

> Observação: se você preferir um README na raiz do repositório (lado a lado com `package.json`), diga e eu movo/gero para a raiz.

## Resumo rápido

- Projeto: Next.js (App Router) que gera Termos de Uso / Política de Privacidade via API de IA e salva rascunhos/políticas no Firestore.
- Endpoint principal (server): `/api/generate`

## Comandos úteis

```powershell
# instalar dependências (na raiz do repo)
npm install

# rodar em dev
npm run dev

# build
npm run build

# start (produção local)
npm run start
```

## Variáveis de ambiente (exigidas)

No `.env.local` (ou via Vercel Environment Variables) configure:

- `FIREBASE_PROJECT_ID`
- `FIREBASE_CLIENT_EMAIL`
- `FIREBASE_PRIVATE_KEY`
- `GEMINI_API_KEY` (ou chave equivalente para @google/genai)

Exemplo (forma que funciona bem no .env):

```env
FIREBASE_PROJECT_ID=meu-project-id
FIREBASE_CLIENT_EMAIL=meu-service-account@meu-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIE...\n-----END PRIVATE KEY-----\n"
GEMINI_API_KEY=sk-xxxxx
```

A implementação do projeto já realiza normalização da chave (remove aspas externas e converte `\\n` em \n). Se houver falha de PEM, verifique a formatação da variável.

## Deploy no Vercel

1. Commit + push para GitHub

```powershell
git add .
git commit -m "Preparar deploy: README e ajustes" 
git push origin main
```

2. No Vercel: Import Project → selecione o repositório
3. Configure as Environment Variables conforme acima
4. Escolha o branch e inicie o deploy
5. Verifique logs de build e runtime no painel do Vercel

## Testes rápidos da API

Exemplo com curl (rodando localmente em `http://localhost:3000`):

```powershell
curl -X POST http://localhost:3000/api/generate -H "Content-Type: application/json" -d "{\"nomeDoProjeto\":\"MeuApp\",\"jurisdicao\":\"Brasil\",\"nomeDoResponsavel\":\"Empresa X\"}"
```

Resposta esperada: JSON com `policyContent` e `generatedAt`.

## Troubleshooting comum

- `Failed to parse private key: Invalid PEM formatted message`:
  - Ajuste `FIREBASE_PRIVATE_KEY` (veja exemplo acima).

- `Cannot find module '@google/genai'`:
  - Instale dependência: `npm install @google/genai`

- Problemas com aliases `@/utils`:
  - O projeto já foi adaptado para usar caminhos relativos, mas confirme `tsconfig.json`/`next.config.js` se você usar aliases.

## Próximos passos sugeridos

- Mover este README para a raiz do repositório (opcional).
- Adicionar `package.json` scripts extras, se necessário (`lint`, `test`).

Se quiser, eu gero um `README.md` na raiz do projeto com conteúdo idêntico (ou mais detalhado). Diga se prefere que eu mova/repita para a raiz.