# Prompt: levar para a API as novidades do app (caixinhas e backup v8)

Cole o texto abaixo, a partir da linha de baixo do `---`, numa sessão do Claude aberta em `C:\Users\Jmatheus\Desktop\Sobro - Api`.
A sessão só precisa de leitura no repositório do app (`C:\Users\Jmatheus\Desktop\jm`); se ela não tiver acesso a essa pasta, adicione-a à sessão.

---

Você vai atualizar a API do **Sobrô?** (este repositório) para acompanhar o app, que ganhou três coisas desde que a API foi escrita (ela está no esquema v6 do app; o app está na v8):

1. **Caixinhas** (v8): as tabelas `goals` e `goal_entries`.
2. **Backup v8**: o arquivo que o app exporta agora traz `goals`, `goal_entries` e `profile.theme`, e a API precisa exportar e importar no mesmo formato.

O **tema** (`profile.theme`, v7) **fica só no app**: é preferência do aparelho e precisa valer antes do login. A API não tem coluna, campo em `/me` nem validação de tema; ela só aceita a coluna `theme` num backup e a descarta, como já faz com `avatar_uri` e `monthly_budget`.

Só isso. Não refatore o que já funciona, não mude contratos existentes e não toque na pasta `dist/` (é saída de build).

## 1. Leia antes de escrever

**Neste repositório** (a API, Fastify 5 + Drizzle + Postgres, em camadas `routes → controllers → services`, com regras puras em `src/shared`):

- `README.md` (estrutura, convenções da API, como rodar os testes) e `api-requisitos-e-hospedagem.md`.
- `src/db/schema.ts` e `drizzle/` (migrações 0000 a 0003).
- `src/services/cards.ts` e `src/controllers/cards.controller.ts`: o modelo a copiar para um recurso novo (`runIdempotent`, `sendCreated`, `idParam`, 404 para id de outro usuário, `Executor`/`Db`/`Tx`).
- `src/services/profile.ts` e `src/controllers/me.controller.ts`.
- `src/shared/backup.ts`, `src/services/backup.ts` e `test/reports-backup.test.ts`.
- `src/routes/index.ts` e `src/routes/resources.ts` (onde as rotas são ligadas).
- `test/helpers.ts` (`makeApp`, `signup`, `noon`), `test/isolation.test.ts` e `test/shared.test.ts`.

**No app** (somente leitura, `C:\Users\Jmatheus\Desktop\jm`):

- `db/schema.ts`: migração v8 (`goals`, `goal_entries`).
- `db/goals.ts`: as consultas das caixinhas (o `saved` é `SUM(amount)` das movimentações).
- `utils/goals.ts` e `utils/goals-type.ts` (`movementProblem`, `GOAL_NAME_MAX_LENGTH` = 30, `GOAL_MAX_MONTHS_AHEAD` = 120).
- `utils/backup-type.ts` e `utils/backup.ts`: o formato do backup (`BACKUP_TABLES`). O `src/shared/backup.ts` da API é uma versão mais rígida deste; mantenha a diferença (a API valida contra o catálogo de categorias dela e confere sinais, parcelas e meses).
- `docs/api-requisitos-e-hospedagem.md` do app: tem as tabelas e os endpoints de caixinhas já especificados (linhas de `goals`, `goal_entries` e `/goals`). A cópia da API não tem. Compare as duas com `diff` e **junte** as diferenças, sem sobrescrever o que for específico da API.

## 2. O que fazer, em commits pequenos e nesta ordem

### Etapa 1: banco

Em `src/db/schema.ts`:

- `goals`: `id` (identity), `user_id` (cascade), `name`, `target_amount` (`money`, `check > 0`), `target_month` (`text` nulo, `check` no formato `AAAA-MM`), `color`, `icon`, `created_at`. Índice em `user_id`.
- `goal_entries`: `id` (identity), `user_id` (cascade), `goal_id` (cascade, para `goals`), `amount` (`money`, `check <> 0`), `occurred_at` (`timestamptz`), `created_at`. Índice em `(user_id, goal_id)`.

Depois rode `npx drizzle-kit generate --name goals` e comite o SQL e o snapshot gerados (`drizzle/0004_*`). Nunca edite uma migração já aplicada. Não mexa em `profile`.

### Etapa 2: caixinhas

Crie `src/shared/goals.ts` com `movementProblem` portado de `utils/goals.ts` (a comparação em centavos incluída). **Não** porte `goalProgress`, `totalReserved` nem `freeBalance`: o cálculo de progresso fica no app.

Crie `src/services/goals.ts`, `src/controllers/goals.controller.ts` e `goalsRoutes` em `src/routes/resources.ts`, ligando tudo em `src/routes/index.ts`. Endpoints (todos sob `/v1`, autenticados, filtrando por `user_id` do token; id de outro usuário responde 404):

