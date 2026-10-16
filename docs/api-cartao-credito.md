# API: forma de pagamento e cartão de crédito

O que a API (`Sobro - Api`) precisa mudar para o app registrar **como** uma saída foi paga (Pix, débito ou crédito) e controlar a fatura do cartão. Tudo é **aditivo**: nada que já existe muda de forma, e o que já está salvo continua valendo sem conversão.

## 1. O modelo em uma tela

- Uma **conta** (`card`) pode ter um **cartão de crédito**: limite, dia de fechamento e dia de vencimento. O "final do cartão" é o `number` que a conta já tem. Sem o cartão, a conta é como hoje.
- Uma **saída** ganha `paymentMethod`: `pix`, `debit` ou `credit` (ou `null`, o que já existe: sai do saldo).
- Uma saída no **crédito não mexe no saldo da conta**. Ela entra na fatura. O saldo só cai quando a fatura é paga.
- **Pagar a fatura** é uma saída da conta, na categoria oculta `invoice`. Ela mexe no saldo, mas **não conta como gasto do mês** (as compras já foram contadas na data em que foram feitas). Funciona como a transferência, que já é ignorada nos relatórios.

## 2. Regras da fatura (iguais no app e no servidor)

A fatura **não é guardada**: é calculada a partir das compras no crédito e dos pagamentos. O servidor só precisa saber a regra para validar e para os relatórios. O app calcula as faturas sozinho (`utils/invoice.ts`).

Sejam `C` o dia de fechamento e `D` o de vencimento (1 a 31). Um dia 29, 30 ou 31 num mês mais curto cai no **último dia do mês** (a mesma regra das recorrências).

- **Chave da fatura** = o mês (`AAAA-MM`) em que ela **fecha**.
- Uma compra do dia `d` entra na fatura do mês de `d` se `dia(d) <= C` (com `C` limitado ao último dia do mês). Se for depois, entra na do mês seguinte.
- **Ciclo** da fatura `M`: do dia seguinte ao fechamento de `M-1` até o fechamento de `M`.
- **Vencimento** da fatura `M`: se `D > C`, no dia `D` do mês `M`; se `D <= C`, no dia `D` do mês seguinte.
- **Total** = soma das compras no crédito do ciclo. **Pago** = soma dos pagamentos com `invoiceMonth = M` naquela conta.

Exemplo (`C = 3`, `D = 10`): compra em 07/10 entra na fatura `2026-11`, que cobre 04/10 a 03/11 e vence em 10/11. Compra em 03/11 entra na mesma. Compra em 04/11 entra na `2026-12`.

## 3. Banco (migração `0006`)

```sql
ALTER TABLE cards
  ADD COLUMN credit_limit numeric(14,2),
  ADD COLUMN closing_day smallint,
  ADD COLUMN due_day smallint,
  ADD CONSTRAINT cards_credit_days_check CHECK (
    (closing_day IS NULL AND due_day IS NULL)
    OR (closing_day BETWEEN 1 AND 31 AND due_day BETWEEN 1 AND 31)
  );

ALTER TABLE transactions
  ADD COLUMN payment_method text CHECK (payment_method IN ('pix', 'debit', 'credit')),
  ADD COLUMN invoice_month text;
CREATE INDEX transactions_user_card_method_idx ON transactions (user_id, card_id, payment_method);

ALTER TABLE recurrences
  ADD COLUMN payment_method text CHECK (payment_method IN ('pix', 'debit', 'credit'));
```

- Uma conta **tem cartão** quando `closing_day IS NOT NULL`.
- As linhas existentes ficam com tudo `NULL`: contas sem cartão, transações que saem do saldo.
- Criar a categoria **`invoice`** do catálogo (global, como a `transfer`): nome "Fatura do cartão", só para pagamentos de fatura.

## 4. Rotas

### 4.1 Contas

O objeto conta ganha `credit`:

```json
{ "id": 3, "name": "Nubank", "number": "", "color": "#820AD1", "lightColor": "#A04FE0",
  "balance": 960.63, "startingBalance": 500,
  "credit": { "limit": 6000, "closingDay": 3, "dueDay": 10 } }
```

`credit` é `null` numa conta sem cartão (e **sempre presente** na resposta).

| Rota | Mudança |
| --- | --- |
| `POST /v1/cards` | Aceita `credit?: { limit? (≥ 0 ou null), closingDay (1 a 31), dueDay (1 a 31) }`. |
| `PATCH /v1/cards/:id` | Aceita `credit` com os mesmos campos, ou `credit: null` para tirar o cartão. |
| `GET /v1/cards`, `GET /v1/cards/:id` | Devolvem `credit`. |

- **`balance` não soma** as transações com `payment_method = 'credit'`. Fica `saldo inicial + soma das demais`.
- `PATCH` com `credit: null` numa conta que **já tem compras no crédito** responde `409` `credit_in_use` (a mensagem diz que é preciso passar ou excluir as compras).
- Mudar `closingDay` ou `dueDay` vale para **todas** as faturas, também as passadas (nada é gravado por fatura).

### 4.2 Transações

O objeto transação ganha dois campos:

```json
{ "...": "...", "paymentMethod": "credit", "invoiceMonth": null }
```

- `paymentMethod`: `"pix"`, `"debit"`, `"credit"` ou `null` (as antigas, receitas, transferências e pagamentos de fatura).
- `invoiceMonth`: `AAAA-MM` **só** nos pagamentos de fatura (categoria `invoice`); `null` nas demais.

