import pytest
import sys
import os
from unittest.mock import patch

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))


with patch("flet.app"):
    from flet_app.main import format_ves, format_time, blend_color, main


class TestFormatVes:
    def test_format_basic(self):
        assert format_ves(1234.56) == "1.234,56"

    def test_format_zero(self):
        assert format_ves(0) == "0,00"

    def test_format_none(self):
        assert format_ves(None) == "\u2014"

    def test_format_large(self):
        assert format_ves(1234567.89) == "1.234.567,89"

    def test_format_small(self):
        assert format_ves(0.5) == "0,50"


class TestFormatTime:
    def test_valid_iso(self):
        result = format_time("2026-06-21T15:30:00Z")
        assert result != ""

    def test_none(self):
        assert format_time(None) == ""

    def test_empty(self):
        assert format_time("") == ""

    def test_invalid(self):
        assert format_time("invalid") == ""


class TestBlendColor:
    def test_blend_dark_bg(self):
        result = blend_color("#ff4060", 0.5)
        assert result.startswith("#")
        assert len(result) == 7

    def test_blend_light_bg(self):
        result = blend_color("#059669", 0.3)
        assert result.startswith("#")
        assert len(result) == 7

    def test_invalid_color(self):
        assert blend_color("invalid", 0.5) == "invalid"


class TestMainLayout:
    def test_outer_column_has_expand(self):
        """Verify the main Column in page.add has expand=True (fixes scroll)."""
        import ast
        import inspect

        source = inspect.getsource(main)
        tree = ast.parse(source)

        expand_found = False

        class ColumnVisitor(ast.NodeVisitor):
            def visit_Call(self, node):
                nonlocal expand_found
                if (isinstance(node.func, ast.Attribute) and
                    node.func.attr == "add"):
                    for arg in node.args:
                        if (isinstance(arg, ast.Call) and
                            isinstance(arg.func, ast.Attribute) and
                            arg.func.attr == "Column"):
                            kws = {kw.arg for kw in arg.keywords if kw.arg is not None}
                            if "expand" in kws:
                                expand_found = True
                    self.generic_visit(node)

        ColumnVisitor().visit(tree)
        assert expand_found, (
            "page.add(ft.Column(...)) missing expand=True - causes ListView scroll to not work"
        )

    def test_build_history_tab_no_timer(self):
        """Verify build_history_tab no longer uses threading.Timer."""
        import ast
        import inspect
        from flet_app.main import build_history_tab

        source = inspect.getsource(build_history_tab)
        assert "Timer(" not in source, (
            "build_history_tab should not use threading.Timer"
        )

    def test_switch_tab_calls_update_history(self):
        """Verify switch_tab calls update_history_tab for index 2."""
        import ast
        import inspect
        from flet_app.main import switch_tab as fn

        source = inspect.getsource(fn)
        assert "if index == 2:" in source
        assert "update_history_tab()" in source

    def test_select_hist_date_formats_display(self):
        """Verify select_hist_date uses format_date_key for display."""
        import ast
        import inspect
        from flet_app.main import select_hist_date as fn

        source = inspect.getsource(fn)
        assert "format_date_key" in source, (
            "select_hist_date should format date with format_date_key"
        )
