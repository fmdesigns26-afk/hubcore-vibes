"""Exercise the production monthly SQL against SQLite at SAST boundaries."""
import pathlib
import re
import sqlite3
from datetime import datetime

source = pathlib.Path("functions/api/analytics.js").read_text()
query = re.search(r"`(SELECT strftime[^`]+)`", source).group(1)
db = sqlite3.connect(":memory:")
db.execute("CREATE TABLE analytics_events (visitor_id TEXT, event_name TEXT, timestamp INTEGER)")
def ms(value):
    return int(datetime.fromisoformat(value.replace("Z", "+00:00")).timestamp() * 1000)
events = [
    ("before", "page_view", "2026-08-31T21:59:59.999Z"),
    ("returning", "page_view", "2026-08-31T22:00:00Z"),
    ("returning", "page_view", "2026-09-30T21:59:59.999Z"),
    ("returning", "page_view", "2026-09-30T22:00:00Z"),
    ("new", "page_view", "2026-09-30T22:00:00.001Z"),
    ("new", "page_view", "2026-10-31T21:59:59.999Z"),
    ("click", "trailer_like", "2026-10-01T12:00:00Z"),
    ("november", "page_view", "2026-10-31T22:00:00Z"),
]
db.executemany("INSERT INTO analytics_events VALUES (?,?,?)",
               [(visitor, event, ms(time)) for visitor, event, time in events])
start = ms("2026-08-31T22:00:00Z")
def totals(now):
    return db.execute(query, (start, ms(now))).fetchall()
assert totals("2026-09-30T21:59:59.999Z") == [("2026-09", 2, 1)]
assert totals("2026-09-30T22:00:00Z") == [("2026-09", 2, 1), ("2026-10", 1, 1)]
assert totals("2026-10-31T21:59:59.999Z") == [("2026-09", 2, 1), ("2026-10", 3, 2)]
assert totals("2026-10-31T22:00:00Z") == [("2026-09", 2, 1), ("2026-10", 3, 2), ("2026-11", 1, 1)]
print("SAST boundaries, September preservation, monthly unique visitors and event filtering passed.")
