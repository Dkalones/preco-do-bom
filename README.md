# Preço do Bom + Vercel Blob

Estrutura: public/index.html (app) · api/state.js · api/backup.js · api/_lib.js

## Passos
1. Suba esta pasta num projeto da Vercel (git ou `vercel deploy`).
2. Em Storage, crie um Blob store e conecte ao projeto (cria BLOB_READ_WRITE_TOKEN sozinho).
3. Em Settings > Environment Variables:
   - ACCESS_KEYS = jao:chave-longa-1,maria:chave-longa-2   (uma chave por pessoa)
   - BLOB_PREFIX = uma-string-aleatoria-longa   (a URL do blob fica impossível de adivinhar)
4. Redeploy. Cada pessoa digita a própria chave no primeiro acesso.

Para tirar o acesso de alguém: remova a chave dela de ACCESS_KEYS e faça redeploy.
