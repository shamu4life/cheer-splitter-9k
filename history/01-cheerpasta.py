#!/usr/bin/env python3
"""
Twitch cheer-copypasta formatter.

1. Paste the copypasta into SOURCE below. Each spoken line should look like
   "NAME: dialogue" (e.g. "SKINNER: Superintendent Chalmers, welcome!").
   Unlabeled lines (stage directions) are treated as a 'narrator' voice.
2. Run:  python3 cheerpasta.py
3. Copy each printed split into chat.

The name swaps, the Cheer200 lead, the 400-char cap, and the max-voice-switch
rule are all applied automatically.
"""

import re

# ---- Settings ---------------------------------------------------------------
PREFIX           = "Cheer200 "      # leads every split
MAX_LEN          = 400              # char cap per split (the prefix counts toward it)
MAX_SWITCHES     = 5               # max speaker changes allowed inside one split
CASE_INSENSITIVE = True            # also match Skinner / skinner, not just SKINNER

REPLACEMENTS = {
    "SKINNER":  "UWOSLAB",
    "CHALMERS": "Girlfriend",
}

SOURCE = """\
PASTE THE COPYPASTA HERE
"""

# ---- 1. Name swaps ----------------------------------------------------------
def apply_replacements(text):
    flags = re.IGNORECASE if CASE_INSENSITIVE else 0
    for old, new in REPLACEMENTS.items():
        text = re.sub(rf"\b{re.escape(old)}\b", new, text, flags=flags)
    return text

# ---- 2. Split into (speaker, rendered_line) ---------------------------------
def parse_segments(text):
    segments = []
    for raw in text.splitlines():
        line = raw.strip()
        if not line:
            continue
        m = re.match(r"^([^:]{1,30}):\s*(.*)$", line)
        if m:
            speaker = m.group(1).strip()
            rendered = f"{speaker}: {m.group(2).strip()}"
        else:
            speaker = "narrator"        # stage directions / unlabeled lines
            rendered = line
        segments.append((speaker, rendered))
    return segments

# ---- 3. Hard-wrap any single line that is too long on its own ---------------
def split_long(speaker, rendered, budget):
    words, pieces, cur = rendered.split(), [], ""
    for w in words:
        cand = (cur + " " + w).strip()
        if len(cand) > budget and cur:
            pieces.append(cur)
            cur = w
        else:
            cur = cand
    if cur:
        pieces.append(cur)
    return [(speaker, p) for p in pieces]

# ---- 4. Greedily pack segments into splits ----------------------------------
def pack(segments):
    budget = MAX_LEN - len(PREFIX)

    # expand oversized lines first so every piece is guaranteed to fit
    expanded = []
    for sp, rd in segments:
        expanded += split_long(sp, rd, budget) if len(rd) > budget else [(sp, rd)]

    splits, text, last, switches = [], "", None, 0
    for sp, rd in expanded:
        adds_switch = last is not None and sp != last
        candidate   = (text + " " + rd).strip() if text else rd

        too_long = len(PREFIX + candidate) > MAX_LEN
        too_many = adds_switch and switches + 1 > MAX_SWITCHES

        if too_long or too_many:
            splits.append(PREFIX + text.strip())   # flush the current split
            text, last, switches = rd, sp, 0        # start fresh (first line never counts)
            continue

        text = candidate
        switches += 1 if adds_switch else 0
        last = sp

    if text:
        splits.append(PREFIX + text.strip())
    return splits

# ---- 5. Run -----------------------------------------------------------------
if __name__ == "__main__":
    splits = pack(parse_segments(apply_replacements(SOURCE)))
    for i, s in enumerate(splits, 1):
        print(f"--- split {i}  ({len(s)} chars) ---")
        print(s)
        print()
