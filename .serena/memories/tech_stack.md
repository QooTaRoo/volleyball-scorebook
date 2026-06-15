# Tech Stack

Language, libraries, frameworks, and testing tools.

## Core Stack
- **Languages**: HTML5, Vanilla JavaScript (ES6+).
- **Styling**: Tailwind CSS (CDN-loaded via `<script src="https://cdn.tailwindcss.com">`). No compilation steps needed for CSS.
- **Icons**: Lucide Icons (CDN-loaded, initialized via `lucide.createIcons()`).
- **External Libraries**:
  - `html2canvas` (CDN-loaded): For rendering the stats/timeline as images for sharing.
  - `@supabase/supabase-js` (CDN-loaded): Underpinning the sync capabilities in `js/sync.js`.
- **Package Manager**: npm.

## Testing Stack
- **Unit & Integration Tests**: Vitest (v1.6.0) with JSDOM environment.
- **E2E Tests**: Playwright (v1.60.0), running on Headless Chromium.