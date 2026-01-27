import asyncio
import sys
import os

# Add backend to path
sys.path.append(os.path.join(os.getcwd(), 'backend'))

from app.services.strategic import get_strategic_analysis, get_magic_formula_list

async def test():
    print("Testing Magic Formula List...")
    try:
        # mock Finviz scan if it fails due to network/scraping
        res = await get_magic_formula_list()
        print(f"Magic Formula Result Count: {len(res)}")
        if res: print(res[0])
    except Exception as e:
        print(f"Magic Formula Error: {e}")

    print("\nTesting Strategic Analysis for AAPL...")
    try:
        res = await get_strategic_analysis("AAPL")
        print(f"Ticker: {res['ticker']}")
        print(f"Moat: {res['moat']}")
        print(f"Risk: {res['risk']}")
        print(f"Technicals: {res['technicals']['patterns']}")
    except Exception as e:
        print(f"Analysis Error: {e}")

if __name__ == "__main__":
    asyncio.run(test())
