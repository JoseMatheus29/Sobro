# API: perfis gerenciados

O que a API (`Sobro - Api`) precisa mudar para uma pessoa cuidar das finanças de outra a partir da **mesma conta**. Exemplo: eu tenho as minhas contas e também cuido das da minha mãe, e quero alternar entre as duas no app sem sair e entrar de novo. Tudo é **aditivo**: quem não usa a função não percebe nada, e um app antigo continua funcionando.

Este documento segue o formato do [api-cartao-credito.md](api-cartao-credito.md) e do [api-mes-do-gasto.md](api-mes-do-gasto.md).

## 1. O modelo em uma tela

- Hoje cada pessoa é uma linha em `users` e **todo dado financeiro** (contas, transações, categorias próprias, caixinhas, recorrências, orçamentos, chaves de idempotência) aponta para ela por `user_id`. Todo serviço já recebe esse `userId` e filtra por ele.
- Um **perfil gerenciado** é uma linha em `users` **sem login** (sem e-mail e sem senha), com o seu próprio `profile` (nome, moeda, lembretes). Ele é o dono dos dados da pessoa cuidada (a mãe). Como os dados já apontam para um `users.id`, **nenhuma tabela de dados muda**.
- Uma tabela nova, `profile_access`, diz **quem pode gerenciar quem**.
- Uma requisição passa a ter dois ids:
  - **quem fez** (`actorId`): o usuário do token, sempre. É quem tem login.
  - **de quem são os dados** (`userId`, o nome que os serviços já usam): por padrão o mesmo; com o cabeçalho **`X-Profile-Id`**, o perfil gerenciado escolhido, se o ator tiver acesso a ele.
- Por isso os serviços de contas, transações, caixinhas, recorrências, orçamentos, relatórios e backup **não mudam**: continuam recebendo o `userId` e filtrando por ele. Só mudam a autenticação e as rotas de conta.

Cuidado com os nomes: já existe uma tabela chamada `profile` (singular), que guarda as preferências de **cada** usuário (nome, moeda, lembretes). Ela não muda e **não é** o perfil gerenciado. O conceito novo se chama "perfil gerenciado" (`users.kind = 'managed'`), e as rotas são `/profiles` (plural).

## 2. As regras

1. **Quem tem login** (`kind = 'self'`) é o único que se autentica, tem refresh token e recebe e-mail. O perfil gerenciado (`kind = 'managed'`) nunca se autentica.
2. `X-Profile-Id` é opcional.
   - **Ausente**, ou igual ao id do próprio ator: os dados são do ator, como hoje.
   - **Presente e diferente**: o servidor confere em `profile_access` se existe `(owner_id = X-Profile-Id, manager_id = ator)`. Se não existir (ou o id nem existir), responde **403 `profile_forbidden`**, com a mesma resposta nos dois casos, para ninguém descobrir quais ids existem.
3. **Rotas de conta ignoram o cabeçalho** e usam sempre o ator: `/auth/*`, `GET/PATCH/DELETE /me` e `/profiles/*`. Rotas de dados (todas as outras) usam o dono escolhido.
4. O acesso é conferido **em toda requisição**, no servidor. O app não decide nada e o token não leva o perfil.
5. Um ator pode gerenciar até **5** perfis (configurável em `MAX_MANAGED_PROFILES`).
6. **Excluir um perfil gerenciado apaga todos os dados dele**, de forma definitiva. Por isso exige a senha do ator, como excluir a própria conta.
7. **Excluir a conta de quem gerencia** (`DELETE /me`) também apaga os perfis gerenciados que ficariam **sem nenhum gerente**. Hoje há um gerente por perfil, então são todos os que ele criou.
8. Cada perfil tem **as suas** categorias próprias, orçamentos, limites, caixinhas e lembretes, e o seu backup. O catálogo global de categorias (`categories.user_id` nulo) é de todos.

## 3. Banco (migração `0008`)

```sql
-- Quem tem login e quem é só um perfil gerenciado.
ALTER TABLE users
  ADD COLUMN kind text NOT NULL DEFAULT 'self',
  ALTER COLUMN email DROP NOT NULL,
  ALTER COLUMN password_hash DROP NOT NULL,
  ADD CONSTRAINT users_kind_valid CHECK (kind IN ('self', 'managed')),
  ADD CONSTRAINT users_login_by_kind CHECK (
    (kind = 'self' AND email IS NOT NULL AND password_hash IS NOT NULL)
    OR (kind = 'managed' AND email IS NULL AND password_hash IS NULL)
  );
-- users_email_unique continua valendo: o Postgres aceita vários NULL num índice único.

-- Quem pode gerenciar quem.
CREATE TABLE profile_access (
  owner_id   uuid NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  manager_id uuid NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  -- Só 'manager' por enquanto (tudo). O papel "só ver" entra numa migração futura, junto com a regra que o aplica.
  role       text NOT NULL DEFAULT 'manager' CHECK (role IN ('manager')),
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (owner_id, manager_id),
  CHECK (owner_id <> manager_id)
);
CREATE INDEX profile_access_manager_idx ON profile_access (manager_id);
```

