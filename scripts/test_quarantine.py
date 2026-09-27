"""Tests for scripts/quarantine.py (moving unwanted files into DELETE_ME/)."""
from __future__ import annotations

import os
import subprocess
import tempfile
import unittest
from pathlib import Path

import quarantine


class QuarantineTests(unittest.TestCase):
    def setUp(self):
        self.directory = tempfile.TemporaryDirectory()
        self.root = Path(self.directory.name).resolve()
        subprocess.run(["git", "init", "-q"], cwd=self.root, check=True)
        (self.root / "kept.txt").write_text("tracked", encoding="utf-8")
        subprocess.run(["git", "add", "kept.txt"], cwd=self.root, check=True)

    def tearDown(self):
        self.directory.cleanup()

    def test_moves_untracked_folder_with_its_contents(self):
        (self.root / "old" / "inner").mkdir(parents=True)
        (self.root / "old" / "inner" / "a.txt").write_text("x", encoding="utf-8")
        moved = quarantine.move(self.root, [str(self.root / "old")], False, "stamp")
        self.assertEqual(moved, ["old"])
        self.assertFalse((self.root / "old").exists())
        self.assertTrue((self.root / "DELETE_ME" / "stamp" / "old" / "inner" / "a.txt").is_file())

    def test_refuses_tracked_files_without_flag(self):
        with self.assertRaises(SystemExit) as raised:
            quarantine.move(self.root, [str(self.root / "kept.txt")], False, "stamp")
        self.assertIn("tracked by Git", str(raised.exception))
        self.assertTrue((self.root / "kept.txt").is_file())

    def test_moves_tracked_files_with_flag(self):
        moved = quarantine.move(self.root, [str(self.root / "kept.txt")], True, "stamp")
        self.assertEqual(moved, ["kept.txt"])

    def test_refuses_git_root_and_outside_paths(self):
        for raw in (str(self.root), str(self.root / ".git"), str(self.root.parent)):
            with self.assertRaises(SystemExit):
                quarantine.move(self.root, [raw], True, "stamp")

    def test_does_not_follow_links_inside_moved_folder(self):
        package = self.root / "package"
        package.mkdir()
        (package / "source.ts").write_text("keep me", encoding="utf-8")
        modules = self.root / "old" / "node_modules"
        modules.mkdir(parents=True)
        link = modules / "package"
        try:
            os.symlink(package, link, target_is_directory=True)
        except OSError:
            if os.name != "nt":
                self.skipTest("symbolic links are not permitted here")
            # pnpm links workspace packages with junctions on Windows; they need no privilege.
            subprocess.run(["cmd", "/c", "mklink", "/J", str(link), str(package)], check=True, capture_output=True)
        quarantine.move(self.root, [str(self.root / "old")], False, "stamp")
        self.assertEqual((package / "source.ts").read_text(encoding="utf-8"), "keep me")

    def test_scan_finds_leftovers_but_not_real_content(self):
        (self.root / "empty" / "nested").mkdir(parents=True)
        (self.root / "scripts" / "__pycache__").mkdir(parents=True)
        (self.root / "scripts" / "tool.py").write_text("", encoding="utf-8")
        (self.root / "notes.md.orig").write_text("", encoding="utf-8")
        (self.root / "node_modules" / "x").mkdir(parents=True)
        found = dict(quarantine.scan(self.root))
        self.assertIn("empty", found)
        self.assertNotIn("empty/nested", found, "only the topmost empty folder is reported")
        self.assertIn("scripts/__pycache__", found)
        self.assertIn("notes.md.orig", found)
        self.assertNotIn("scripts", found)
        self.assertFalse(any(name.startswith("node_modules") for name in found))


if __name__ == "__main__":
    unittest.main()
