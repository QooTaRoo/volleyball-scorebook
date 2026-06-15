# Conventions

Architecture, state management, and coding conventions.

## Architecture & Scope
- **Global Scope**: Modules are loaded sequentially as standard scripts. Variables (like `state`) and functions are defined directly on the global scope (`window`).
- **State Management**: 
  - A single global `state` object defined in `js/state.js`.
  - Serialized to `localStorage` under `volleyball_score_state` via `saveState()`.
  - State should be saved immediately after state-mutating actions (e.g., points, undo, substitutions).
- **Vibration**: Physical feedback on actions is implemented using `navigator.vibrate(ms)` wrapped in a global `vibrate(ms)` helper in `js/state.js`.

## Code Style & Testing Patterns
- **JSDOM Concatenation**: In `tests/setup.js`, `global.loadApp` reads all JS files, rewrites `let` variables to `var` at the top level to act as globals on the window object, and `eval`s the concatenated scripts. Be mindful of variable declarations at the file level (use `let` or `var` appropriately, but they will be modified during Vitest execution).
- **Modals**: Modal elements follow the ID naming convention `[name]-modal` and toggle visibility by adding/removing the Tailwind CSS `hidden` class. The state helper `isAnyModalOpen()` identifies active modals by checking for the absence of `hidden`.