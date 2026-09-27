"""NFR-12: library inventory excludes local artifacts and tracks real source paths."""
import subprocess
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

import project_catalog
from project_catalog import OUTPUT, inventory, render, role, state


class CatalogTests(unittest.TestCase):
    def test_git_inventory_includes_new_files_excludes_ignored_and_deleted(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            subprocess.run(["git", "init", "--quiet", str(root)], check=True)
            (root / ".gitignore").write_text(".env\nnode_modules/\n", encoding="utf-8")
            (root / "gone.md").write_text("old", encoding="utf-8")
            subprocess.run(["git", "add", "."], cwd=root, check=True)
            (root / "gone.md").unlink()
            (root / ".env").write_text("local fixture", encoding="utf-8")
            (root / "node_modules").mkdir()
            (root / "node_modules" / "cache.js").write_text("fixture", encoding="utf-8")
            (root / "new file.md").write_text("new", encoding="utf-8")
            self.assertEqual(inventory(root), [".gitignore", OUTPUT, "new file.md"])

    def test_render_is_order_independent_and_links_dynamic_routes(self):
        paths = ["src/z.ts", "src/[id]/page.tsx", "README.md", "src/A.ts"]
        result = render(paths)
        self.assertEqual(result, render(list(reversed(paths))))
        self.assertIn("../../src/[id]/page.tsx", result)
        self.assertLess(result.index("[A.ts]"), result.index("[z.ts]"))
        for path in paths:
            self.assertEqual(result.count("](../../" + path + ")"), 1)

    def test_status_and_role_do_not_call_placeholders_implemented(self):
        self.assertIn("Reserved", state("backend/gateway"))
        self.assertIn("Reserved", state("backend/products/edu-worker"))
        self.assertIn("Product shelf", state("backend/products"))
        self.assertNotIn("Reserved", state("backend/products/edu-api"))
        self.assertEqual(role("feature.e2e-spec.ts"), "Test / verification")
        self.assertEqual(role("feature.spec.ts"), "Test / verification")

    def test_check_rejects_stale_catalog_and_accepts_refreshed_catalog(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            destination = root / OUTPUT
            destination.parent.mkdir(parents=True)
            destination.write_text("outdated", encoding="utf-8")
            paths = ["README.md", OUTPUT]
            with patch.object(project_catalog, "ROOT", root), patch.object(project_catalog, "inventory", return_value=paths):
                with patch("sys.argv", ["project_catalog.py", "--check"]):
                    self.assertEqual(project_catalog.main(), 1)
                with patch("sys.argv", ["project_catalog.py"]):
                    self.assertEqual(project_catalog.main(), 0)
                with patch("sys.argv", ["project_catalog.py", "--check"]):
                    self.assertEqual(project_catalog.main(), 0)


if __name__ == "__main__":
    unittest.main()
