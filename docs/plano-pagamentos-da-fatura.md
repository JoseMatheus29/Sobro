# Plano: pagar a fatura aos poucos, durante o mês

O pedido: poder ir fazendo **vários pagamentos** na mesma fatura ao longo do mês. Antes de planejar, o que o código já faz hoje (verificado no app e na API) e o que de fato falta.

## 1. O que já existe

Pagar a fatura em partes **já é possível**, de ponta a ponta:

- **Vários pagamentos parciais na mesma fatura.** Cada pagamento é uma transação da categoria oculta `invoice`, com `invoiceMonth`. A fatura soma tudo o que foi pago (`paid`) e mostra o que falta (`remaining`). Está coberto por teste em `utils/invoice.test.ts` (pagamentos de outra fatura não entram na conta).
- **O botão "Pagar" aparece em qualquer fatura com algo a pagar**, não só na fechada: na `InvoiceCard` da Carteira e na tela da fatura (`app/invoice/[id].tsx`), com a fatura aberta, fechada ou vencida.
- **A folha de pagamento** (`app/payInvoice/[id].tsx`) tem "Valor total" (o que falta) e "Outro valor" (qualquer valor digitado), a data do pagamento e o saldo da conta depois dele.
- **A tela da fatura lista os pagamentos**, e cada um pode ser desfeito (excluído), o que reabre a fatura.
- **A API não limita o valor** ao total da fatura (`docs/api-cartao-credito.md`, seção 4.3): quem limita é a tela.
- O pagamento **mexe no saldo da conta, mas não conta como gasto do mês**, e o Saldo do Início o ignora (as compras já contaram).

Ou seja: abrir a Carteira, tocar em **Pagar** na fatura aberta, escolher **Outro valor** e digitar o quanto pagou já registra um pagamento parcial, e dá para repetir quantas vezes quiser até zerar.

## 2. O que provavelmente falta

Como o básico existe, o incômodo deve estar em um destes pontos (preciso que você diga qual):

| # | Hipótese | Hoje |
| --- | --- | --- |
| H1 | **Pagar com o dinheiro de outra conta** (o cartão é de uma conta, mas você paga de outra) | Não dá: o pagamento sai sempre da conta dona do cartão |
| H2 | **Adiantar**: pagar mais do que já foi comprado (por exemplo, pagar já a parcela dos próximos meses ou o total que você espera) | Não dá: a folha limita ao que já foi comprado (`remaining`); as parcelas ainda não lançadas ficam de fora |
| H3 | **Visibilidade**: não é óbvio que dá para pagar aos poucos, e o card não mostra quanto já foi pago nem os pagamentos feitos | O card só mostra "Falta R$ X" depois do primeiro pagamento; a lista de pagamentos só aparece dentro da tela da fatura |
| H4 | **Planejar e lembrar**: dividir o que falta em pagamentos ao longo do mês e ser avisado | Não existe (nem lembrete de vencimento de fatura) |

## 3. Plano em fases

### Fase 1: visibilidade e atalhos (só o app, vai por OTA)

Resolve H3 e deixa claro que pagar aos poucos é um caminho normal.

- `InvoiceCard` (Carteira): uma barra "Pago R$ X de R$ Y" quando já houve pagamento, os dois últimos pagamentos (data e valor) e o botão com o texto **Registrar pagamento** em vez de só "Pagar".
- Folha de pagamento: atalhos **Pagar o que falta**, **Metade** e **Outro valor** (que já abre com o campo em foco); uma linha dizendo "Você pode pagar aos poucos: cada pagamento abate o que falta".
- Depois de pagar, o aviso diz quanto ainda falta ("Pago R$ 300,00 · faltam R$ 900,00"), em vez de só confirmar.
- Fatura **aberta**: texto "Você pode ir pagando durante o ciclo" onde hoje só se vê o fechamento.
- Testes: as regras já estão em `buildInvoice`; os textos e os atalhos são cálculo simples (`utils/`), com teste.

### Fase 2: adiantar pagamentos (só o app)

Resolve H2.

- Permitir pagar **além do que já foi comprado**, até o total da fatura (comprado mais o previsto). A API já aceita.
- `buildInvoice` ganha `overpaid` (pago a mais): hoje `remaining = max(0, comprado − pago)` esconde o excesso. Com `overpaid`, a tela diz "Pago a mais R$ X: abate as próximas compras", e uma compra nova nessa fatura consome esse valor sozinha (o cálculo já faz isso, só não mostra).
- A folha deixa de recusar valores acima de `remaining` quando eles ficam dentro do total previsto, e avisa que é um adiantamento.
- Testes novos em `utils/invoice.test.ts` (pagar a mais, comprar depois, desfazer um pagamento).

### Fase 3: pagar com outra conta (API + app, só se H1 for a dor)

É a única parte grande, porque o pagamento hoje é uma transação **da conta do cartão**, e a fatura encontra os pagamentos por essa conta.

- **API:** o corpo de `POST /cards/:id/invoice-payments` ganha `fromCardId?` (a conta que paga; padrão, a do cartão). Nova coluna `transactions.invoice_card_id` (de qual cartão é a fatura paga), com migração; a transação fica na conta pagadora, que é a que perde o saldo. `GET /transactions` ganha o filtro `invoiceCardId` para a fatura achar os pagamentos. Apagar a conta do cartão leva os pagamentos feitos por outras contas (cascata por `invoice_card_id`); apagar a conta pagadora leva só os dela e reabre a fatura.
- **Backup:** `schemaVersion` 10 com a nova coluna (o app valida a lista de colunas em `utils/backup-type.ts`).
- **App:** a folha "De" passa a ser uma escolha de conta (`PickerSheet`), `getInvoiceSources` lê os pagamentos por `invoiceCardId`, e a lista de pagamentos diz de qual conta saiu.
- **Riscos:** todo pagamento antigo precisa continuar valendo (a coluna nova é nula e quer dizer "a própria conta"); a exclusão em cascata precisa de teste nos dois sentidos.

### Fase 4: planejar e lembrar (opcional)

Resolve H4. Um bloco "Pagar até o dia 10": "faltam R$ 1.200 · R$ 300 por semana", e um lembrete local (o mesmo sistema de `db/reminders.ts`) na véspera do vencimento se a fatura ainda tiver saldo. Não grava nada novo na API.

## 4. Ordem sugerida e esforço

1. **Fase 1**: pequena, sem API, resolve a maior parte do "não sei como pagar aos poucos".
2. **Fase 2**: pequena a média, sem API.
3. **Fase 4**: pequena a média, sem API.
4. **Fase 3**: grande (API, migração e backup); só vale se você paga de outra conta.

## 5. O que preciso saber

1. O que você tentou fazer e não conseguiu? Qual das hipóteses (H1 a H4) é a sua?
2. Pagar a mais do que já foi comprado (adiantar) é desejado, ou prefere continuar limitado ao que já foi gasto?
3. Você paga a fatura com o dinheiro de **outra conta** do app?
