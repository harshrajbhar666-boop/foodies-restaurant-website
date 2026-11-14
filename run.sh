#!/usr/bin/env bash
# Start the Foodies Restaurant app (API + redesigned frontend) on :8000
set -e
cd "$(dirname "$0")"
python3 -m pip install -r requirements.txt --quiet
exec python3 -m uvicorn backend.main:app --reload --port 8000
