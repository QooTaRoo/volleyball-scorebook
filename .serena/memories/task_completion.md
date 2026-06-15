# Task Completion

Steps and commands to run to confirm a coding task is fully complete and verified.

## Verification Checklist
1. **Linter/Format**: There are no configured linters or formatters in this repository. Follow the existing style of spaces and layout.
2. **Vitest Unit/Integration Tests**: Run the full unit/integration test suite:
   ```bash
   npm run test:run
   ```
   All tests must pass.
3. **Playwright E2E Tests**: Run the E2E tests to verify interactive UI clicks and z-index overlap issues:
   ```bash
   npm run test:e2e
   ```
   All E2E scenarios must pass.