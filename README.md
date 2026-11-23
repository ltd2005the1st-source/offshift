# Offshift

A planner for shift workers, nurses first. Enter your shifts once and Offshift plans the rest around them: when to sleep, nap, stop caffeine, get light, wind down, and when to check in before driving home.

Built with React Native and Expo (iOS, Android and web).

## Run it

```sh
npm install
npx expo start          # press i (iOS), a (Android) or w (web)
```

## Checks

```sh
npm test                # planning engine tests
npm run typecheck
```

## Browser preview in an iPhone frame

```sh
npx expo export -p web
node scripts/build-preview.mjs
# open preview-dist/index.html through any static server
```

The frame page (`preview/index.html`) talks to the app with `postMessage`, so you can jump to a set time of day, replay onboarding or switch Night and Day without reloading.

## Layout

- `src/engine`: the planning engine. Pure TypeScript, no React, fully deterministic.
- `src/state`: the store (zustand, saved on device) and hooks that turn it into a plan.
- `src/app`: screens (expo-router): onboarding, Today, Week, Schedule, Life, You, and "I got called in".
- `src/ui`, `src/theme`: components and tokens, in the Daybook style on a night palette.

Offshift gives general guidance for planning sleep around shifts. It is not medical advice.
