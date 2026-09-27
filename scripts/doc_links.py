"""Markdown link helpers shared by validate_project.py and quarantine.py."""
from __future__ import annotations

import posixpath
import re
import subprocess
from pathlib import Path

LINK = re.compile(r"(?<!!)\[[^]]+\]\(([^)\s]+)\)")
DOC_MAP = "docs/README.md"


def markdown_files(root: Path) -> list[str]:
    """Tracked and new (not ignored) Markdown files, without walking node_modules."""
    result = subprocess.run(
        ["git", "ls-files", "--cached", "--others", "--exclude-standard", "-z", "--", "*.md"],
        cwd=root, check=True, capture_output=True,
    )
    names = {name for name in result.stdout.decode("utf-8").split("\0") if name}
    return sorted(name for name in names if (root / name).is_file())


def local_targets(path: str, text: str) -> list[str]:
    """Repository-relative targets of local links in `text`, a file at `path`."""
    targets = []
    for target in LINK.findall(text):
        if re.match(r"^[a-z]+:", target) or target.startswith("#"):
            continue
        local = target.split("#", 1)[0].replace("%20", " ")
        if local:
            targets.append(posixpath.normpath(posixpath.join(posixpath.dirname(path), local)))
    return targets


def unreachable_docs(root: Path, files: list[str] | None = None) -> list[str]:
    """Documents under docs/ that cannot be reached by following links from docs/README.md."""
    docs = {name for name in (files if files is not None else markdown_files(root)) if name.startswith("docs/")}
    if DOC_MAP not in docs:
        return sorted(docs)
    seen, queue = {DOC_MAP}, [DOC_MAP]
    while queue:
        current = queue.pop()
        for target in local_targets(current, (root / current).read_text(encoding="utf-8")):
            candidates = [target, posixpath.join(target, "README.md")]
            for candidate in candidates:
                if candidate in docs and candidate not in seen:
                    seen.add(candidate)
                    queue.append(candidate)
    return sorted(docs - seen)
