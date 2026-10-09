# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

JM-Finance is an Expo/React Native (TypeScript) mobile app for personal finance management (income, expenses, balance by category). It is local-first: all data lives in an on-device SQLite database ([db/](db/)). There is no backend, no network layer and no login — [app/index.tsx](app/index.tsx) redirects straight to `/dashboard`.

## Commands

```bash
npm install          # install dependencies
npx expo start        # start the dev server
npm run android        # run on Android emulator/device (expo run:android, native build)
npm run ios            # run on iOS (Mac only)
npm run web             # Metro web bundler — currently crashes on load, see below
npm run lint             # expo lint
npx tsc --noEmit          # type check
npm test                   # jest --watchAll
npx jest path/to/file.test.ts   # run a single test file
npm run reset-project       # scripts/reset-project.js (Expo's blank-project reset)
```

`jest-expo` is the preset and `@/` is mapped to the repo root in the jest config, so pure logic can be tested with plain `.test.ts` files next to it (see [utils/insightRules.test.ts](utils/insightRules.test.ts)). Keep tests outside `app/`, where every file becomes a route.

The app uses `expo-dev-client` and has a checked-in [android/](android/) native project, so it runs as a development build rather than in Expo Go. The web target does not work: `expo-sqlite` 15 has no web implementation, so the bundle fails with `Cannot find native module 'ExpoSQLite'`. Verify UI changes on an Android/iOS build, not in the browser.

## Architecture

