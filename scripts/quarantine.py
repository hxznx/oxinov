"""Move unwanted files and folders into DELETE_ME/ instead of deleting them.

    python scripts/quarantine.py PATH [PATH ...]      move the given paths
    python scripts/quarantine.py --scan               list unwanted candidates
    python scripts/quarantine.py --scan --move        move every untracked candidate

Each run moves into DELETE_ME/<UTC time>/<original relative path>, so nothing is lost
until a person empties DELETE_ME/ (it is ignored by Git). A move is a single rename of
the top path: the contents are never walked, so directory junctions and symlinks inside
it (pnpm links workspace packages this way) cannot delete the files they point to.
Tracked files move only with --tracked, because their removal must be committed.
"""

from __future__ import annotations

import argparse
import os
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path

from doc_links import unreachable_docs

ROOT = Path(__file__).resolve().parents[1]
BIN = "DELETE_ME"
# Dependency and regenerated build folders are never "unwanted": tools recreate them.
SKIP_DIRS = {".git", "node_modules", BIN, ".next", ".turbo", ".terraform", ".expo", "dist", "out", "coverage"}
LEFTOVER_SUFFIXES = (".orig", ".rej", ".bak", "~")
LEFTOVER_NAMES = {".DS_Store", "Thumbs.db", "desktop.ini"}


def is_link(path: Path) -> bool:
    return path.is_symlink() or (hasattr(path, "is_junction") and path.is_junction())


def tracked_files(root: Path) -> set[str]:
    result = subprocess.run(["git", "ls-files", "-z"], cwd=root, capture_output=True, check=False)
    if result.returncode:
        return set()
    return {name for name in result.stdout.decode("utf-8").split("\0") if name}


def is_tracked(relative: str, tracked: set[str]) -> bool:
    return relative in tracked or any(name.startswith(relative + "/") for name in tracked)


def check_target(root: Path, raw: str) -> tuple[Path, str]:
    path = Path(os.path.abspath(raw))
    try:
        relative = path.relative_to(root).as_posix()
    except ValueError:
        raise SystemExit(f"refused: {raw} is outside the repository")
    first = relative.split("/", 1)[0]
    if relative in ("", ".") or first in (".git", BIN):
        raise SystemExit(f"refused: {raw} is the repository root, .git, or {BIN}")
    if not (path.exists() or is_link(path)):
        raise SystemExit(f"refused: {raw} does not exist")
    return path, relative


def move(root: Path, paths: list[str], allow_tracked: bool, stamp: str) -> list[str]:
    tracked = tracked_files(root)
    targets = [check_target(root, raw) for raw in paths]
    blocked = [rel for _, rel in targets if is_tracked(rel, tracked) and not allow_tracked]
    if blocked:
        raise SystemExit("refused: tracked by Git (rerun with --tracked, then commit the removal): " + ", ".join(blocked))
    moved = []
    for path, relative in targets:
        destination = root / BIN / stamp / relative
        destination.parent.mkdir(parents=True, exist_ok=True)
        try:
            os.rename(path, destination)
        except OSError as error:
            print(f"could not move {relative}: {error.strerror or error}. Close programs using it and retry.", file=sys.stderr)
            continue
        moved.append(relative)
        print(f"moved {relative} -> {BIN}/{stamp}/{relative}")
    return moved


def scan(root: Path) -> list[tuple[str, str]]:
    def walk(directory: Path) -> tuple[bool, list[tuple[str, str]]]:
        """Return whether the folder holds any file, and the candidates inside it."""
        has_content = False
        found: list[tuple[str, str]] = []
        for entry in sorted(directory.iterdir(), key=lambda p: p.name):
            relative = entry.relative_to(root).as_posix()
            if is_link(entry):
                has_content = True
            elif entry.is_dir():
                if entry.name in SKIP_DIRS:
                    has_content = True
                elif entry.name == "__pycache__":
                    found.append((relative, "Python bytecode cache"))
                elif relative == ".tmp":
                    found.append((relative, "temporary working folder"))
                else:
                    child_content, child_found = walk(entry)
                    has_content = has_content or child_content
                    # A folder that is empty all the way down is reported once, at its top.
                    found += child_found if child_content else [(relative, "empty folder")]
            else:
                has_content = True
                if entry.name in LEFTOVER_NAMES or entry.name.endswith(LEFTOVER_SUFFIXES):
                    found.append((relative, "editor, merge, or operating-system leftover"))
        return has_content, found

    return walk(root)[1]


def unlinked_docs(root: Path) -> list[str]:
    return unreachable_docs(root) if (root / "docs" / "README.md").is_file() else []


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("paths", nargs="*", help="files or folders to move into DELETE_ME/")
    parser.add_argument("--scan", action="store_true", help="list unwanted candidates")
    parser.add_argument("--move", action="store_true", help="with --scan, move every untracked candidate")
    parser.add_argument("--tracked", action="store_true", help="allow moving files tracked by Git")
    args = parser.parse_args(argv)
    stamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")

    if args.scan:
        tracked = tracked_files(ROOT)
        candidates = [(rel, why) for rel, why in scan(ROOT) if not is_tracked(rel, tracked)]
        for doc in unlinked_docs(ROOT):
            if is_tracked(doc, tracked):
                print(f"{doc}  (tracked document not reachable from docs/README.md; link it, or move it with --tracked)")
            else:
                candidates.append((doc, "untracked document not reachable from docs/README.md"))
        for rel, why in candidates:
            print(f"{rel}  ({why})")
        if not candidates:
            print("No untracked leftovers found.")
        if args.move and candidates:
            move(ROOT, [str(ROOT / rel) for rel, _ in candidates], False, stamp)
        return 0

    if not args.paths:
        parser.error("give paths to move, or --scan")
    moved = move(ROOT, args.paths, args.tracked, stamp)
    return 0 if len(moved) == len(args.paths) else 1


if __name__ == "__main__":
    raise SystemExit(main())