| Rota | O que faz |
| --- | --- |
| `GET /goals` | Lista (do id menor ao maior). Cada item: `{ id, name, targetAmount, targetMonth, color, icon, saved }`, com `saved` calculado por subconsulta (`coalesce(sum(amount), 0)`), nunca gravado. |
| `POST /goals` | Cria. Aceita `Idempotency-Key` (escopo `POST /goals`). Responde 201 com o item. |
| `GET /goals/:id` | Um item. |
| `PATCH /goals/:id` | Edita `name`, `targetAmount`, `targetMonth`, `color`, `icon` (todos opcionais). |
| `DELETE /goals/:id` | Apaga a caixinha e o histórico. **Não mexe em nenhuma conta nem em transação.** 204. |
| `GET /goals/:id/entries` | Histórico, do mais novo ao mais antigo (`occurred_at desc, id desc`), `{ id, goalId, amount, occurredAt }`. O app mostra esse histórico; acrescente esta rota à especificação. |
| `POST /goals/:id/entries` | Guarda ou retira. Aceita `Idempotency-Key` (escopo `POST /goals/entries`). |
| `DELETE /goals/:id/entries/:entryId` | Apaga uma movimentação. 204. |

Validações (Zod, em português, no estilo dos outros controllers):

- `name`: `requiredText(30)`. `targetAmount`: `positiveMoney`. `color`: `hexColor`. `icon`: `requiredText(40)`.
- `targetMonth`: `month` (AAAA-MM) ou `null`, no máximo 120 meses à frente do mês atual (use `ctx.now()` e `addMonths` de `shared/month.ts`). Mês no passado é aceito.
- Entrada de movimentação: `amount` **com sinal** (positivo guarda, negativo retira; diferente das transações, e já está assim na especificação), diferente de zero e dentro de `signedMoney`. `occurredAt` opcional, padrão `ctx.now()`; guarde o instante como veio (não normalize para meio-dia, ao contrário das transações: o histórico é ordenado pelo horário e não entra em total de mês).

Regras de negócio:

- Retirar mais do que há na caixinha é recusado com **409** e `code: 'goal_insufficient'`, mensagem em português com o valor disponível. Use `movementProblem` para decidir.
- A checagem e a gravação ficam na **mesma transação**, travando a linha da caixinha (`select … for update`, como `deleteCard` faz com as contas). Duas retiradas simultâneas não podem passar do saldo.
- Apagar uma movimentação de depósito que deixaria o valor da caixinha negativo também é recusado com 409 (`goal_insufficient`).
- Caixinha e movimentações **não** entram em saldo de conta, nem em `/reports/*`, nem em `listTransactions`. Não altere esses serviços.
- `deleteAccount` já apaga tudo pelo `on delete cascade` do `user_id`; confirme em teste que as caixinhas também vão.

### Etapa 3: backup v8

Em `src/shared/backup.ts`:

- `BACKUP_SCHEMA_VERSION = 8`. Inclua `goals` e `goal_entries` em `BackupTableName` e em `BACKUP_TABLES`, **depois** de `category_budgets`, com as colunas do app (`utils/backup-type.ts`): `goals(id, name, target_amount, target_month?, color, icon)` e `goal_entries(id, goal_id, amount, occurred_at)`.
- `profile` **não** ganha `theme` na lista de colunas: colunas fora da lista já são descartadas na importação, então um arquivo do app v8 com `theme` entra normalmente.
- `validateBackup` continua aceitando arquivos de **qualquer versão de 1 a 8** (tabelas ausentes viram lista vazia, colunas novas usam o `fallback`) e passa a conferir: `goals` com ids sem repetição; `goal_entries.goal_id` apontando para uma caixinha do arquivo; `occurred_at` de `goal_entries` com data válida; `target_amount > 0`; `target_month` no formato AAAA-MM; `amount` de movimentação diferente de zero; e a soma de cada caixinha não negativa. Cada falha com um motivo novo em `BACKUP_REASONS`, no mesmo tom dos existentes.- Mantenha `avatar_uri` e `monthly_budget` do perfil sendo descartados, como já é.

Em `src/services/backup.ts`:

- `exportBackup` lê também `goals` e `goal_entries` (dentro da mesma transação `repeatable read` que já existe). Ordene por `id`. A linha do perfil exportada ganha `theme: 'system'`, do mesmo jeito que já leva `avatar_uri: null`, só para o arquivo ter o formato do app (o app trata o campo como opcional).
- `restoreBackup` apaga `goal_entries` e `goals` do usuário junto com o resto (primeiro as movimentações), não toca em tema, recria as caixinhas **refazendo os ids** (mapa id antigo para id novo) e recria as movimentações apontando para o id novo. As datas das movimentações ficam como vieram (instante, sem `calendarNoon`).
- Continua uma única transação SQL: se algo falhar, nada muda.

