# Changelog

All notable changes to Voice Chunker are documented here.
Format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

---

## [1.0.0] — 2026-06-19

### Added
- Modes — paste your text and split it two ways: **Prose** (the default) breaks a wall of text on sentence boundaries, leaving periods inside URLs, decimals, and clock times intact; **Script** parses `NAME: dialogue` lines into per-speaker voices, with untagged lines folded into a `narrator` voice.
- Replacements — run an ordered list of find/replace rules over the text before chunking, with global **Match case** and **Whole word only** toggles.
- Chunking — greedily packs as much text as fits into each chunk without going over your **Max chars / chunk** cap, with an optional per-chunk **prefix** prepended to every chunk (and counted toward the cap).
- Script — an optional **voice-switch cap** limits how many speaker changes land in a single chunk; leave it blank for no limit, and choose whether the narrator counts as a voice.
- Script — lines too long for one chunk are **word-wrapped** across chunks, with each continuation re-labeled with its speaker and marked with `…` so the right voice always carries over.
- Output — every chunk card shows a character count, a switch count, and a fill meter, with a **copy** button per chunk plus **Copy all**.
- UI — an **Auto / Light / Dark** theme slider in the header; Auto follows your OS, and an explicit choice is remembered between visits.
- Privacy — runs **fully client-side**: no network calls, no analytics, no accounts, and no tracking. Your pasted text never leaves your device.

### Notes
- This baseline release also adds the contributor docs, CI, and unit tests.
