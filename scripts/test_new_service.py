"""Tests for `oxctl new-service` (scripts/new_service.py, ADR-019)."""
from __future__ import annotations

import shutil
import tempfile
import unittest
from pathlib import Path

import new_service
import service_catalog
from service_catalog import CATALOG, CHART_VALUES, ROOT


class PlanTests(unittest.TestCase):
    def test_requires_a_product_record(self):
        with self.assertRaises(SystemExit) as raised:
            new_service.plan(ROOT, "unrecorded", "api", None, None)
        self.assertIn("no product record", str(raised.exception))

    def test_refuses_existing_services_and_hosts_for_non_web(self):
        with self.assertRaises(SystemExit) as raised:
            new_service.plan(ROOT, "lms", "api", None, "api")
        self.assertIn("already in services.yaml", str(raised.exception))
        self.assertIn("only web services", str(raised.exception))

    def test_places_each_kind_on_its_shelf(self):
        self.assertEqual(new_service.source_path("lms", "web", "lms-web"), "frontend/products/lms-web")
        self.assertEqual(new_service.source_path("lms", "worker", "lms-worker"), "backend/products/lms-worker")
        self.assertEqual(new_service.source_path("platform", "worker", "platform-worker"), "backend/workers/platform-worker")

    def test_picks_an_unused_port(self):
        catalog = service_catalog.load()
        used = {s["port"] for s in catalog["services"].values()}
        self.assertNotIn(new_service.free_port(catalog), used)


class ApplyTests(unittest.TestCase):
    def test_scaffold_registers_the_service_everywhere(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            for relative in (CATALOG, CHART_VALUES, new_service.DOCKERFILE):
                (root / relative).parent.mkdir(parents=True, exist_ok=True)
                shutil.copy(ROOT / relative, root / relative)
            (root / "docs/02-products/demo").mkdir(parents=True)
            (root / "docs/02-products/demo/README.md").write_text("# Demo\n", encoding="utf-8")

            web = new_service.plan(root, "demo", "web", None, None)
            new_service.apply(root, web)
            api = new_service.plan(root, "demo", "api", None, None)
            new_service.apply(root, api)

            catalog = service_catalog.parse((root / CATALOG).read_text(encoding="utf-8"))
            self.assertEqual(list(catalog["services"])[-2:], ["demo-web", "demo-api"])
            self.assertEqual(catalog["services"]["demo-web"]["host"], "demo")
            self.assertEqual(catalog["services"]["demo-api"]["helm_tag"], "services.demo-api.tag")

            chart = service_catalog._chart_services(root)
            self.assertEqual(chart["demo-web"], {"port": web["port"], "host": "demo"})
            self.assertEqual(chart["demo-api"]["port"], api["port"])
            values = (root / CHART_VALUES).read_text(encoding="utf-8")
            self.assertIn("allowFrom: [demo-web]", values)
            self.assertLess(values.index("  demo-api:"), values.index("\nnetworkPolicy:"))

            dockerfile = (root / new_service.DOCKERFILE).read_text(encoding="utf-8")
            self.assertIn("FROM runtime AS demo-api", dockerfile)
            self.assertIn("COPY backend/products/demo-api/src/ ./src/", dockerfile)
            for relative in ("src/main.mjs", "src/main.test.mjs", "package.json", "README.md"):
                self.assertTrue((root / api["path"] / relative).is_file(), relative)


if __name__ == "__main__":
    unittest.main()
