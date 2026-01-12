# -*- coding: utf-8 -*-
import asyncio
import sys
import os

# Force UTF-8 encoding for Windows
if sys.platform == "win32":
    import codecs
    sys.stdout = codecs.getwriter("utf-8")(sys.stdout.detach())
    sys.stderr = codecs.getwriter("utf-8")(sys.stderr.detach())

sys.path.append("D:/Major Project/Project/resume-backend")

from app.services.scraping_orchestrator import orchestrator

async def main():
    print("[START] Triggering job scraping...")
    result = await orchestrator.scrape_all_platforms(limit_per_platform=10)
    print(f"\n[COMPLETE] Scraping complete!")
    print(f"Total scraped: {result['total_scraped']}")
    print(f"Total stored: {result['total_stored']}")
    print(f"Duration: {result['duration_seconds']:.2f}s")

if __name__ == "__main__":
    asyncio.run(main())
