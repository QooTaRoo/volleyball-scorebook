# Core Memory

Top-level entry point for the Volleyball Scorebook PWA project.

## Project Structure
- `index.html`: Main single-page application entry point.
- `js/`: Source directory for application logic. Loaded sequentially via standard `<script>` tags in `index.html`.
  - `js/state.js`: Defines global `state` object, constants, and local storage persistence.
  - `js/ui.js`: DOM interaction, layouts, modal control.
  - `js/libero.js`: Libero registration and automatic substitution logic.
  - `js/game.js`: Core rules (points, sets, timeouts, undo, rotation).
  - `js/radial.js` & `js/court.js`: UI menus for player grids, advanced stats, substitutions.
  - `js/history.js` & `js/teams.js`: Match history timeline and preset team management.
  - `js/pwa.js` & `js/backup.js` & `js/sync.js`: Service worker registration, JSON import/export, cloud synchronization.
  - `js/init.js`: DOMContentLoaded entry point, session timeouts, and event hookups.
- `tests/`: Testing files (Vitest for logic, Playwright for E2E).

## References
- Tech stack details: `mem:tech_stack`
- Code design & patterns: `mem:conventions`
- Running commands: `mem:suggested_commands`
- Pull requests/task verification: `mem:task_completion`