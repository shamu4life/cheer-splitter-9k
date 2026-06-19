# CLAUDE.md

Guidance for AI assistants (and humans) working in this repository.

## What this project is

**Voice Chunker** (repo: `cheer-splitter-9k`, deployed Worker: `cheer-splitter-9k`)
is a single-file, dependency-free web tool that:

1. Tags lines of dialogue by speaker (`NAME: text`),
2. Runs an ordered list of find/replace rules,
3. Splits the text into size-capped chunks — with an optional per-chunk prefix,
   an optional voice-switch cap, and speaker re-labeling when one line is cut
   across chunks.

It started life as a Twitch "cheer" copypasta formatter and was generalized into
a neutral text-chunking utility. The full requirement history lives in
[`conversation.md`](conversation.md).

## The one file that matters

**[`public/index.html`](public/index.html) is the entire application.** It is a
self-contained HTML page with inline `<style>` and a single inline `<script>`
(vanilla JS, IIFE, `"use strict"`). **This is the only file to edit when changing
app behavior.** There is no `src/`, no bundler, no package manager.

Everything else in the repo is documentation, deploy config, or frozen history.

## Repository layout

| Path | Role |
|---|---|
| `public/` | **The deployed site.** Cloudflare serves *only* this directory, so docs/history stay out of production. |
| `public/index.html` | **The app.** Edit this. |
| `wrangler.jsonc` | Cloudflare Workers config — serves `public/` as static assets. |
| `README.md` | Human-facing overview, feature spec, deploy notes. |
| `conversation.md` | Transcript of how/why the tool was built (intent + requirement evolution). |
| `history/` | **Reference only — do not edit or deploy.** Earlier iterations. |
| `history/01-cheerpasta.py` | Original logic as a standalone Python script. |
| `history/02-formatter-v1.html` | First browser version (fixed Twitch defaults). |
| `history/03-formatter-v2.html` | Added dynamic replacements + voice reinforcement. |
| `.gitignore` | Ignores wrangler/env artifacts (`.wrangler`, `.dev.vars*`, `.env*`). |

## How to run / develop

There is **no build step**. Either:

- Open `public/index.html` directly in a browser, **or**
- Use the Cloudflare CLI from the repo root:

```sh
npx wrangler dev      # local preview of public/ as static assets
npx wrangler deploy   # publish to production (normally CI does this — see below)
```

To make a change: edit `public/index.html`, reload the browser. That's the whole
loop.

## Deployment (Cloudflare Workers)

- Connected via **Workers Builds**. `public/` is served as
  [static assets](https://developers.cloudflare.com/workers/static-assets/);
  there is no Worker script, just assets.
- **Production** deploys on every push to **`main`** (runs `npx wrangler deploy`).
- **Pull requests** get an automatic preview deployment.
- Config is `wrangler.jsonc`: `name` = `cheer-splitter-9k`, `assets.directory` =
  `./public`.

Gotchas (from real debugging):
- Workers Builds **won't deploy production until `wrangler.jsonc` exists on
  `main`** — it does now.
- The **GitHub default branch** is independent of Cloudflare's **production
  branch**. Keep the GitHub default = `main` for consistency.

## Architecture of the app (script pipeline)

`run()` wires a straightforward pipeline (all functions inside the IIFE in
`public/index.html`):

1. `readOpts()` — gather settings from the form (prefix, separator, max chars,
   max switches, label format, toggles).
2. `applyReplacements(text, opts)` — apply each find→replace rule in order, using
   `escapeRe()` and regex flags driven by the **Match case** / **Whole word**
   toggles.
3. `parseSegments(text)` — split into lines; `NAME: text` becomes
   `{speaker, text}`, untagged lines become a `narrator` voice.
4. `expand(segments, opts)` — word-wrap any segment too long for one chunk
   (`wrapText()`), re-opening each continuation with the speaker label
   (`repeatSpeaker`) and `…` markers (`markCont`).
5. `pack(segments, opts)` — greedily pack segments into chunks that respect both
   `maxLen` (prefix counts toward the cap) and `maxSwitches`
   (`countSwitches()`, narrator excluded unless `countNarrator`).
6. `render(splits, opts)` — build the result cards (per-chunk char count, switch
   count, meter, copy button, plus copy-all).

Clipboard: `copyText()` uses `navigator.clipboard.writeText()` with an
`execCommand('copy')` fallback (`fb()`).

## Hard constraints — keep these true

These are the project's defining properties. **Do not break them without an
explicit request:**

- **One file.** No build step, no framework, no dependencies, no external
  resources. System font stacks only — **no web fonts, no CDN, no images**.
- **No network calls.** `fetch`/XHR are not used and must not be added.
- **No `localStorage` / `sessionStorage`.** Deliberately omitted so the file
  renders cleanly in sandboxed previews. (Safe to add for a self-hosted build,
  but only on request.)
- **Vanilla JS**, IIFE-wrapped, `"use strict"`, ES5-ish style (`var`, function
  expressions) — match the surrounding code's idiom when editing.
- **Privacy:** everything runs client-side; pasted text never leaves the device.
  Preserve this.

## Feature spec (intended behavior)

- **Source format:** one line per speaker, `NAME: dialogue`. No-prefix line →
  `narrator` voice. (Name match is `^([^:]{1,30}):`.)
- **Replacements:** ordered find→replace rules; global Match-case and Whole-word
  toggles.
- **Chunking:** greedy pack into chunks ≤ "Max chars / chunk" (prefix counts
  toward the cap).
- **Prefix:** optional text prepended to every chunk.
- **Voice switches:** a switch = a speaker change between two adjacent lines in
  one chunk; cap is optional (blank = no limit). Narrator excluded unless "Count
  narrator as a voice" is on.
- **Continued lines (key behavior):** a line too long for one chunk is
  word-wrapped across chunks; each continuation re-opens with the speaker label
  (toggle) and is marked with `…` (toggle). Continuation chunks must reinforce
  who is speaking.
- **Output:** per-chunk char count, switch count, copy button, plus copy-all.

## Conventions & gotchas for editors

- Keep style/markup/script **inline in the one file** — do not split into
  separate `.css`/`.js` assets.
- The app de-branded away from Twitch specifics; defaults are neutral (blank
  prefix, blank switch cap = no limit, `400`-char default, `ALICE`/`BOB`
  placeholders). Don't reintroduce use-case-specific defaults.
- `history/` is a frozen record — treat it as read-only reference.
- There is intentionally **no `LICENSE`** (left blank).

## Working in this repo (workflow for assistants)

- Branch: do development on the assigned feature branch; **never push directly to
  `main`** without explicit permission (a push to `main` triggers a production
  deploy).
- Pushing to a branch and opening a PR is the normal flow — PRs get Cloudflare
  preview deploys, which is how to verify changes safely.
- After pushing, ensure a PR exists for the branch.
