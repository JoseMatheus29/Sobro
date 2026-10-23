# Sobrô? na web (desktop)

Plano para pessoas usarem o Sobrô pelo navegador, no computador. Este documento é um briefing para quem vai fazer o trabalho: diz **o que fazer, em que ordem e por quê**, e o que ainda precisa ser confirmado.

Estado de partida (confirmado no código em 2026-10-20): Expo SDK 57, React Native 0.86, expo-router, NativeWind v4, `react-native-web` e `react-dom` já instalados, `app.json` já tem a seção `web`. O app é um cliente online (API Fastify + Postgres no Heroku), sem banco local. O CLAUDE.md diz que o web "não é usado": **ninguém abriu o app no navegador desde a migração**, então pode haver quebras que ninguém viu.

---

## 1. Objetivo e escopo

**Objetivo:** acessar a mesma conta do celular pelo navegador, com as mesmas telas e dados.

**Dentro do escopo**
- Login, cadastro e recuperação de senha.
- Dashboard, Carteira (contas, cartão, fatura, caixinhas), Detalhamento, Perfil, nova saída e edição.
- Backup (exportar e importar) e tutorial.

**Fora do escopo (por enquanto)**
- Lembretes de vencimento (notificação local agendada não existe na web).
- Funcionar offline (o app já é online-only).
- Atualização "over the air": o site é atualizado publicando de novo.
- App para iOS.

## 2. Decisão: onde o projeto vive

| Opção | Quando serve |
|---|---|
| **A. Mesmo repositório, alvo web do Expo (recomendada)** | Reaproveita 100% da lógica (`utils/`, `db/`, `api/`, `types/`) e quase todas as telas. Uma correção vale para celular e web. |
| B. Projeto novo (Vite ou Next) | Só vale se o desktop for ter um produto bem diferente do celular. Exige reescrever as telas e duplicar a lógica. |

**Seguir com A.** Trabalhar numa branch própria (`feat/web`). A fase 2 (layout de desktop) é onde a opção B voltaria a ser discutida, se o resultado da fase 1 for ruim.

## 3. O que já ajuda e o que não funciona na web

**A favor**
- Toda a regra de negócio é TypeScript puro e roda igual no navegador.
- O cache de dados é só em memória (nada financeiro vai para o disco do navegador).
- NativeWind, SVG, gradiente e gráficos (`react-native-gifted-charts`) têm suporte na web.
- A tela de redefinição de senha já lê o token de `#token=` da URL, o que funciona com um link `https`.

**Sem equivalente na web (precisa de solução)**

| Ponto | Onde está | Solução na web |
|---|---|---|
| Armazenar o login | `api/session.ts` (`expo-secure-store`) | Adaptador de armazenamento por plataforma (seção 5.3) |
| Seletor de data | `@react-native-community/datetimepicker`, em 4 telas: nova saída (`DetailsStep`), editar saída (`detailsSpend/[id]`), `payInvoice/[id]`, `transfer` | Componente `DateField` com `<input type="date">` na web |
| Lembretes | `db/reminders.ts` (`expo-notifications`) | Desligar na web e esconder o interruptor em Perfil |
| Backup | `db/backupFile.ts` (`expo-file-system`, `expo-sharing`, `expo-document-picker`) | Baixar com `Blob` e importar com `<input type="file">` |
| Ícones | `react-native-vector-icons/MaterialIcons` | Apontar para `@expo/vector-icons` (já instalado) só na web |
| Barras do sistema | `hooks/useSystemBars.ts` | Já tem `if (Platform.OS !== 'android') return`: não precisa de nada |
| Botão voltar do Android | `TutorialOverlay` e `registrationSpent/index.tsx` (`BackHandler`) | Sem efeito na web (o botão Voltar do navegador navega pela rota); conferir na fase 0 que o fluxo de nova saída fecha pelo botão da tela |
| Teclado | `KeyboardAvoidingView` | Sem efeito na web: ok |
| Atualização OTA | `expo-updates` | Não se aplica |

## 4. Fase 0: teste de viabilidade (meio dia)

Objetivo: ver **o que quebra** antes de decidir o esforço.

```bash
git checkout -b feat/web
npx expo start --web
```

Anotar, por tela: abre? mostra dados? o que aparece no console do navegador? Resultado esperado: uma lista de problemas ordenada por gravidade. Os da seção 3 vão aparecer; o resto é novidade.

