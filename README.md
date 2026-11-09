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


## Módulos de gestão (2.0)

Além da precificação e das fichas técnicas, a aplicação inclui módulos para a operação diária de um pequeno negócio:

- **Visão geral:** faturamento e lucro estimados dos últimos 30 dias, vendas recentes e alertas de estoque mínimo.
- **Estoque:** saldo por insumo, estoque mínimo, entradas, saídas, ajustes e histórico de movimentações.
- **Vendas:** registro manual de vendas por produto, quantidade, preço, data e forma de pagamento. Os ingredientes são baixados do estoque quando há saldo e unidade compatível.
- **Compras e fornecedores:** cadastro de fornecedores e registro de compras. Uma compra atualiza o custo cadastrado do insumo pelo valor mais recente e adiciona a quantidade ao estoque.
- **Cardápio:** seleção dos produtos visíveis e impressão pelo navegador, inclusive opção de salvar em PDF.
- **Inteligência de preços:** comparação de margens e simulação de aumento de custos sem alterar os preços cadastrados.
- **Relatórios:** resumo de vendas, custos, lucro estimado e valor estimado do estoque; exportação do histórico de vendas em CSV.

### Observações de uso

1. O saldo inicial de cada insumo começa em zero. Registre uma compra ou use **Ajustar estoque** para informar o saldo que já existe.
2. O consumo automático depende de ingredientes cadastrados na ficha técnica e de unidades compatíveis (g/kg, ml/L ou un).
3. O sistema não permite que uma saída manual deixe o saldo negativo. Ao registrar venda, ingredientes sem saldo suficiente não são baixados; a venda permanece registrada.
4. O lucro das vendas é uma estimativa baseada no custo unitário calculado no momento do registro. Alterações futuras nas fichas não reescrevem o histórico.
5. Os novos dados ficam no mesmo estado sincronizado já utilizado pelo aplicativo (nuvem e armazenamento local). Faça backups regulares em **Ajustes**.
