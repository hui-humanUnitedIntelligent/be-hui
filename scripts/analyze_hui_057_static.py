#!/usr/bin/env python3
"""Static analysis for hui_057_commerce_schema_final.sql"""

import re
import sys
from pathlib import Path

OPTIONAL_COLS = {
    "works": {"status", "creator_id", "for_sale", "shipping_cost", "title", "cover_url", "user_id", "price"},
    "experiences": {"status", "title", "cover_url", "user_id", "price"},
    "orders": {"buyer_id", "customer_id", "status", "state", "total_eur", "created_at",
               "commission_eur", "platform_fee_eur", "impact_eur"},
    "order_items": {"price_eur", "order_id", "creator_id", "seller_id", "unit_price_eur"},
}

ALIAS_MAP = {"w": "works", "e": "experiences", "o": "orders", "oi": "order_items", "orders": "orders"}


def load_sql(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def strip_comments(sql: str) -> str:
    sql = re.sub(r"--[^\n]*", "", sql)
    sql = re.sub(r"/\*.*?\*/", "", sql, flags=re.S)
    return sql


def balanced_dollar_quotes(sql: str) -> list[str]:
    errs = []
    tags = re.findall(r"\$[A-Za-z_]*\$", sql)
    stack = []
    for tag in tags:
        if not stack or stack[-1] != tag:
            stack.append(tag)
        else:
            stack.pop()
    if stack:
        errs.append(f"Unbalanced dollar quotes: {stack}")
    return errs


def find_static_optional_refs(sql: str) -> list[str]:
    """Find optional column refs outside dynamic/guarded contexts."""
    issues = []
    lines = sql.splitlines()

    in_do_view = False
    do_view_depth = 0
    in_guarded_do = False
    guarded_depth = 0

    for i, raw in enumerate(lines, 1):
        line = raw.strip()
        if not line or line.startswith("--"):
            continue

        if re.search(r"DO\s+\$view\$", line, re.I):
            in_do_view = True
            do_view_depth = 1
            continue

        if in_do_view:
            if re.search(r"\bDO\b", line, re.I) and "$" not in line:
                pass
            if re.search(r"\bEND\s*;\s*$", line, re.I) and "$view$" in "".join(lines[max(0, i - 3):i]):
                in_do_view = False
            continue

        if re.match(r"DO\s+\$\$", line, re.I) or re.match(r"DO\s+\$[a-z_]+\$", line, re.I):
            in_guarded_do = True
            guarded_depth = 1
            continue

        if in_guarded_do:
            guarded_depth += line.count("BEGIN") - line.count("END")
            if guarded_depth <= 0 and re.search(r"END\s*\$\$", line, re.I):
                in_guarded_do = False
            continue

        for m in re.finditer(r"\b([woe]|orders|order_items|oi)\.([a-z_][a-z0-9_]*)\b", line, re.I):
            alias, col = m.group(1).lower(), m.group(2).lower()
            table = ALIAS_MAP.get(alias, alias)
            if table in OPTIONAL_COLS and col in OPTIONAL_COLS[table]:
                if "hui_col_exists" in line:
                    continue
                if "ADD COLUMN IF NOT EXISTS" in line.upper():
                    continue
                issues.append(f"P0 Zeile {i}: statische Referenz {alias}.{col}")

        for table, cols in OPTIONAL_COLS.items():
            for col in cols:
                pat = rf"\b{table}\.{col}\b"
                if re.search(pat, line, re.I) and "hui_col_exists" not in line:
                    if "ADD COLUMN IF NOT EXISTS" in line.upper():
                        continue
                    issues.append(f"P0 Zeile {i}: statische Referenz {table}.{col}")

    return issues


def check_view_exception_handlers(sql: str) -> list[str]:
    issues = []
    blocks = re.findall(r"DO\s+\$view\$(.*?)END;\s*\$view\$;", sql, re.S | re.I)
    for idx, block in enumerate(blocks, 1):
        if "EXECUTE" in block.upper() and "EXCEPTION WHEN OTHERS" not in block.upper():
            issues.append(f"P1 View-Block {idx}: EXECUTE ohne EXCEPTION-Handler")
    return issues


def check_increment_wallet(sql: str) -> list[str]:
    issues = []
    m = re.search(
        r"CREATE OR REPLACE FUNCTION public\.increment_wallet_balance.*?END;\s*\$\$;",
        sql, re.S | re.I,
    )
    if not m:
        issues.append("P0 increment_wallet_balance Funktion fehlt")
        return issues
    body = m.group(0)
    if "hui_col_exists('creator_wallets', 'balance')" not in body:
        issues.append("P1 increment_wallet_balance: balance-Spalte nicht geprüft")
    if "hui_col_exists('creator_wallets', 'total_earned')" not in body:
        issues.append("P1 increment_wallet_balance: total_earned-Spalte nicht geprüft")
    return issues


def check_idempotency(sql: str) -> list[str]:
    issues = []
    lines = sql.splitlines()

    for i, raw in enumerate(lines):
        line = raw.strip()
        if not re.match(r'CREATE POLICY\s+"', line, re.I):
            continue
        m = re.match(r'CREATE POLICY\s+"([^"]+)"\s+ON\s+(\S+)', line, re.I)
        if not m:
            continue
        pname, table = m.group(1), m.group(2)
        window = "\n".join(lines[max(0, i - 40):i])
        drop_pat = rf'DROP POLICY IF EXISTS\s+"{re.escape(pname)}"\s+ON\s+{re.escape(table)}'
        if not re.search(drop_pat, window, re.I):
            issues.append(f"P1 Idempotenz Zeile {i+1}: CREATE POLICY \"{pname}\" ohne vorheriges DROP")

    for i, raw in enumerate(lines):
        line = raw.strip()
        if not re.match(r"CREATE TRIGGER\s+", line, re.I):
            continue
        m = re.match(r"CREATE TRIGGER\s+(\S+)", line, re.I)
        if not m:
            continue
        tname = m.group(1)
        window = "\n".join(lines[max(0, i - 15):i])
        if f"DROP TRIGGER IF EXISTS {tname}" not in window:
            issues.append(f"P1 Idempotenz Zeile {i+1}: CREATE TRIGGER {tname} ohne vorheriges DROP")

    return issues


def check_indexes_guarded(sql: str) -> list[str]:
    issues = []
    lines = sql.splitlines()
    in_guarded = False
    depth = 0

    for i, raw in enumerate(lines, 1):
        line = raw.strip()
        if re.match(r"DO\s+\$\$", line, re.I):
            in_guarded = True
            depth = 1
            continue
        if in_guarded:
            depth += line.upper().count("BEGIN") - line.upper().count("END")
            if depth <= 0 and "END $$" in line.upper().replace(" ", ""):
                in_guarded = False
            if re.match(r"CREATE INDEX", line, re.I):
                for table, cols in OPTIONAL_COLS.items():
                    for col in cols:
                        if re.search(rf"\b{col}\b", line, re.I) and "hui_col_exists" not in "\n".join(lines[max(0, i-10):i]):
                            pass
            continue

        if re.match(r"CREATE INDEX", line, re.I):
            for table, cols in OPTIONAL_COLS.items():
                for col in cols:
                    if re.search(rf"\({col}\)", line, re.I) or re.search(rf",\s*{col}\)", line, re.I):
                        issues.append(f"P0 Zeile {i}: CREATE INDEX auf optionale Spalte {col} ohne DO/hui_col_exists-Guard")

    return issues


def check_parse(sql: str) -> list[str]:
    errs = []
    clean = strip_comments(sql)
    if clean.upper().count("BEGIN") < 1:
        errs.append("Parse: kein BEGIN gefunden")
    if "COMMIT" not in clean.upper():
        errs.append("Parse: kein COMMIT gefunden")
    errs.extend(balanced_dollar_quotes(clean))
    return errs


def main() -> int:
    path = Path(sys.argv[1] if len(sys.argv) > 1 else "hui_057_commerce_schema_final.sql")
    sql = load_sql(path)

    p0 = []
    p1 = []

    p0.extend(find_static_optional_refs(sql))
    p0.extend(check_indexes_guarded(sql))

    p1.extend(check_view_exception_handlers(sql))
    p1.extend(check_increment_wallet(sql))
    p1.extend(check_idempotency(sql))

    parse_errs = check_parse(sql)

    print("=== STATISCHE ANALYSE:", path.name, "===")
    print()
    print("P0 Blocker:", len(p0))
    for x in p0:
        print(" ", x)
    print()
    print("P1 Risiken:", len(p1))
    for x in p1:
        print(" ", x)
    print()
    print("Parse-Fehler:", len(parse_errs))
    for x in parse_errs:
        print(" ", x)
    print()

    idempotent = len([x for x in p1 if "Idempotenz" in x]) == 0
    print("Idempotenz:", "OK" if idempotent else "FEHLER")

    prod_ready = len(p0) == 0 and len(parse_errs) == 0
    print("Produktionsfreigabe:", "JA" if prod_ready else "NEIN")

    return 0 if prod_ready else 1


if __name__ == "__main__":
    sys.exit(main())