Conferir também:
- `app.json` → `web.output`. Está `"static"`, que roda o código em Node durante o build e quebra com qualquer uso de `window` ou `localStorage` na renderização. **Trocar para `"single"`** (aplicativo de página única), que é o certo para um app com login.
- O comportamento de `className` em `LinearGradient` na web (o registro em `utils/nativewindInterop.ts` foi feito pensando em nativo).

## 5. Fase 1: MVP web (o app dentro de uma coluna de celular)

### 5.1 Configuração

`app.json`:

```json
"web": {
  "bundler": "metro",
  "output": "single",
  "favicon": "./assets/images/icon.png"
}
```

- Definir título e descrição da página (nome "Sobrô?").
- O endereço da API entra na hora do build: `EXPO_PUBLIC_API_URL`.

### 5.2 API: liberar o site (CORS)

Hoje a API **não tem CORS**: o navegador bloqueia todas as chamadas. Na API (`Sobro - Api`):

- Instalar `@fastify/cors` e registrar com uma lista de origens vinda de uma variável (`CORS_ORIGINS`, separada por vírgula). Nunca `*`: é um app financeiro.
- Permitir os cabeçalhos que o app usa: `Authorization`, `Content-Type`, `X-App-Version`, `Idempotency-Key`. Os dois últimos são personalizados, então o navegador faz uma checagem prévia (preflight) em toda chamada.
- Permitir os métodos `GET, POST, PATCH, PUT, DELETE, OPTIONS` e um `maxAge` para reduzir os preflights.
- Configurar no Heroku:

```bash
heroku config:set CORS_ORIGINS=https://SEU-SITE --app NOME-DO-APP
```

- Testar com `curl -i -X OPTIONS` a partir de uma origem permitida e de uma não permitida.
- Aproveitar para ajustar `RESET_PASSWORD_URL` (seção 5.6).

### 5.3 Login e sessão

`api/session.ts` usa `expo-secure-store`, que não existe na web. Criar um adaptador com arquivos por plataforma (o Metro escolhe `.web.ts` na web sozinho):

- `api/tokenStorage.ts`: usa `expo-secure-store` (celular).
- `api/tokenStorage.web.ts`: usa `localStorage`.

`api/session.ts` passa a chamar o adaptador. Atenção ao risco: tokens em `localStorage` ficam expostos a qualquer script que rode na página (XSS). Aceitável para a fase 1 em um site com poucas pessoas; o caminho de verdade está na fase 3.

Conferir, em `api/client.ts`, que a renovação de token (uma só para todas as chamadas) funciona no navegador.

### 5.4 Substituições por plataforma

- **Seletor de data (feito)**: `app/components/ui/DatePicker.tsx` (celular, envolve o `datetimepicker`) e `DatePicker.web.tsx` (diálogo com `<input type="date">`, que aceita digitar ou escolher no calendário). As 4 telas usam o `DatePicker`. A data do app é o **dia do calendário** enviado ao meio-dia UTC (`calendarDayAtNoonUtc`): o `<input type="date">` devolve `AAAA-MM-DD`, e `utils/dateInput.ts` (com teste) converte nos dois sentidos pelo dia do celular, mantendo a hora.
- **Backup**: `db/backupFile.web.ts` com download por `Blob` + `<a download>` e leitura por `<input type="file">`. Mesma interface do arquivo de celular.
- **Lembretes**: `db/reminders.web.ts` com funções vazias, e esconder o interruptor "Lembretes de vencimento" em Perfil na web.
- **Ícones**: no `metro.config.js`, resolver `react-native-vector-icons/*` para `@expo/vector-icons/*` quando a plataforma for `web`:

```js
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (platform === 'web' && moduleName.startsWith('react-native-vector-icons/')) {
    return context.resolveRequest(context, moduleName.replace('react-native-vector-icons/', '@expo/vector-icons/'), platform);
  }
  return context.resolveRequest(context, moduleName, platform);
};
```

(Confirmar se a fonte dos ícones carrega; se não, carregar a fonte no início do app.)

### 5.5 Layout: coluna de celular

Para o MVP, não redesenhar nada: na web, envolver o app em um contêiner centralizado com largura de celular. Em `app/_layout.tsx`, só na web:

- Fundo da página com a cor do tema e um contêiner `maxWidth: 480`, `width: '100%'`, centralizado, ocupando a altura da janela.
- `SideBar` e botão flutuante são posicionados de forma absoluta: ficam dentro do contêiner se ele tiver `position: relative` (o padrão do React Native).
- Margens de área segura (`useSafeAreaInsets`) valem 0 na web: ok.

