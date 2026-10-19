#!/usr/bin/env python3
import re
import sys
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SKILL = ROOT / "skills" / "deck-meet"
OUT = ROOT / "dist" / "deck-meet.zip"
TEXT = {".md", ".css", ".js", ".py", ".html", ".txt"}
ALLOWED_BINARY = {".woff2"}
LONG_LINE = 2000


def skill_files():
    return sorted(p for p in SKILL.rglob("*") if p.is_file() and not p.name.startswith("."))


def problems(files):
    found = []
    for path in files:
        rel = path.relative_to(SKILL)
        if path.is_symlink():
            found.append(f"{rel}: symlink")
        elif path.suffix in ALLOWED_BINARY:
            continue
        elif path.suffix not in TEXT:
            found.append(f"{rel}: unexpected file type")
        else:
            text = path.read_text(encoding="utf-8")
            if re.search(r"base64,[A-Za-z0-9+/=]{200}", text):
                found.append(f"{rel}: embedded base64 data")
            if any(len(line) > LONG_LINE for line in text.splitlines()):
                found.append(f"{rel}: line longer than {LONG_LINE} characters")
    return found


def main():
    files = skill_files()
    if not (SKILL / "SKILL.md").is_file():
        print("SKILL.md missing")
        return 1
    found = problems(files)
    if found:
        print("not packaged:")
        print("\n".join("  " + p for p in found))
        return 1
    OUT.parent.mkdir(exist_ok=True)
    with zipfile.ZipFile(OUT, "w", zipfile.ZIP_DEFLATED) as zf:
        for path in files:
            zf.write(path, Path("deck-meet") / path.relative_to(SKILL))
    print(f"{OUT.relative_to(ROOT)}: {len(files)} files, {OUT.stat().st_size} bytes")
    return 0


sys.exit(main())