| Rota | Mudança |
| --- | --- |
| `POST /v1/transactions` | Aceita `paymentMethod?`. |
| `PATCH /v1/transactions/:id` | Aceita `paymentMethod` (string ou `null`). Com `applyToNext: true` a recorrência de origem também muda. |
| `GET /v1/transactions` | Novo filtro `paymentMethod=credit` (aceita os três valores). |

Regras (todas `400` `validation_failed`, com `fields[].path = "paymentMethod"`):

- Só vale em **despesa**. Em receita, `paymentMethod` é recusado; se uma despesa vira receita pelo `PATCH`, o método vira `null` sozinho (como a recorrência já é encerrada).
- `pix` e `debit` valem em **qualquer** conta (com ou sem cartão); só o `credit` depende do cartão.
- `credit` exige que a conta da transação **tenha cartão**: "Esta conta não tem cartão de crédito.". Trocar o `cardId` para uma conta sem cartão numa transação no crédito é recusado do mesmo jeito.
- Não vale na categoria `transfer` nem na `invoice`.

Pagamento de fatura (`categoryId = "invoice"`):

- **Não se edita**: `PATCH` responde `409` `invoice_payment_not_editable`. Para desfazer, `DELETE /v1/transactions/:id` (a fatura volta a ficar em aberto).
- Criar pela rota `POST /v1/transactions` com essa categoria é recusado: use a rota abaixo.

### 4.3 Pagar a fatura (nova)

`POST /v1/cards/:id/invoice-payments` — paga (parte de) uma fatura do cartão da conta `:id`, **com o saldo dessa mesma conta**.

- **Corpo:** `{ "month": "2026-11", "amount": 1239.37, "occurredAt": "2026-10-16T12:00:00.000Z" }`
  - `month`: a chave da fatura (seção 2). `amount`: positivo. `occurredAt`: o dia do pagamento, ao meio-dia UTC (como as transações).
- **Resposta `201`:** a transação criada: despesa na conta `:id`, `categoryId: "invoice"`, `name: "Fatura Nubank nov/2026"`, `amount` negativo, `paymentMethod: null`, `invoiceMonth: "2026-11"`.
- O servidor **não limita** o valor ao total da fatura (o app limita na tela). Pagar a mais fica registrado e o saldo acompanha.
- Aceita `Idempotency-Key`.
- **Erros:** `404` conta que não é sua · `400` `validation_failed` (conta sem cartão, `month` inválido, valor zero ou negativo).

### 4.4 Recorrências

O objeto recorrência ganha `paymentMethod` (`"pix"`, `"debit"`, `"credit"` ou `null`).

- `POST /v1/transactions` com `repeat` grava o método na recorrência, e **cada ocorrência gerada o herda**. Parcelado no crédito vira uma parcela por fatura.
- `PATCH` com `applyToNext: true` copia o `paymentMethod` para a recorrência.
- Se a conta de uma recorrência no crédito perde o cartão, o `409` `credit_in_use` da seção 4.1 vale também (conta recorrências ativas).

### 4.5 Categorias

`GET /v1/categories` passa a devolver também `invoice` (como já devolve `transfer`). O app a esconde das listas de escolha.

### 4.6 Relatórios

`GET /v1/reports/monthly-totals` e `category-totals`:

- **Incluem** as compras no crédito, **na data da compra** (é quando o gasto aconteceu).
- **Excluem** as transações da categoria `invoice` (o pagamento da fatura não é gasto), como já excluem `transfer`.

### 4.7 Backup

`schemaVersion` passa a **9**. Arquivos das versões 1 a 8 continuam aceitos (os campos novos entram como `null`).

- `cards`: `credit_limit`, `closing_day`, `due_day`.
- `transactions`: `payment_method`, `invoice_month`.
- `recurrences`: `payment_method`.
- Validação nova: `credit` só em despesa e em conta com `closing_day`; categoria `invoice` exige `invoice_month` e valor negativo.

## 5. Erros novos

| Status | `code` | Quando | O que o app faz |
| --- | --- | --- | --- |
| 409 | `credit_in_use` | Tirar o cartão de uma conta que tem compras no crédito | Mostra a mensagem |
| 409 | `invoice_payment_not_editable` | Editar um pagamento de fatura | Oferece excluir |

## 6. Compatibilidade

- Nenhum campo existente muda de nome ou formato. Um app antigo continua funcionando: vê as compras no crédito como despesas comuns e o saldo (calculado no servidor) já sai certo.
- Não é preciso subir a versão mínima (`X-App-Version`).
- O pagamento de fatura aparece num app antigo como uma despesa de categoria desconhecida; só acontece depois de alguém ligar o cartão numa conta, o que o app antigo não faz.

## 7. Testes sugeridos

- `balance` não muda ao criar uma compra no crédito e cai ao pagar a fatura; excluir o pagamento devolve o saldo.
- `monthly-totals` e `category-totals` contam a compra no crédito no mês da compra e ignoram o pagamento da fatura.
- `paymentMethod: "credit"` em conta sem cartão, em receita, em transferência: todos `400`.
- `credit: null` com compras no crédito: `409` `credit_in_use`.
- Parcelado no crédito gera as parcelas seguintes com `paymentMethod: "credit"`.
- Backup 9 exportado e restaurado mantém `credit`, `paymentMethod` e `invoiceMonth`; um backup 8 entra com tudo `null`.
- Dia de fechamento 31 e mês de 30 dias; compra no dia do fechamento e no dia seguinte.