Resultado: o app abre no desktop como uma "janela de celular" no meio da tela. Feio para quem usa monitor grande, mas funcional.

### 5.6 Recuperação de senha

Hoje o e-mail leva um link `sobro://reset#token=…`, que só abre no celular. Com a web:

- Definir `RESET_PASSWORD_URL` na API como `https://SEU-SITE/reset` (o app lê `#token=` de `Linking.useURL()`, que também funciona na web).
- Quem abre o link no celular cai no site, e o site resolve. (Se quiser abrir o app instalado, é um projeto à parte: Android App Links.)
- **Pré-requisito que não é da web:** o e-mail só sai para qualquer pessoa com um domínio verificado no Resend (ou outra solução de envio). Sem isso, a recuperação de senha segue funcionando só para o dono da conta do Resend.

## 6. Fase 2: desktop de verdade

Só depois de a fase 1 estar no ar e aprovada.

- **Breakpoints**: celular (< 768), tablet (768 a 1023), desktop (≥ 1024). Um hook `useBreakpoint` baseado em `useWindowDimensions`.
- **Navegação**: no desktop, menu lateral fixo no lugar da barra de baixo (`SideBar`), sem botão flutuante: um botão "Nova transação" no topo.
- **Home e Detalhamento**: duas ou três colunas (saldo e fluxo à esquerda, últimas transações à direita; gráfico ao lado dos limites).
- **Folhas viram diálogos**: nova saída, transferência, pagar fatura, caixinha, busca e histórico hoje sobem de baixo. No desktop, diálogo centralizado com largura máxima.
- **Listas longas**: tabela com colunas (data, nome, categoria, conta, valor) na Carteira e na busca.
- **Interação de desktop**: foco visível, `Enter` envia formulários, `Esc` fecha diálogos, cursor de "clicável" e realce ao passar o mouse.
- **Tutorial**: refazer para o desktop ou desligar na web (o atual aponta para a barra de baixo).

## 7. Fase 3: endurecimento

- **Sessão em cookie**: trocar `localStorage` por cookie `HttpOnly` + `Secure` + `SameSite`, com proteção contra CSRF. Exige mudar a API (login e renovação passam a definir e ler o cookie) e `credentials: 'include'` no cliente da web. É a mudança de segurança mais importante.
- **Cabeçalhos de segurança** no site: `Content-Security-Policy`, `X-Content-Type-Options`, `Referrer-Policy`, `frame-ancestors`.
- **Limite de tentativas**: conferir o limitador atual (por IP) com a API atrás de proxy.
- **Acessibilidade**: ordem de foco, rótulos, contraste e navegação só pelo teclado.
- **Desempenho**: tamanho do pacote (`npx expo export` mostra) e carregamento da fonte de ícones.

## 8. Hospedagem e deploy

O build é uma pasta de arquivos estáticos:

```bash
EXPO_PUBLIC_API_URL=https://sobro-api-b00e8bca72f0.herokuapp.com npx expo export --platform web
```

(No PowerShell, definir a variável antes: `$env:EXPO_PUBLIC_API_URL="..."`.) A saída vai para `dist/`. Testar localmente servindo a pasta com um servidor estático antes de publicar.

Onde publicar (qualquer um serve; o plano gratuito costuma bastar):
- **Cloudflare Pages (recomendado se precisa ser 100% grátis)**: hospedagem de arquivos estáticos com banda e requisições ilimitadas no plano gratuito (limites que importam: 500 builds por mês e 20.000 arquivos por site). Publica a pasta `dist/` (upload direto ou ligado ao GitHub). Conferir os números em developers.cloudflare.com/pages/platform/limits antes de divulgar.
- **EAS Hosting**: já usa a conta Expo do projeto e é o que a documentação do Expo indica para o `output: "single"`. Depois do `expo export -p web`: `npx eas-cli@latest deploy` gera um endereço de prévia e `npx eas-cli@latest deploy --prod` publica em produção. Tem plano gratuito com limites de requisições e banda; os números não foram conferidos (expo.dev/pricing).
- **Netlify**: a mais bem documentada pelo Expo, mas o plano gratuito é um saldo único de 300 créditos por mês (banda e cada deploy gastam dele) e, quando acaba, os sites ficam fora do ar até o mês seguinte. `netlify deploy --dir dist`; exige `public/_redirects` (abaixo).
- **Vercel (Hobby)**: grátis, mas só para uso não comercial.
- **Heroku: não usar para o site.** Não existe plano gratuito desde 2022; hospedar arquivos estáticos lá gasta crédito de dyno à toa. Os créditos ficam para a API.

