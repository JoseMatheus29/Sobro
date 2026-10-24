# API: o mês em que o gasto conta

O que a API (`Sobro - Api`) precisa mudar para que um gasto no **crédito** conte no mês em que a fatura **vence** (quando o dinheiro sai), e não no mês da compra. Pix, débito e dinheiro continuam no mês da data. Tudo é **aditivo**: o que já existe mantém o comportamento, e um app antigo continua funcionando como hoje.

Este documento segue o formato do [api-cartao-credito.md](api-cartao-credito.md), que define a fatura e o vencimento.

## 1. O modelo em uma tela

- Cada transação ganha o **mês do gasto** (`spendingMonth`, `AAAA-MM`), guardado no banco e devolvido pela API.
  - **Despesa no crédito:** o mês do **vencimento** da fatura que a recebe.
  - **Todo o resto** (Pix, débito, sem forma de pagamento, receitas, transferências, pagamento de fatura): o mês da data, como hoje.
- A compra continua tendo a **data** em que foi feita. O saldo das contas e as faturas **não mudam**: só muda em qual mês cada gasto é somado.
- O pagamento da fatura e as transferências continuam **fora** dos gastos (categorias `invoice` e `transfer`), então nada conta duas vezes.
- A **lista por data** (`?month=`) e os relatórios por data continuam existindo e sendo o padrão. O mês do gasto entra por parâmetros novos. Um app antigo não percebe nada.

## 2. A regra (igual no app e no servidor)

Parte das regras da fatura do [api-cartao-credito.md](api-cartao-credito.md), que não mudam. Sejam `C` o dia de fechamento e `D` o de vencimento (1 a 31); um dia 29, 30 ou 31 num mês mais curto cai no **último dia do mês**.

1. A **fatura** que recebe a compra do dia `d`: a do mês de `d` se `dia(d) <= C` (o dia do fechamento ainda entra, com `C` limitado ao último dia do mês); senão, a do mês seguinte. A chave da fatura continua sendo o mês em que ela **fecha**.
2. O **mês de vencimento** da fatura `M`: `M` se `D > C`; senão, o mês seguinte a `M`. A comparação é entre os números `D` e `C`, sem olhar o mês.
3. `spendingMonth` = o mês de vencimento da fatura do passo 1, se a transação é uma **despesa no crédito**. Em qualquer outro caso, `AAAA-MM` do dia da transação (UTC; as datas já são gravadas ao meio-dia UTC, então é o dia do calendário).

Exemplos:

| Cartão | Compra | Fatura (fecha em) | Vence em | `spendingMonth` |
| --- | --- | --- | --- | --- |
| `C=3`, `D=10` | 27/10 | `2026-11` (03/11) | 10/11 | `2026-11` |
| `C=3`, `D=10` | 03/11 | `2026-11` (03/11) | 10/11 | `2026-11` |
| `C=3`, `D=10` | 05/11 | `2026-12` (03/12) | 10/12 | `2026-12` |
| `C=25`, `D=5` | 25/10 | `2026-10` (25/10) | 05/11 | `2026-11` |
| `C=25`, `D=5` | 27/10 | `2026-11` (25/11) | 05/12 | `2026-12` |
| `C=31`, `D=5` | 28/02 | `2026-02` (28/02) | 05/03 | `2026-03` |
| qualquer | Pix de 27/10 | n/a | n/a | `2026-10` |

**Nome da fatura no app.** A chave da fatura (`invoiceMonth` dos pagamentos, o `:month` das rotas) continua sendo o mês do **fechamento**. O app passa a **mostrar** a fatura pelo mês do vencimento ("Fatura dez" para a que fecha em 25/11 e vence em 05/12), para o nome da fatura ser o mesmo mês em que o gasto conta. Isso é só exibição: a API não muda por causa do nome. Para cartões com `D > C` (como `C=3`, `D=10`) o nome não muda.

Casos de borda, para não surpreender:

- `C=30` e `D=31`: como `D > C`, o vencimento fica no mês do fechamento. Num mês de 30 dias o fechamento e o vencimento caem no mesmo dia (30). É assim no app hoje e fica assim.
- Fevereiro com `C=29`, `30` ou `31`: fecha no dia 28 (ou 29 em ano bissexto). Uma compra feita no dia 28 ainda entra.

## 3. Banco (migração `0007`)

```sql
ALTER TABLE transactions ADD COLUMN spending_month text;

-- Preenche o que já existe. Fora do crédito: o mês da data. No crédito: o mês de vencimento da fatura.
UPDATE transactions t
SET spending_month = to_char(
  date_trunc('month', t.occurred_at AT TIME ZONE 'UTC')
    + (
      CASE
        WHEN t.payment_method = 'credit' AND c.closing_day IS NOT NULL THEN
          -- 0 se a compra entra na fatura do próprio mês, 1 se entra na do mês seguinte
          (CASE WHEN extract(day FROM t.occurred_at AT TIME ZONE 'UTC') <=
                     LEAST(c.closing_day,
                           extract(day FROM (date_trunc('month', t.occurred_at AT TIME ZONE 'UTC')
                                             + interval '1 month - 1 day')))
                THEN 0 ELSE 1 END)
          -- 0 se a fatura vence no mês em que fecha, 1 se vence no mês seguinte
          + (CASE WHEN c.due_day > c.closing_day THEN 0 ELSE 1 END)
        ELSE 0
      END
    ) * interval '1 month',
  'YYYY-MM')
FROM cards c
WHERE c.id = t.card_id;

ALTER TABLE transactions
  ALTER COLUMN spending_month SET NOT NULL,
  ADD CONSTRAINT transactions_spending_month_format CHECK (spending_month ~ '^[0-9]{4}-(0[1-9]|1[0-2])$');
CREATE INDEX transactions_user_spending_month_idx ON transactions (user_id, spending_month);
```

