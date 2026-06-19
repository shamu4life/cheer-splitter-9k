# Voice Chunker

A single-file, dependency-free web tool that tags lines of dialogue by speaker,
runs find/replace, and splits text into size-capped chunks — with an optional
per-chunk prefix, a voice-switch limit, and speaker re-labeling when a single
line gets cut across chunks.

It began as a Twitch "cheer" copypasta formatter and was generalized into a
neutral text-chunking utility.

## Live app

[`public/index.html`](public/index.html) is the entire app. Open it directly in a
browser, or deploy it as a static site (see **Deploying to Cloudflare Workers**
below).

## Repository layout

- [`public/`](public) — **the deployed site.** Only this directory is served by
  Cloudflare (see `wrangler.jsonc`), so docs below stay out of the public site.
  - [`public/index.html`](public/index.html) — **the app.** This is the file to
    work on.
- [`wrangler.jsonc`](wrangler.jsonc) — Cloudflare Workers config; serves
  `public/` as static assets.
- [`CLAUDE.md`](CLAUDE.md) — guidance for AI assistants: codebase structure,
  workflows, and the project's hard constraints.

## Deploying to Cloudflare Workers

This repo is connected to **Cloudflare Workers** (Workers Builds) and serves the
`public/` directory as [static assets](https://developers.cloudflare.com/workers/static-assets/).
There is no build step. The relevant config is [`wrangler.jsonc`](wrangler.jsonc):

```jsonc
{
  "name": "cheer-splitter-9k",
  "assets": { "directory": "./public" }
}
```

How deploys happen:

- **Production:** Workers Builds deploys on every push to the **`main`** branch
  (the configured production branch), running `npx wrangler deploy`.
- **Previews:** pull requests get a preview deployment automatically.

> **Why a deploy can silently not happen:** Workers Builds needs `wrangler.jsonc`
> present on the production branch. When the repo was first connected, Cloudflare
> opened an automatic PR adding this file; **production does not deploy until that
> config is on `main`.** It now is.
>
> Note also that a repo's **GitHub default branch** (set to whichever branch is
> pushed first to an empty repo) is independent of Cloudflare's **production
> branch** — make sure the GitHub default is `main` for consistency.

To deploy or preview locally with the Cloudflare CLI:

```sh
npx wrangler dev      # local preview
npx wrangler deploy   # publish to production
```

## Tech facts (relevant to debugging)

- Pure static: one HTML file with inline CSS and vanilla JS.
- **No build step, no framework, no dependencies, no external resources** — system
  font stacks only (no web fonts, no CDN, no images).
- **No network calls** (`fetch`/XHR are not used).
- **No `localStorage` / `sessionStorage`.**
- Browser APIs used at runtime:
  - **Clipboard:** `navigator.clipboard.writeText()` with an `execCommand('copy')`
    fallback. Requires a secure context (HTTPS) — satisfied by Cloudflare Workers.
  - Standard DOM only otherwise.

## Feature spec (intended behavior)

- **Source format:** one line per speaker, `NAME: dialogue`. A line with no
  `NAME:` prefix is treated as a `narrator` voice.
- **Replacements:** an ordered list of find→replace rules, with global Match-case
  and Whole-word toggles.
- **Chunking:** greedy pack into chunks no longer than "Max chars / chunk" (the
  prefix counts toward the cap).
- **Prefix:** optional text prepended to every chunk.
- **Voice switches:** a "switch" is a speaker change between two lines inside one
  chunk; the cap is optional (blank = no limit). The narrator is excluded from the
  count unless "Count narrator as a voice" is enabled.
- **Continued lines:** a line too long for one chunk is word-wrapped across chunks;
  each continuation re-opens with the speaker label (toggle) and is marked with `…`
  (toggle). This is the key behavior — continuation chunks must reinforce which
  voice is speaking.
- **Output:** per-chunk character count, switch count, and a copy button, plus a
  copy-all.

## License

Released under the [MIT License](LICENSE).

## Possible next steps

- Optional `localStorage` persistence for replacement-rule presets — deliberately
  left out so the file renders cleanly in sandboxed previews, but safe to add for a
  self-hosted deployment.
</content>
</invoke>
