#!/usr/bin/env python3
import json
import os


def main():
    ws = os.environ.get("WORKSPACE", "")
    if not ws:
        return
    out = {
        "workspace": ws,
        "status": "noop",
    }
    os.makedirs(ws, exist_ok=True)
    with open(os.path.join(ws, "repro_report.json"), "w") as f:
        json.dump(out, f, indent=2)


if __name__ == "__main__":
    main()
