# Voice Chunker

A single-file, dependency-free web tool that tags lines of dialogue by speaker,
runs find/replace, and splits text into size-capped chunks — with an optional
per-chunk prefix, a voice-switch limit, and speaker re-labeling when a single
line gets cut across chunks.

It began as a Twitch "cheer" copypasta formatter and was generalized into a
neutral text-chunking utility. See [`conversation.md`](conversation.md) for the
full requirements history.

## Live app

`index.html` is the entire app. Open it directly in a browser, or deploy it as a
static site (see **Deploying to Cloudflare Pages** below).

## Repository layout

- [`index.html`](index.html) — **the app.** Lives at the repo root so static
  hosts serve it as the default document. This is the file to work on.
- [`conversation.md`](conversation.md) — transcript of how/why it was built
  (intent + requirement evolution).
- [`history/`](history) — earlier iterations, for reference only:
  - `01-cheerpasta.py` — the original logic as a standalone Python script.
  - `02-formatter-v1.html` — first browser version (fixed Twitch defaults).
  - `03-formatter-v2.html` — added dynamic replacements + voice reinforcement.

## Deploying to Cloudflare Pages

This is a pure static site — no build step. In the Cloudflare Pages project
settings, connect this repo and use:

| Setting                    | Value             |
| -------------------------- | ----------------- |
| Framework preset           | **None**          |
| Build command              | **(leave empty)** |
| Build output directory     | **`/`** (root)    |
| Root directory             | **`/`** (root)    |

`index.html` sits at the repository root, so Pages serves it as the site's
index automatically.

> **Why this matters:** the original export shipped the app inside a
> `voice-chunker-export/` subfolder. If that structure is committed and the build
> output directory points at the repo root, Pages finds no `index.html` at the
> root and serves a blank page / 404. Keeping `index.html` at the root (as it is
> here) avoids that. If you instead keep the app in a subfolder, set the build
> output directory to that subfolder.

## Tech facts (relevant to debugging)

- Pure static: one HTML file with inline CSS and vanilla JS.
- **No build step, no framework, no dependencies, no external resources** — system
  font stacks only (no web fonts, no CDN, no images).
- **No network calls** (`fetch`/XHR are not used).
- **No `localStorage` / `sessionStorage`.**
- Browser APIs used at runtime:
  - **Clipboard:** `navigator.clipboard.writeText()` with an `execCommand('copy')`
    fallback. Requires a secure context (HTTPS) — satisfied by Cloudflare Pages.
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

## Possible next steps

- Add a `LICENSE` of your choosing (left blank intentionally).
- Optional `localStorage` persistence for replacement-rule presets — deliberately
  left out so the file renders cleanly in sandboxed previews, but safe to add for a
  self-hosted deployment.
</content>
</invoke>
