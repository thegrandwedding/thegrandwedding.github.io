#!/usr/bin/env python3
"""Create a new invitation link for a group of guests.

Usage:
    python3 tools/new-invite.py "Group name" EVENT [EVENT ...] [--greeting "Dear ..."] [--no-plus-one] [--no-rsvp]

EVENT is one of the event ids found in data/events/*.json:
    mehendi, sangeet, haldi, varmala, wedding, reception  (or "all")

Example:
    python3 tools/new-invite.py "Sharma family" sangeet wedding reception \
        --greeting "Dear Sharma family"

Writes data/invites/<random-code>.json and prints the link to send.
Commit and push afterwards so the link works on the live site.
"""
import argparse
import json
import secrets
import string
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SITE = "https://thegrandwedding.github.io/"
FAMILIES = next((ROOT / "data").glob("families-*.json"), None)


def load_events():
    events = {}
    for path in sorted((ROOT / "data" / "events").glob("*.json")):
        data = json.loads(path.read_text(encoding="utf-8"))
        events[data["id"]] = (data.get("order", 0), path.relative_to(ROOT).as_posix())
    return events


def main():
    p = argparse.ArgumentParser(description="Create an invitation link.")
    p.add_argument("group", help="Who this invitation is for (for your own reference)")
    p.add_argument("events", nargs="+", help="Event ids, or 'all'")
    p.add_argument("--greeting", help="Optional line shown on the Welcome tab, e.g. 'Dear Sharma family'")
    p.add_argument("--no-families", action="store_true", help="Do not show parents' names")
    p.add_argument("--no-plus-one", action="store_true", help="Hide the plus-one option on the R.S.V.P. form")
    p.add_argument("--no-rsvp", action="store_true", help="No R.S.V.P. tab, form or buttons (cards keep their phone numbers)")
    args = p.parse_args()

    known = load_events()
    wanted = list(known) if args.events == ["all"] else args.events
    unknown = [e for e in wanted if e not in known]
    if unknown:
        sys.exit(f"Unknown event(s): {', '.join(unknown)}. Known: {', '.join(known)}")
    wanted = sorted(set(wanted), key=lambda e: known[e][0])

    alphabet = string.ascii_letters + string.digits
    invites = ROOT / "data" / "invites"
    invites.mkdir(parents=True, exist_ok=True)
    while True:
        code = "".join(secrets.choice(alphabet) for _ in range(8))
        out = invites / f"{code}.json"
        if not out.exists():
            break

    invite = {
        "group": args.group,
        "greeting": args.greeting,
        "families": None if args.no_families or not FAMILIES else FAMILIES.relative_to(ROOT).as_posix(),
        "events": [known[e][1] for e in wanted],
    }
    if args.no_plus_one or args.no_rsvp:
        invite["plusOne"] = False
    if args.no_rsvp:
        invite["rsvp"] = False
    out.write_text(json.dumps(invite, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    print(f"Created {out.relative_to(ROOT)}  ({args.group}: {', '.join(wanted)})")
    print(f"Link: {SITE}?invite={code}")


if __name__ == "__main__":
    main()
