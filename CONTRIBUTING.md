# Contributing to ContractorAI

## Getting Started

1. Fork the repo
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Make your changes
4. Run tests: `pnpm test`
5. Commit: `git commit -am 'Add feature'`
6. Push: `git push origin feature/my-feature`
7. Create a Pull Request

## Development

- **Mobile**: Makes changes in `apps/mobile`
- **Web**: Make changes in `apps/web`
- **Shared**: Make changes in `packages/shared`
- **Backend**: Make changes in `packages/backend`

## Naming Conventions

- Branches: `feature/description`, `fix/description`, `docs/description`
- Commits: Use conventional commits (feat:, fix:, docs:, etc.)
- Files: kebab-case for files, PascalCase for components

## Code Style

- TypeScript strict mode enabled
- ESLint + Prettier for formatting
- 2 spaces for indentation

Run before committing:

```bash
pnpm lint
pnpm type-check
pnpm test
```
