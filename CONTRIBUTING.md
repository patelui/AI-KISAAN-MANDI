# Contributing to AI-Kisaan Mandi

Thank you for your interest in contributing! This project aims to empower Indian farmers and connect them with buyers through technology. Every contribution — big or small — helps.

## Ways to contribute

- Report bugs and suggest features via [GitHub Issues](https://github.com/SurajInCode/AI_Kisaan_Mandi/issues)
- Improve documentation (README, code comments, setup guides)
- Fix bugs or add features (UI, API, AI assistants, payments)
- Write tests for critical flows (auth, cart, payments, orders)
- Share the project and star the repo

## Good first issues

Look for issues labeled `good first issue` or `help wanted`. These are great entry points for new contributors.

Suggested starter areas:

| Area | Ideas |
|------|-------|
| **Frontend** | UI polish, responsive layouts, accessibility, new dashboard widgets |
| **Backend** | Rate limiting, input validation, API tests, error handling |
| **AI** | Better prompts, multilingual replies (Hindi/regional), fallback answers |
| **DevOps** | Docker setup, CI/CD, deployment guides |

## Development setup

1. Fork the repo and clone your fork
2. Follow the [README Quick Start](README.md#quick-start)
3. Create a branch: `git checkout -b feature/your-feature-name`
4. Make your changes and test locally
5. Commit with a clear message (see below)
6. Push and open a Pull Request against `main`

## Branch naming

- `feature/add-hindi-assistant`
- `fix/checkout-payment-error`
- `docs/improve-readme`
- `refactor/cart-service`

## Commit messages

Use clear, descriptive messages:

```
feat: add Hindi language toggle to farmer assistant
fix: prevent empty cart checkout
docs: add Docker setup instructions
```

Prefixes: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`

## Pull request checklist

- [ ] Code runs locally (`server` + `client` dev servers)
- [ ] No secrets or `.env` files committed
- [ ] Changes are focused — one feature or fix per PR when possible
- [ ] README updated if you changed setup, env vars, or routes
- [ ] Screenshots added for visible UI changes (optional but appreciated)

## Code style

- Match existing patterns in the file you edit
- Keep changes minimal and focused
- Prefer reusing existing hooks, components, and API utilities
- Run `cd client && npm run lint` before submitting frontend changes

## Security

- **Never** commit API keys, `.env` files, or real credentials
- Report security vulnerabilities privately to the maintainer — do not open public issues with exploit details

## Code of conduct

Be respectful and constructive. We welcome contributors of all experience levels. Questions are always okay.

---

Questions? Open a [Discussion](https://github.com/SurajInCode/AI_Kisaan_Mandi/discussions) or comment on an issue. Happy coding!