Conferir a migração antes de aplicar no Heroku: rodar o `UPDATE` num banco de teste e comparar com a função do servidor (seção 4.1) em todas as transações.

## 4. Rotas

### 4.1 Onde o servidor calcula `spendingMonth`

Uma função só, `spendingMonthOf(occurredAt, paymentMethod, card)`, usada em **todos** estes pontos (nenhum deles pode esquecer):

- criar transação (`POST /v1/transactions`) e criar transferência;
- editar transação (`PATCH`): refazer quando mudar a data, a forma de pagamento, a conta ou o tipo, inclusive com `applyToNext`;
- gerar as ocorrências vencidas das recorrências (`materializeDue`);
- criar o pagamento de fatura (`POST /v1/cards/:id/invoice-payments`);
- **editar a conta**: quando `closing_day` ou `due_day` mudam, refazer `spending_month` de todas as transações **no crédito daquela conta**, na mesma transação do banco que atualiza o cartão;
- restaurar um backup (`PUT /v1/backup`), depois de gravar as contas e as transações.

### 4.2 Transações

Toda resposta que traz uma transação (lista, detalhe, criação, edição, transferência) ganha:

```json
{ "spendingMonth": "2026-12" }
```

`GET /v1/transactions` ganha o filtro **`spendingMonth=AAAA-MM`**, que seleciona as transações com esse mês do gasto. `month=` continua filtrando pela **data** e funciona como hoje. Se os dois vierem, valem os dois. A ordem e a paginação por cursor não mudam (continuam por `occurredAt`).

### 4.3 Relatórios

`GET /v1/reports/monthly-totals` e `GET /v1/reports/category-totals` ganham o parâmetro **`by`**:

- `by=date` (padrão, igual a hoje): agrupa pela data.
- `by=spending`: agrupa por `spending_month`.

Nos dois modos continuam **excluídas** as categorias `invoice` e `transfer`. `category-totals?month=AAAA-MM&by=spending` soma as despesas desse mês do gasto.

### 4.4 Backup

`spending_month` é derivado, então **não vai no arquivo**. A `schemaVersion` continua **9**. Ao restaurar, o servidor calcula o campo depois de gravar contas e transações (4.1).

### 4.5 O que não muda

- Contas, saldos, faturas (a chave continua o mês do fechamento), pagamentos de fatura e o `invoiceMonth`.
- `month=` na lista e `by=date` nos relatórios.
- Nenhuma rota nova e nenhum campo existente muda de nome ou formato.

## 5. Erros novos

Nenhum. `spendingMonth` inválido em `GET /v1/transactions` ou `by` desconhecido em `/v1/reports/*` devolvem `400 validation_failed`, como os outros filtros.

## 6. Compatibilidade

- Um app antigo não manda `spendingMonth` nem `by`: tudo igual a hoje. **Não é preciso subir a versão mínima.**
- O app novo trata a ausência de `spendingMonth` nas respostas como "a API ainda não tem": cai no comportamento de hoje (por data), sem quebrar. A API e o app podem sair em qualquer ordem.
- Os totais de meses passados vão mudar no app novo (compras no crédito do fim do mês passam para o mês seguinte). É uma mudança visível: vale avisar os usuários.

## 7. Testes sugeridos

- A tabela de exemplos da seção 2, cada linha, na função `spendingMonthOf` **e** no `UPDATE` da migração (as duas respostas iguais).
- Dia do fechamento: a compra no dia `C` entra na fatura do mês; no dia seguinte, na do mês seguinte. Fevereiro com `C=31`, e `C=30` com `D=31`.
- Pix, débito, receita, transferência e `paymentMethod` nulo: `spendingMonth` é o mês da data.
- Editar a data de uma compra no crédito de um lado a outro do fechamento muda `spendingMonth`; trocar `credit` por `pix` volta ao mês da data.
- Mudar `closing_day`/`due_day` de uma conta refaz o `spending_month` das compras no crédito dela e **só** delas.
- Parcelado no crédito: cada parcela gerada por `materializeDue` nasce com o `spendingMonth` da sua própria fatura (3/4 numa fatura, 4/4 na seguinte).
- `GET /transactions?spendingMonth=` devolve a compra de 27/10 (`C=25`, `D=5`) em `2026-12` e não em `2026-10`; `?month=2026-10` continua devolvendo a compra.
- `monthly-totals?by=spending` e `by=date` somam o mesmo total no conjunto de todos os meses; `by=spending` ignora o pagamento da fatura.
- Backup exportado e restaurado mantém os mesmos `spendingMonth`; um backup antigo entra com o campo calculado.
- Dois usuários com a mesma regra não enxergam o mês um do outro (todas as consultas filtram por `user_id`).

## 8. O que o app muda depois da API

- `utils/invoice.ts` ganha o mês do vencimento (`dueOn` já existe) e o **nome da fatura** passa a ser o mês do vencimento nas etiquetas ("Fatura dez"), nos títulos da fatura, nas dicas ao cadastrar e nas mensagens.
- Detalhamento, Início, dicas, Histórico, orçamento e limites usam o mês do gasto (`spendingMonth`); a lista de cada um mostra a data da compra e a etiqueta da fatura.
- A **Carteira continua por data** (é o extrato da conta), com a etiqueta da fatura em cada compra no crédito.
- As parcelas e recorrências **previstas** (que só o app calcula) passam a ser agrupadas pelo mês do vencimento da fatura delas.
- Fica no CLAUDE.md a regra de que o crédito conta no mês do vencimento.