Nos hospedeiros estáticos (Netlify, Vercel, Cloudflare), configurar **fallback de rotas para `index.html`** (reescrita de `/*` com status 200), porque é um app de página única: sem isso, recarregar em `/wallet` dá 404. No Netlify, criar `public/_redirects` com a linha `/*  /index.html  200` e **refazer o export** (o Expo copia `public/` para `dist/` ao exportar).

Domínio próprio é opcional agora e obrigatório para o e-mail de recuperação de senha funcionar para todos.

Depois de publicar: colocar o endereço do site em `CORS_ORIGINS` na API.

## 9. Segurança (resumo)

- Nada financeiro persiste no navegador; só os tokens (e a escolha de tema).
- CORS restrito às origens do site; nunca `*`.
- HTTPS sempre (as hospedagens acima já dão).
- Meta: sessão em cookie `HttpOnly` (fase 3).
- O site é público: qualquer pessoa vê a tela de login. Isso é esperado; o que importa é que a API continue exigindo token.

## 10. Testes e critérios de aceite

**Fase 1 está pronta quando**, no Chrome e no Firefox (desktop) e no Chrome do celular:
- [ ] Cadastro, login, sair e recarregar a página mantendo a sessão.
- [ ] Recuperar senha pelo link do e-mail até trocar a senha.
- [ ] Home, Carteira, Detalhamento e Perfil abrem e mostram os mesmos números do celular para a mesma conta.
- [ ] Criar, editar e excluir uma saída (incluindo "Como pagou" e repetição) com o seletor de data da web.
- [ ] Ver e pagar uma fatura; criar uma caixinha; transferir entre contas.
- [ ] Exportar e importar um backup.
- [ ] Nenhum erro de CORS no console; nenhum aviso de rota sem exportação padrão.
- [ ] `npx tsc --noEmit`, `npm run lint` e `npm test` continuam passando, e o celular continua funcionando (testar uma tela de cada tipo no development build).

**Verificação**: a regra do projeto de "ver no celular" continua valendo para qualquer mudança em arquivo compartilhado. Mudanças só `.web.ts(x)` não afetam o celular.

## 11. Riscos e perguntas em aberto

- **Quebras desconhecidas**: o web não é aberto há muito tempo. A fase 0 existe para medir isso.
- **Static vs single**: se alguma parte do app depender de renderização estática, avaliar de novo.
- **Domínio**: sem ele, o e-mail de recuperação de senha não chega aos usuários. Decidir se compra um (cerca de R$ 40 por ano no registro.br) antes de divulgar o site.
- **Esconder funções que não existem na web** (lembretes) ou explicar que só valem no celular.
- **Duas versões para manter**: toda tela nova precisa ser verificada no celular e na web. Combinar quem testa o quê.
- **Tutorial e telas de folha**: ficam estranhos no desktop até a fase 2.

## 12. Ordem de trabalho sugerida

1. [ ] Branch `feat/web`; `npx expo start --web`; registrar o que quebra (fase 0).
2. [ ] `app.json`: `output: "single"`; título e favicon.
3. [ ] API: `@fastify/cors`, `CORS_ORIGINS`, teste com `curl`; publicar no Heroku.
4. [ ] Adaptador de armazenamento do login (`.web.ts`).
5. [ ] Ícones (resolver no Metro).
6. [x] Seletor de data (`DatePicker`) e troca nas 4 telas.
7. [ ] Backup e lembretes (versões `.web`).
8. [ ] Contêiner em coluna de celular no `_layout`.
9. [ ] Build (`expo export`), teste local, publicação, endereço no `CORS_ORIGINS`.
10. [ ] `RESET_PASSWORD_URL` para o endereço do site (depois do domínio do e-mail).
11. [ ] Passar a lista de aceite da seção 10.
12. [ ] Fase 2 e fase 3, em PRs separados.

**Estimativa**: fase 0 em meio dia; fase 1 em alguns dias; fase 2 em uma a duas semanas; fase 3 em alguns dias, mais a mudança na API. São ordens de grandeza, não compromissos: a fase 0 é quem diz se estão certas.
