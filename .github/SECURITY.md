# Security Policy

## Supported versions

Voice Chunker is a single static page, shipped from the `main` branch. Only the
**latest released version** receives security fixes.

| Version | Supported |
|---------|-----------|
| latest (`main`) | ✅ |
| older releases  | ❌ |

## Reporting a vulnerability

**Please do not open a public issue for security problems.**

Report privately through GitHub's **Report a vulnerability** flow:

1. Go to the repository's **[Security](https://github.com/shamu4life/cheer-splitter-9k/security)** tab.
2. Click **Report a vulnerability**.
3. Describe the issue, steps to reproduce, and impact.

This opens a private advisory visible only to the maintainers. We aim to
acknowledge reports within a few days. There is no bug-bounty program — this is
a hobby project — but credit is gladly given in the advisory if you'd like it.

## What is in scope

- **XSS / HTML injection** via how user-supplied text is rendered into the result
  cards — including pasted input, find/replace rules (the replacement strings),
  per-chunk prefix, and Script-mode speaker labels. Output should always be set as
  text, never parsed as markup.
- **Any code path that makes a network request.** The app is meant to be 100%
  client-side — no `fetch`/XHR, no analytics, no servers, no CDN or external
  resources. If you find anything that calls out to the network, that's a bug —
  please report it.
- **Prototype pollution or ReDoS** through the find/replace regex options. Rules
  are compiled with `new RegExp()` (via `escapeRe()`, honoring the Match-case /
  Whole-word toggles), so report any way to craft a rule that pollutes object
  prototypes or causes catastrophic backtracking.

## What is *not* a vulnerability (by design)

These are documented properties of a client-only static tool, not bugs — please
don't report them:

- **No server, no accounts, no stored data.** It's a single static page; there is
  nothing to authenticate against and no backend to attack.
- **The only storage is one `localStorage` key, `vc-theme`** (your light/dark
  theme choice), wrapped in `try/catch`. Nothing else is persisted — no input,
  no rules, no output.
- **Chunking / splitting inaccuracies are not security issues.** If a sentence
  splits in an unexpected place, a speaker is mis-parsed, or a chunk is off by a
  character, that's a correctness bug — please file it as a normal issue, not a
  vulnerability.
- **No uptime guarantee.** The hosted demo is best-effort; availability of
  [annoy.uwutoowo.com](https://annoy.uwutoowo.com/) is not part of this policy.

See [`README.md`](../README.md) and [`CLAUDE.md`](../CLAUDE.md) for the full
design rationale.
