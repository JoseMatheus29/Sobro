# API: excluir uma recorrência com tudo o que ela lançou

O que a API (`Sobro - Api`) precisa ganhar para o app poder **excluir uma recorrência e todos os lançamentos dela**. É uma rota nova e nada existente muda: o app antigo continua funcionando, e o app novo, contra uma API que ainda não tem a rota, recebe `404` e mostra o erro de sempre ("Rota não encontrada").

Este documento segue o formato de [api-perfis.md](api-perfis.md).

## 1. O problema

Hoje, para se livrar de uma recorrência criada por engano, só há:

- `POST /recurrences/:id/end`: para de gerar, mas **o que já foi gerado fica**;
- `DELETE /transactions/:id`: apaga **uma** ocorrência. Uma ocorrência excluída **não** é gerada de novo, mas a recorrência continua gerando as dos outros meses.

Quem cadastrou uma recorrência e excluiu só uma ocorrência fica com todas as outras, sem saída pelo app.

## 2. A rota

`DELETE /v1/recurrences/:id`

- Sem corpo.
- **`204`**: apagou a recorrência **e todas as transações com `recurrence_id = :id`** (a primeira, lançada à mão, e as geradas), de **todos os meses**, no mesmo passo.
- **`404` `not_found`** se o id não for de uma recorrência do dono dos dados (a mesma resposta para o id de outra pessoa e para um que não existe). Um `DELETE` repetido também responde `404`, e o app conta isso como feito.
- `400` para um id que não é inteiro.
- É uma **rota de dados**: respeita `X-Profile-Id` (veja [api-perfis.md](api-perfis.md)) e usa `req.userId`.
- Os saldos das contas mudam (as transações saem), então o app lê tudo de novo depois.

## 3. A ordem importa

`transactions.recurrence_id` é `ON DELETE SET NULL`. Apagar só a linha de `recurrences` **deixaria as transações soltas** (viram transações comuns, sem a ligação). Por isso as transações saem **primeiro**, e a recorrência depois, **na mesma transação do banco**: se algo falhar, nada muda.

Travar a linha da recorrência (`FOR UPDATE`) faz uma geração simultânea (`materializeDue`, que trava as mesmas linhas) esperar, em vez de criar parcelas no meio da exclusão.

## 4. Serviço sugerido

Em `src/services/recurrences.ts`:

```ts
// Exclui a recorrência e TODAS as transações que ela fez, de todos os meses. Apagar só a linha da recorrência
// deixaria as transações soltas (a chave estrangeira as desliga dela), por isso elas saem primeiro.
export function deleteRecurrence(db: Db, userId: string, id: number): Promise<void> {
  return db.transaction(async (tx) => {
    const [row] = await tx
      .select({ id: recurrences.id })
      .from(recurrences)
      .where(and(eq(recurrences.userId, userId), eq(recurrences.id, id)))
      .for('update');
    if (!row) throw notFound('Recorrência não encontrada.');

    await tx.delete(transactions).where(and(eq(transactions.userId, userId), eq(transactions.recurrenceId, id)));
    await tx.delete(recurrences).where(and(eq(recurrences.userId, userId), eq(recurrences.id, id)));
  });
}
```

Em `src/controllers/recurrences.controller.ts`:

```ts
// Exclui a recorrência e tudo o que ela lançou.
const remove: Handler = async (req, reply) => {
  await deleteRecurrence(ctx.db, req.userId, idParam.parse(req.params).id);
  return reply.code(204).send();
};
// e `remove` no objeto devolvido: return { list, get, end, generateDue, remove };
```

Em `src/routes/resources.ts`, dentro de `recurrencesRoutes`:

```ts
app.delete('/recurrences/:id', c.remove);
```

## 5. Documentação e testes

- `api-rotas-e-consumo-mobile.md`, tabela da seção 3.8, uma linha: `DELETE /v1/recurrences/:id` · `204` · "Apaga a recorrência **e todas as transações dela**, de todos os meses. `404` se não for sua."
- A coleção do Postman ganha a rota.
- Testes (`test/data.test.ts`, com "hoje" fixo em 10/10/2026):
  - uma mensal criada em 05/07 tem 4 ocorrências (jul, ago, set, out); excluir uma à mão e depois `DELETE /recurrences/:id` deixa só as transações que **não** eram dela, `GET /recurrences` volta `[]` e `POST /recurrences/materialize` responde `{ created: 0 }`;
  - um plano de parcelas também some por inteiro;
  - o saldo da conta volta ao que era sem a recorrência;
  - `DELETE` repetido responde `404`.
- `test/isolation.test.ts`, no teste de recorrências: `bob.del('/recurrences/<id da Alice>')` responde `404` e a recorrência da Alice continua (`alice.get` com `endMonth` nulo).
- Com `X-Profile-Id`, exclui a do perfil gerenciado e não toca na do ator.

## 6. O que o app faz

No card "Recorrência" dos detalhes de uma transação que veio de uma recorrência, o botão **"Excluir recorrência e todos os lançamentos"** (sempre visível, também depois de encerrada ou da última parcela) pede confirmação com o nome da recorrência e chama a rota. Depois lê tudo de novo, mostra o aviso e volta, porque a transação que estava aberta deixou de existir.

## 7. Enquanto a API não tem a rota

Quem precisa limpar agora pode usar SQL direto no banco (apague as transações antes da recorrência, na mesma transação do banco):

```sql
BEGIN;
DELETE FROM transactions WHERE recurrence_id = 123;
DELETE FROM recurrences  WHERE id = 123;
COMMIT;
```
