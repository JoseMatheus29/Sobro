# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

JM-Finance is an Expo/React Native (TypeScript) mobile app for personal finance management (income, expenses, balance by category). It is the front-end only; it consumes a separate backend, [JM-Finance-API](https://github.com/JoseMatheus29/JM-Finance-API), configured in [services/api.ts](services/api.ts).

## Commands

```bash
npm install          # install dependencies
npx expo start        # start the dev server (scan QR with Expo Go)
npm run android        # run on Android emulator/device
npm run ios            # run on iOS (Mac only)
npm run web             # run in browser (Metro web bundler)
npm run lint             # expo lint
npm test                  # jest --watchAll
npx jest path/to/file.test.ts   # run a single test file
npm run reset-project       # scripts/reset-project.js (Expo's blank-project reset)
```

There are currently no test files in the repo; `jest-expo` is configured as the preset but not yet exercised.

## Architecture

**Routing**: file-based via `expo-router`. Every folder under [app/](app/) is a route; [app/_layout.tsx](app/_layout.tsx) declares the root `Stack` and must list any new top-level screen folder there. Route folders follow a consistent internal shape:
- `index.tsx` — the screen itself
- `components/` — screen-local components
- `<name>-type.ts` — TypeScript interfaces for that screen's data shapes (e.g. [app/wallet/wallet-type.ts](app/wallet/wallet-type.ts), [app/registrationSpent/registrationSpent-type.ts](app/registrationSpent/registrationSpent-type.ts))

Shared, cross-screen components live in [app/components/](app/components/), with generic/reusable UI primitives further isolated in [app/components/ui/](app/components/ui/) (`Field`, `GradientButton`, `ScreenHeader`, `TransactionList`).

**Styling**: NativeWind v4 (Tailwind for React Native) via `className` props, configured through [tailwind.config.js](tailwind.config.js), [babel.config.js](babel.config.js) (`nativewind/babel` preset, `jsxImportSource: "nativewind"`) and [metro.config.js](metro.config.js) (`withNativeWind`, reading [global.css](global.css)). Custom design tokens (`primary`, `surface`, `income`, `expense` colors) are defined in `tailwind.config.js` — reuse these tokens instead of hardcoding hex colors in new screens. A few older screens (e.g. [app/login/authStyles.ts](app/login/authStyles.ts)) still use `StyleSheet`-based styling from before the NativeWind migration; prefer NativeWind classes for new/updated code.

**API/auth layer** ([services/](services/)):
- [services/api.ts](services/api.ts) — shared Axios instance (`baseURL: http://localhost:8080`), with a request interceptor that attaches the bearer token from storage.
- [services/authService.ts](services/authService.ts) — `login`/`register` calls against `/auth/login` and `/auth/register`.
- [services/mockAuthService.ts](services/mockAuthService.ts) — a hardcoded mock login (`teste@email.com` / `123456`) used in place of the real API during front-end-only development.
- [services/storage.ts](services/storage.ts) — AsyncStorage wrapper for the JWT (`saveToken`/`getToken`/`removeToken`).

When switching between mock and real auth, check call sites of `login`/`mockLogin` in `app/login/LoginForm.tsx` rather than assuming one is wired up.

**Path alias**: `@/*` maps to the repo root (see [tsconfig.json](tsconfig.json)), e.g. `import x from '@/services/api'`.

## Screens (route folders under app/)

`dashboard`, `wallet`, `myDetailing`, `editAcount`, `registrationSpent`, `detailsSpend`, `login` — each self-contained with its own `components/` and `-type.ts` as described above. Charts use `react-native-gifted-charts` (see `myDetailing/components/ExpenseChart.tsx`); progress bars use `react-native-progress`.
