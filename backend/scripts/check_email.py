"""Simple helper to check if an email exists in the local MongoDB users collection.

This uses the same shared Motor client as the app (via `database.get_client()`)
so it doesn't create an extra long-lived connection per run. It performs the
lookup asynchronously and closes the shared client when done.

Usage:
  python backend/scripts/check_email.py namduyluong304@gmail.com
"""
import os
import sys
import re
import asyncio

# Ensure we can import the project's backend modules when this script is run
# from the repository root: add the backend folder to sys.path.
SCRIPT_DIR = os.path.dirname(__file__)
BACKEND_DIR = os.path.dirname(SCRIPT_DIR)
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

from database import get_client, close_mongo_connection

# Defaults match backend/config.py (keep DB name env-overridable)
DB_NAME = os.getenv("DATABASE_NAME") or "zalo_bot_manager"


async def find_email_async(email: str):
    client = get_client()
    db = client[DB_NAME]
    pattern = re.compile(rf"^{re.escape(email.strip())}$", re.IGNORECASE)
    user = await db.users.find_one({"email": pattern})
    return user


async def main(argv):
    if len(argv) < 2:
        print("Usage: python backend/scripts/check_email.py <email>")
        return 1

    email = argv[1]
    print(f"Checking for email: {email}")
    user = await find_email_async(email)
    if user:
        print("Found user:")
        user.pop("hashed_password", None)
        print(user)
    else:
        print("No user found with that email.")

    # Close the shared client to avoid leaving connections open
    await close_mongo_connection()
    return 0


if __name__ == "__main__":
    raise SystemExit(asyncio.run(main(sys.argv)))
