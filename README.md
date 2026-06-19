# Voice Chunker

**Paste text, get tidy size-capped chunks** — for text-to-speech and voice tools,
character-limited boxes, and anywhere a wall of text needs to be broken into clean,
predictable pieces.

**▶ Try it live: [annoy.uwutoowo.com](https://annoy.uwutoowo.com/)**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
![Single file](https://img.shields.io/badge/source-one%20HTML%20file-success)
![Zero dependencies](https://img.shields.io/badge/dependencies-0-brightgreen)
![No build step](https://img.shields.io/badge/build-none-success)
![Vanilla JS](https://img.shields.io/badge/vanilla-JS-f7df1e)
![Cloudflare Workers](https://img.shields.io/badge/Cloudflare-Workers-F38020?logo=cloudflare&logoColor=white)

Voice Chunker is a **single-file, dependency-free** web tool. It splits text into
size-capped chunks two ways:

- **Prose** (the default) — splits a wall of text on sentence boundaries.
- **Script** — tags lines of dialogue by speaker (`NAME: text`), with an optional
  voice-switch cap and speaker re-labeling when a line is cut across chunks.

Along the way it can run an ordered list of find/replace rules and prepend a prefix
to every chunk. Everything runs **100% in your browser** — pasted text never leaves
your device.

> It started life as a Twitch "cheer" copypasta formatter and was generalized into a
> neutral text-chunking utility. The defaults are deliberately neutral.

---

## Quick start

No install, no build, no account. Pick whichever is easiest:

- **Use it now:** open the live app at **[annoy.uwutoowo.com](https://annoy.uwutoowo.com/)**.
- **Just open it.** Download [`public/index.html`](public/index.html) and open it in
  any browser. That's the whole app, in one file.
- **Run it locally** with the Cloudflare CLI (live-reload preview of `public/`):

  ```sh
  npx wrangler dev
  ```

- **Deploy your own** copy to Cloudflare Workers (see [Self-hosting](#self-hosting)):

  ```sh
  npx wrangler deploy
  ```

Then: paste your text → pick **Prose** or **Script** → hit **Format** → copy each
chunk (or **Copy all**). Use **Load example** to see a ready-made sample for the
current mode.

---

## Why?

Lots of tools cap how much text you can hand them at once:

- **Text-to-speech / voice apps** that read a block at a time, or charge per request.
- **Character-limited fields** — chat boxes, donation/cheer messages, SMS, form inputs.
- **Anything** where you'd otherwise eyeball a long passage and chop it by hand.

Chopping by hand is tedious and error-prone: you split mid-word, lose track of who's
speaking, or blow past the limit by a few characters. Voice Chunker does the boring
part deterministically — it packs as much as it can into each chunk **without** going
over your cap, breaks long lines on word boundaries, and (in Script mode) keeps the
right speaker attached to every piece.

---

## Features

- **Two input modes.**
  - **Prose** (default): ignores tags and splits on sentence boundaries. It breaks
    only where end punctuation is followed by a space, so periods inside URLs
    (`example.com`), decimals (`3.14`), and times (`9:30`) survive intact.
  - **Script**: parses `NAME: dialogue` lines into voices; untagged lines become a
    `narrator` voice. The speaker match requires the colon to be followed by
    whitespace (or end of line) and the name to contain a letter, so URLs, clock
    times, and numeric lines aren't mistaken for speakers.
- **Ordered find/replace.** Apply a list of rules top-to-bottom before chunking, with
  global **Match case** and **Whole word only** toggles.
- **Size-capped chunking.** Greedily packs segments into chunks no longer than your
  **Max chars / chunk** (the prefix counts toward the cap).
- **Per-chunk prefix.** Optionally prepend a tag/label to every chunk.
- **Voice-switch limit** (Script). A "switch" is a speaker change between two adjacent
  lines inside one chunk. Cap it, or leave it blank for no limit. The narrator is
  excluded unless you opt in.
- **Smart continued lines** (Script). A line too long for one chunk is word-wrapped
  across chunks; each continuation re-opens with the speaker label and is marked with
  `…`, so the right voice always carries over.
- **Rich output.** Each chunk shows a character count, a switch count, a fill meter,
  and a copy button — plus **Copy all**.
- **Auto / Light / Dark theme.** A three-position slider in the header. **Auto** (the
  default) follows your OS; Light/Dark pin an explicit choice, remembered between
  visits.
- **Private by design.** No network calls, no analytics, no servers. See
  [Privacy](#privacy).

---

## How it works

`run()` wires a small, predictable pipeline (all in the inline script of
`public/index.html`):

1. **`readOpts()`** — gather settings from the form (mode, prefix, separator, max
   chars, max switches, label format, toggles).
2. **`applyReplacements()`** — apply each find→replace rule in order, honoring the
   Match-case / Whole-word toggles.
3. **Parse** — in Script mode, `parseSegments()` turns `NAME: text` lines into
   `{speaker, text}` (untagged → `narrator`). In Prose mode, `splitSentences()`
   breaks the text into sentences.
4. **`expand()`** — word-wrap any segment too long for a single chunk, re-opening each
   continuation with the speaker label and `…` markers as configured.
5. **`pack()`** — greedily pack segments into chunks that respect both the character
   cap (prefix included) and the voice-switch cap.
6. **`render()`** — build the result cards (counts, meter, copy buttons, copy-all).

Clipboard support uses `navigator.clipboard.writeText()` with an `execCommand('copy')`
fallback for older/locked-down contexts.

---

## Options reference

All options live under **Splitting options** (the panel label adapts to the mode).

| Option | Applies to | Default | What it does |
|---|---|---|---|
| **Mode** (Prose / Script) | both | Prose | Prose splits on sentences; Script parses `NAME:` dialogue. |
| **Prefix each split with** | both | _(empty)_ | Text prepended to every chunk. Counts toward the char cap. |
| **Separator** | both | one space | Joins lines/sentences when packing them into a chunk. |
| **Max chars / chunk** | both | `400` | Hard cap per chunk (prefix included). |
| **Max voice switches** | Script | _(blank = no limit)_ | Caps speaker changes within a single chunk. |
| **Speaker label format** | Script | `{name}:` | How each speaker label is rendered (`{name}` → the speaker). |
| **Count narrator as a voice** | Script | off | Include untagged/narrator lines in the switch count. |
| **Repeat speaker on continued lines** | Script | on | Re-open each continuation chunk with the speaker label. |
| **Mark continuations with …** | both | on | Add `…` markers where a line/sentence is split across chunks. |
| **Match case** | replacements | off | Make find/replace case-sensitive. |
| **Whole word only** | replacements | on | Only match find terms at word boundaries. |

---

## Privacy

Everything happens client-side, in the page:

- **No network calls.** No `fetch`/XHR. Your text is never uploaded.
- **No analytics, no servers, no accounts.**
- **Storage:** the only thing saved is your light/dark theme choice (a single
  `localStorage` key, `vc-theme`), wrapped in `try/catch` so locked-down/sandboxed
  contexts still work. Nothing else is stored.

Because it's one self-contained file, you can audit it in a single read, save it
offline, and run it with your network unplugged.

---

## Self-hosting

The repo is wired up for **Cloudflare Workers** (Workers Builds), serving the
`public/` directory as
[static assets](https://developers.cloudflare.com/workers/static-assets/) — there is
no Worker script, just files. The config is [`wrangler.jsonc`](wrangler.jsonc):

```jsonc
{
  "name": "cheer-splitter-9k",
  "assets": { "directory": "./public" }
}
```

Local development and deployment:

```sh
npx wrangler dev      # local preview of public/ with live reload
npx wrangler deploy   # publish to production
```

How automated deploys work here:

- **Production** deploys on every push to **`main`** (runs `npx wrangler deploy`).
- **Pull requests** get an automatic **preview** deployment — handy for reviewing a
  change before it ships.

> **Gotchas (from real debugging):**
> - Workers Builds won't deploy production until `wrangler.jsonc` exists on `main`.
> - A repo's **GitHub default branch** is independent of Cloudflare's **production
>   branch** — keep the GitHub default set to `main` for consistency.

Since it's just static files, you can equally host `public/` on any static host
(GitHub Pages, Netlify, an S3 bucket, your own server) — or just open the file.

---

## Project layout

| Path | Role |
|---|---|
| [`public/`](public) | **The deployed site.** Cloudflare serves *only* this directory. |
| [`public/index.html`](public/index.html) | **The entire app** — inline CSS + vanilla JS, no assets. |
| [`wrangler.jsonc`](wrangler.jsonc) | Cloudflare Workers config (serves `public/`). |
| [`README.md`](README.md) | This file. |
| [`CLAUDE.md`](CLAUDE.md) | Guidance for AI assistants and contributors. |
| [`LICENSE`](LICENSE) | MIT. |

**Tech facts:** pure static; one HTML file with inline CSS and a single vanilla-JS
IIFE (`"use strict"`). No build step, no framework, no dependencies, no external
resources — system font stacks only (no web fonts, no CDN, no external images; inline
SVG icons only). Browser APIs used: Clipboard (with `execCommand` fallback),
`matchMedia` (theme), and `localStorage` (theme only).

---

## Contributing

The whole app is **[`public/index.html`](public/index.html)** — edit that one file and
reload the browser. There is no build step and nothing to install.

A few house rules keep the project what it is (see [CLAUDE.md](CLAUDE.md) for the full
list):

- **Stay single-file.** Keep CSS and JS inline; don't add dependencies, bundlers, or
  external resources.
- **No network calls**, and no storage beyond the theme key.
- **Match the idiom:** vanilla JS, IIFE-wrapped, `"use strict"`, ES5-ish style.
- **Branch + PR.** Develop on a feature branch and open a PR — PRs get Cloudflare
  preview deploys, which is the safe way to verify a change. Avoid pushing straight to
  `main` (it deploys to production).

---

## License

Released under the [MIT License](LICENSE).