- Os usuários que já existem ficam `self`, com e-mail e senha, sem nenhuma conversão.
- Criar um perfil gerenciado grava, na **mesma transação**: a linha em `users` (`kind = 'managed'`), a linha em `profile` (nome e moeda) e a linha em `profile_access`.
- Tudo que aponta para `users` com `ON DELETE CASCADE` (contas, transações, categorias próprias, caixinhas, recorrências, orçamentos, chaves de idempotência) **some junto** com o perfil gerenciado. É o que se quer em `DELETE /profiles/:id`.
- No código, `users.email` e `users.password_hash` passam a ser `string | null`: ajustar os pontos que os leem (`getMe`, login, cadastro, recuperação de senha, `deleteAccount`). A recuperação por e-mail nunca acha um perfil gerenciado, porque a busca é por e-mail e ele não tem.
- Atualizar também `api-rotas-e-consumo-mobile.md` (o contrato das rotas), o `README` e a coleção do Postman com `/profiles`, `X-Profile-Id` e os erros novos.

## 4. Rotas

### 4.1 Autenticação das rotas protegidas

Hoje o gancho de `onRequest` define `req.userId` a partir do token. Passa a ser em dois escopos:

- **Escopo de conta** (`/me` e `/profiles`): `req.actorId = req.userId = o do token`. Ignora `X-Profile-Id`.
- **Escopo de dados** (o resto): `req.actorId =` o do token e `req.userId =` o dono escolhido, pela regra 2. Uma consulta indexada por requisição (`profile_access`) só quando o cabeçalho vem.

O cabeçalho que não for um UUID válido responde `400 validation_failed`. O `X-Profile-Id` entra em `allowedHeaders` do CORS (`@fastify/cors`), senão o site (navegador) não consegue mandá-lo.

Os controllers de dados continuam usando `req.userId`. Os de conta (`me`, `profiles`) passam a usar `req.actorId`. Um teste garante que `/me` ignora o cabeçalho (seção 7).

### 4.2 Perfis

`GET /v1/profiles` lista o próprio perfil do ator (primeiro) e os que ele gerencia, do mais antigo ao mais novo:

```json
[
  { "id": "…", "kind": "self", "name": "Matheus", "currency": "BRL", "remindersEnabled": true },
  { "id": "…", "kind": "managed", "name": "Mãe", "currency": "BRL", "remindersEnabled": true, "createdAt": "2026-10-25T12:00:00.000Z" }
]
```

`POST /v1/profiles` cria um perfil gerenciado. Aceita `Idempotency-Key`.

```json
{ "name": "Mãe", "currency": "BRL" }
```

- `name`: 1 a 60 caracteres, obrigatório. `currency`: opcional, 3 letras, `BRL` por padrão.
- `201` com o perfil (`kind: "managed"`). Com 5 perfis já criados: `409 profile_limit`.

`PATCH /v1/profiles/:id` muda `name`, `currency` e `remindersEnabled` de um perfil **gerenciado** do ator. O próprio perfil do ator continua em `PATCH /me`. `404 not_found` se o id não for um perfil que ele gerencia.

`DELETE /v1/profiles/:id` apaga um perfil gerenciado do ator e todos os dados dele. Corpo `{ "password": "…" }` (a senha do **ator**). `204`. Senha errada: `401 invalid_credentials`. Id que não é dele: `404 not_found`.

### 4.3 Conta

- `GET /v1/me` não muda (id, e-mail, nome, moeda, lembretes **do ator**) e ignora o cabeçalho. Ganha `managedProfiles`: quantos perfis gerenciados o ator tem, para o app avisar antes de excluir a conta.
- `DELETE /v1/me` apaga o ator **e** os perfis gerenciados que ficariam sem gerente (regra 7), na mesma transação, **antes** de apagar o usuário (depois do `DELETE`, as linhas de `profile_access` já teriam sumido por cascata).

### 4.4 Rotas de dados

Todas as outras (`/categories`, `/cards`, `/transactions`, `/transfers`, `/goals`, `/recurrences`, `/budgets/*`, `/reports/*`, `/backup`) passam a respeitar `X-Profile-Id` pelo gancho de autenticação, **sem alteração nos serviços**:

- `GET /backup` exporta o perfil escolhido; `PUT /backup` restaura **nele** (apaga e recria os dados desse perfil, como hoje faz com os do ator). Dá para restaurar no perfil gerenciado um arquivo exportado de outra conta. `schemaVersion` continua **9**.
- A chave de idempotência vale por **dono dos dados** e por escopo: a mesma chave em dois perfis cria duas coisas, uma em cada.
- As recorrências vencidas são geradas ao ler (`materializeDue`) para o dono escolhido.

## 5. Erros novos