**Routing**: file-based via `expo-router`. Every folder under [app/](app/) is a route; [app/_layout.tsx](app/_layout.tsx) declares the root `Stack` (wrapped in `SQLiteProvider`) and must list any new top-level screen folder there **by its full route name** (`wallet/index`, not `wallet`: a short name does not match, logs `No route named ...` and silently drops that screen's options). Route folders follow a consistent internal shape:
- `index.tsx` — the screen itself
- `components/` — screen-local components
- `<name>-type.ts` — TypeScript interfaces for that screen's data shapes and props, plus its constants (labels, placeholder data). Always put new constants here, not inline in components (e.g. [app/editAcount/editAcount-type.ts](app/editAcount/editAcount-type.ts), [app/registrationSpent/registrationSpent-type.ts](app/registrationSpent/registrationSpent-type.ts))

Shared, cross-screen components live in [app/components/](app/components/) (including the bottom navigation bar, [sidebar.tsx](app/components/sidebar.tsx)), with generic/reusable UI primitives further isolated in [app/components/ui/](app/components/ui/) (`Field`, `GradientButton`, `ScreenHeader`, `TransactionList`).

**Navigation chrome**: `SideBar` (four tabs, configured in [app/components/sidebar-type.ts](app/components/sidebar-type.ts)) is rendered by each tab screen. Creating a transaction is a separate action: `AddTransactionFab` is rendered next to `SideBar` on Dashboard, Carteira and Detalhamento and opens `registrationSpent`, which `_layout.tsx` declares as a `transparentModal` sheet. That screen is a three-step flow (valor, categoria, detalhes) and draws its own dimmed backdrop. Editing a transaction happens in place on `detailsSpend/[id]` (an input form with a save button; categories and accounts use `PickerSheet`). Screens that show the button use `SCROLL_PADDING_WITH_FAB` as bottom scroll padding so content can scroll past it.

**Feedback**: never use `Alert.alert`. [app/components/feedback/](app/components/feedback/) provides `FeedbackProvider` (mounted above the `Stack` in `_layout.tsx`) and the `useFeedback()` hook: `showToast({ type: 'success' | 'error' | 'info', title, message? })` for results and warnings, and `await confirm({ title, message, confirmLabel, destructive })` for questions that need an answer. Because the provider sits above the navigator, a toast survives the navigation that follows an action (e.g. the sheet closing after a save). Keep the copy in the screen's `-type.ts`.

**Styling**: NativeWind v4 (Tailwind for React Native) via `className` props, configured through [tailwind.config.js](tailwind.config.js), [babel.config.js](babel.config.js) (`nativewind/babel` preset, `jsxImportSource: "nativewind"`) and [metro.config.js](metro.config.js) (`withNativeWind`, reading [global.css](global.css)).

Design tokens (`primary`, `surface`, `canvas`, `ink`, `muted`, `subtle`, `line`, `income`, `expense`) are defined once in [constants/palette.ts](constants/palette.ts), which `tailwind.config.js` requires. Reuse them instead of hardcoding hex colors:
- in `className`: `bg-primary`, `text-subtle`, `shadow-primary/40`, …
- in props NativeWind can't reach (icon `color`, `ActivityIndicator`, gradient `colors`): `import { palette } from '@/constants/palette'` and use `palette.primary.DEFAULT`, etc.

Many existing screens still hardcode `#3161B2` and friends from before the tokens existed; migrate them when touching that code.

**NativeWind pitfall**: don't add or remove classes after the first render when they use Tailwind's CSS variables (`shadow-*`, `ring-*`, `scale-*`, `translate-*`, gradients). NativeWind then remounts the component and, in dev, crashes with `Couldn't find a navigation context` (it tries to serialize the props for a warning). Put state-dependent shadows, fills and transforms in `style`, and keep `className` constant per component.

**Scrolling screens**: every tab screen (and Perfil and Detalhes) scrolls through [ScreenScroll](app/components/ui/ScreenScroll.tsx), which only scrolls, and only keeps room under the content for the tab bar and floating button (`SCROLL_PADDING_WITH_FAB` / `SCROLL_PADDING_WITH_SIDEBAR`), when the content does not fit. A plain `ScrollView` with a fixed bottom padding always scrolled into an empty stretch on short screens. When the content is pulled up over the blue header (`-mt-7`), the header goes *inside* the `ScreenScroll` and the pulled-up content in a wrapper `View`: with a fixed header and a `-mt-7` scroll view, the content is cut off at the header's edge while scrolling, as if the header were swallowing it.

**Data layer** ([db/](db/), `expo-sqlite`):
- [db/schema.ts](db/schema.ts) — `MIGRATIONS` array plus `migrateDbIfNeeded`, run by `SQLiteProvider` on startup and tracked through `PRAGMA user_version`. To change the schema, append a new entry to `MIGRATIONS`; never edit an existing one. Tables: `categories`, `cards`, `transactions`, `profile` (single row, `id = 1`).
- [db/seed.ts](db/seed.ts) — `seedIfEmpty` inserts the default categories and a default card on first run.
- [db/cards.ts](db/cards.ts), [db/categories.ts](db/categories.ts), [db/transactions.ts](db/transactions.ts), [db/profile.ts](db/profile.ts) — query functions taking a `SQLiteDatabase`, mapping snake_case rows to camelCase `*Record` types.
- [db/hooks.ts](db/hooks.ts) — `useCards`, `useTransactions`, `useCategoryTotals`, `useCategories`, `useProfile`, `useInsights`. They refetch on screen focus (`useFocusEffect`) because Stack screens stay mounted; use these in screens rather than fetching in a mount-only `useEffect`.

A card's `balance` is derived (`cards.balance` as starting balance + the sum of its transactions) and is never updated directly.

**Path alias**: `@/*` maps to the repo root (see [tsconfig.json](tsconfig.json)), e.g. `import { useCards } from '@/db/hooks'`.

## Screens (route folders under app/)

`dashboard`, `wallet`, `myDetailing`, `editAcount`, `registrationSpent`, `insights`, and `detailsSpend/[id]` (a single dynamic-route file).

Charts use `react-native-gifted-charts` (see `myDetailing/components/ExpenseChart.tsx`); progress bars use `react-native-progress`.

**Dashboard**: the balance card (`CardBalance`, in the app's own light style: Saldo mensal, how it compares with the same stretch of the previous month, and the `Orçamento do mês` bar against the profile's `monthlyBudget`), a "Fluxo de Caixa" section with the month's entradas and saídas, one insight card, and "Últimas transações". The card shows the month, not the accounts: account balances live in Carteira. The figures come from [utils/summary.ts](utils/summary.ts) (`buildSummary`, covered by its test). There are no flexible spacers: blocks sit at a fixed `SECTION_GAP`, and the list fills a tall screen with more rows (`RECENT_MIN`–`RECENT_MAX`, counted from the measured layout in `app/dashboard/index.tsx`) instead of with empty space. The `RECENT_*_HEIGHT` constants in `dashboard-type.ts` mirror the row and title sizes of `RecentTransactions`; update them together.

**Insights and tips**: generated on the device from the user's own transactions, with no network call. [utils/insightRules.ts](utils/insightRules.ts) (`generateInsights`) is a pure function that compares the month with the same stretch of the previous one, and looks at the balance, the biggest category, a single heavy expense, category spikes and the month's pace; its thresholds and Portuguese copy live in [utils/insightRules-type.ts](utils/insightRules-type.ts) and months are read in UTC through [utils/month.ts](utils/month.ts). `useInsights()` (which also returns the two months it read) feeds the card on the Dashboard (the most relevant insight, warnings first) and the `insights` route, which is a sheet like `registrationSpent` (`transparentModal`, its own backdrop) listing all of them. To add a rule, add its copy to `INSIGHT_COPY`, push it from `generateInsights` and cover it in the test.
