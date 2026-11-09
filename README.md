# Preço do Bom + Vercel Blob

Estrutura: public/index.html (app) · api/state.js · api/backup.js · api/_lib.js

## Instalação

1. Suba esta pasta num projeto da Vercel (Git ou `vercel deploy`).
2. Em Storage, crie um Blob store e conecte-o ao projeto. A Vercel cria `BLOB_READ_WRITE_TOKEN`.
3. Opcionalmente, defina `BLOB_PREFIX` para separar os arquivos deste app.
4. Faça o deploy. O aplicativo abre diretamente, sem solicitar senha.

**Atenção — acesso público:** a autenticação foi removida da interface e das rotas da API, conforme solicitado para uso pessoal. Qualquer pessoa que conheça o endereço público do aplicativo poderá consultar, alterar e apagar os dados. O Blob pode continuar privado, mas a API do site funciona como intermediária pública. Não use esta configuração para dados confidenciais nem compartilhe o link publicamente.

## Módulos de gestão (2.0)

Além da precificação e das fichas técnicas, a aplicação inclui módulos para a operação diária de um pequeno negócio:

- **Visão geral:** faturamento e lucro estimados dos últimos 30 dias, vendas recentes e alertas de estoque mínimo.
- **Estoque:** saldo por insumo, estoque mínimo, entradas, saídas, ajustes e histórico de movimentações. É possível remover um insumo do controle de estoque sem apagar sua ficha técnica e adicioná-lo novamente depois.
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

### Layout e acesso

- Interface ajustada para monitores grandes, notebooks, tablets e celulares.
- Navegação móvel horizontal, formulários adaptáveis e tabelas com rolagem horizontal em telas estreitas.
- A entrada não solicita senha. O endereço do app deve ser tratado como um link privado, embora não ofereça proteção por autenticação.