| Status | `code` | Quando | O que o app faz |
| --- | --- | --- | --- |
| 403 | `profile_forbidden` | `X-Profile-Id` de um perfil que o ator não gerencia, ou que não existe (mais) | Volta para o próprio perfil e avisa |
| 409 | `profile_limit` | Criar o 6º perfil gerenciado | Mostra a mensagem |

`POST` e `PATCH` com dados inválidos seguem o `400 validation_failed` de sempre.

## 6. Compatibilidade

- Nenhum campo existente muda de nome ou formato. O app antigo nunca manda `X-Profile-Id`: tudo continua no perfil do ator, como hoje. **Não é preciso subir a versão mínima** (`X-App-Version`).
- `GET /me` ganha `managedProfiles` (aditivo) e o app antigo o ignora.
- O app novo, contra uma API que ainda não tem `/profiles`, recebe 404: ele trata como "sem perfis" e não mostra nada novo.
- Quem já tem conta não precisa fazer nada. Um perfil gerenciado só passa a existir depois que a pessoa criar um.

## 7. Testes sugeridos

- **Regressão:** sem o cabeçalho, toda a suíte atual passa sem mudar.
- Com o cabeçalho de um perfil gerenciado do ator: criar conta, transação, caixinha e orçamento grava no perfil gerenciado; a lista **sem** o cabeçalho não os mostra, e **com** o cabeçalho mostra só eles.
- `X-Profile-Id` de um perfil de **outro** usuário, de um id que não existe e de um id já excluído: todos `403 profile_forbidden`, com o mesmo corpo. Um valor que não é UUID: `400`.
- **Isolamento em todas as rotas de dados:** um teste percorre a lista de rotas protegidas e confere que o cabeçalho de um perfil sem acesso é recusado antes de o serviço rodar, e que com acesso nada vaza para o outro perfil (contas, transações, relatórios, backup).
- `GET /me`, `PATCH /me` e `DELETE /me` ignoram o cabeçalho (sempre o ator). `/auth/*` não muda.
- Idempotência: a mesma `Idempotency-Key` em dois perfis cria duas coisas; repetida no mesmo, devolve a primeira (`Idempotent-Replayed`).
- `POST /profiles`: cria `users` (sem e-mail e sem senha), `profile` e `profile_access` juntos; com erro no meio, nada fica. O 6º devolve `409`. O perfil gerenciado **não consegue** entrar (não há e-mail nem senha; o `CHECK` `users_login_by_kind` impede um registro misto).
- `DELETE /profiles/:id`: senha certa apaga o perfil e **todos** os dados dele (contar as linhas de cada tabela antes e depois); senha errada: `401` e nada some; id de outro usuário: `404`.
- `DELETE /me` apaga o ator e os perfis gerenciados dele, e **não** toca nos perfis de outro usuário.
- `PUT /backup` com o cabeçalho substitui só os dados do perfil escolhido; os do ator ficam como estavam.
- Migração: usuários antigos continuam `self` e conseguem entrar; `users.email` único continua valendo entre usuários `self`.

## 8. O que o app muda depois da API

- O cliente HTTP manda `X-Profile-Id` quando o perfil ativo não é o próprio.
- Um `ProfileProvider` guarda o perfil ativo por conta (no aparelho). Se a API responder `403 profile_forbidden`, ele volta para o próprio perfil.
- O cache de dados passa a incluir o perfil nas chaves, ou é esvaziado na troca. Sem isso os dados de um perfil aparecem no outro.
- Um seletor no cabeçalho, uma tela de criar e excluir perfil, e uma **faixa visível** "você está vendo as contas de Mãe" para ninguém lançar no perfil errado.
- Lembretes e backup passam a valer para o perfil ativo. Lembretes de todos os perfis no mesmo celular ficam para depois.
- A confirmação de excluir a conta avisa quantos perfis gerenciados vão junto (`managedProfiles`).

## 9. Fora do escopo (por enquanto)

- **A pessoa cuidada ter o próprio login**: convite e "assumir" o perfil, mantendo o acesso de quem gerencia. O desenho já permite (é dar e-mail e senha a um `managed` e trocar para `self`), mas exige regras de consentimento e recuperação.
- **Mais de uma pessoa gerenciando o mesmo perfil**: a tabela permite vários gerentes, mas não há rota para adicionar.
- **Papel "só ver"**: exige aplicar somente leitura em todas as rotas de escrita.
- **Quem registrou cada transação** (`created_by`): coluna opcional em `transactions` guardando o `actorId`, para mostrar "registrado por Matheus" no perfil da mãe.

## 10. Para decidir antes de implementar

1. A sua mãe vai querer entrar com o próprio login um dia? Se sim, vale reservar o convite já no desenho das rotas.
2. O limite de 5 perfis é suficiente?
3. Ao excluir a conta de quem gerencia, apagar os perfis dele (como está aqui) ou mantê-los sem dono? Eu apago: um perfil sem ninguém com acesso seria dado financeiro de terceiros esquecido no banco.
4. `403` para um perfil sem acesso e `404` nas rotas `/profiles/:id`: aceito?