### Etapa 4: testes

Rode `npm run test:db` antes (Postgres de teste na porta 5433) e use os helpers de `test/helpers.ts`. Escreva os testes novos no estilo dos existentes (`test/goals.test.ts` para as caixinhas) e ajuste os que quebram por causa da v8:

- **Caixinhas:** criar, editar, listar com `saved` somando depósitos e retiradas; retirar mais que o guardado dá 409 `goal_insufficient` e não grava nada; duas retiradas em paralelo (`Promise.all`) que juntas passam do saldo: só uma vale; apagar um depósito que deixaria o saldo negativo dá 409; apagar a caixinha leva o histórico e **deixa saldo das contas e `/reports/*` iguais** (compare antes e depois); `Idempotency-Key` repetida no `POST /goals` e no `POST /goals/:id/entries` não duplica e devolve o cabeçalho `Idempotent-Replayed`; validações (nome com 31 caracteres, valor zero, mês 121 à frente, formato do mês).
- **Isolamento** (`test/isolation.test.ts`): o outro usuário recebe 404 em `GET`, `PATCH`, `DELETE` de `/goals/:id` e em todas as rotas de entradas; a listagem dele não traz a caixinha da Alice; criar movimentação em caixinha alheia responde 404.
- **Backup** (`test/reports-backup.test.ts`): exporta com `schemaVersion: 8` e as chaves `goals` e `goal_entries`, com o perfil trazendo `theme: 'system'`; importa de volta refazendo os ids, com `saved` igual ao de antes; aceita arquivos de **versão 1, 4, 6 e 8** (os de 1 a 6 sem as tabelas novas; o de 8 com `theme: 'dark'` no perfil, que é aceito e descartado, e `GET /me` continua sem campo de tema); recusa e não muda nada nos casos novos (caixinha com id repetido, movimentação apontando para caixinha inexistente, `target_amount` zero, `target_month` inválido, soma negativa). Atualize os casos antigos: o teste de "esquema mais novo" passa a usar `schemaVersion: 9`, e a lista de chaves e a linha do perfil esperadas mudam.
- **Compartilhado** (`test/shared.test.ts`): `movementProblem`, com os mesmos casos de `utils/goals.test.ts` do app.

Peça-me um backup real exportado do app v8 e use-o como fixture de uma importação (o teste de ida e volta com esse arquivo é o melhor sinal de que o formato bate).

### Etapa 5: documentação e coleção

- `README.md`: nada novo de estrutura; só inclua em "Convenções da API" que o `amount` de `POST /goals/:id/entries` é **com sinal** e que `saved` vem calculado.
- `api-requisitos-e-hospedagem.md`: leve para cá as linhas de `goals`, `goal_entries` e `/goals` (incluindo o `GET /goals/:id/entries`) e o backup v8. O tema não entra: diga ali que ele fica só no app e que o backup o descarta.
- `postman/sobro-api.postman_collection.json`: uma pasta **Caixinhas** (criar, listar, editar, guardar, retirar, histórico, apagar movimentação, excluir caixinha) guardando os ids nas variáveis da coleção como as outras pastas. O Runner precisa continuar rodando de ponta a ponta e terminando com a conta de teste excluída.

## 3. Como trabalhar

- Textos que o usuário lê (mensagens de erro) em português do Brasil; código e comentários no mesmo estilo do repositório (os comentários existentes estão em português, curtos, só onde o motivo não é óbvio). Siga o que você ver nos arquivos vizinhos.
- Não invente endpoint, campo ou regra fora do que está aqui e na especificação. Se faltar algo ou houver dúvida, pergunte com uma recomendação.
- Um commit por etapa, rodando `npm run typecheck` e `npm test` antes de cada um. Não comite `.env`.
- Não use dado real nos testes e não registre valores financeiros em log.

## 4. Pronto quando

- `npm run typecheck` e `npm test` passam, incluindo os testes novos e os ajustados.
- `npx drizzle-kit generate` não gera mais nada (schema e migrações em dia) e `npm run db:migrate` aplica a 0004 sobre um banco que já está na 0003.
- Um backup real exportado pelo app v8 entra com `PUT /backup`, e `GET /backup` devolve o mesmo conteúdo (ids refeitos, caixinhas com o mesmo `saved`).
- O Runner do Postman termina sem falhas.
- No final, me diga o que foi feito, o que ficou de fora e qualquer decisão que você tenha tomado por conta própria.
