# Contributing to Agency CRM (Kreatiwit AgencyOS)

Thank you for your interest in contributing to **Agency CRM**! We welcome contributions from developers, designers, and agency owners worldwide.

---

## Code of Conduct

This project adheres to the [Contributor Covenant](CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code.

---

## How Can I Contribute?

### 1. Reporting Bugs
- Search existing [GitHub Issues](https://github.com/IsmeetPandey/agency-crm/issues) to ensure the bug hasn't already been reported.
- Use the **Bug Report** template to provide reproduction steps, browser version, expected vs. actual behavior, and relevant console logs.

### 2. Suggesting Features
- Open a feature request describing the operational agency use case, suggested interface, and data models.

### 3. Pull Requests
1. Fork the repository and create your branch from `main`:
   ```bash
   git checkout -b feat/your-feature-name
   ```
2. Install dependencies:
   ```bash
   bun install
   ```
3. Run verification before committing:
   ```bash
   bun run typecheck
   bun test
   bun run build
   ```
4. Follow conventional commit messages (`feat: ...`, `fix: ...`, `docs: ...`, `refactor: ...`).
5. Open a Pull Request targeting `main`.

---

## Local Development Workflow

- **Dev Server:** `bun run dev` (starts on `http://localhost:3000`)
- **TypeScript:** `bun run typecheck`
- **Tests:** `bun test`
- **Linter & Formatter:** `bun run lint` / `bun run format` (Biome)
- **Production Build:** `bun run build`

---

## Engineering Standards

- **Strict Typing:** All data access goes through typed repository interfaces in `src/lib/repositories/`. No `any` escapes in core domain logic.
- **Relational Integrity:** Lead-to-opportunity conversions must preserve idempotent transaction boundaries.
- **Visual Design:** Respect the design system tokens defined in `src/styles/theme.css`. Maintain zero-flash light and dark mode compatibility.

