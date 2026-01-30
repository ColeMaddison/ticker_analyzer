import os
import sys

# Add the current directory to sys.path to allow importing from 'app'
sys.path.append(os.path.join(os.path.dirname(__file__)))

from app.services.macro import get_doomsday_score
from rich.console import Console
from rich.table import Table
from rich.panel import Panel

def run_cli():
    console = Console()
    console.print("[bold red]INITIALIZING DOOMSDAY ENGINE...[/bold red]")
    
    data = get_doomsday_score()
    
    if "error" in data:
        console.print(f"[bold red]ERROR: {data['error']}[/bold red]")
        return

    score = data['overall_score']
    verdict = data['verdict']
    pillars = data['pillars']
    advice = data['advice']

    # Color logic
    color = "green" if score <= 40 else "yellow" if score <= 70 else "red"

    # Main Header
    console.print(Panel(
        f"[bold {color}]DOOMSDAY RATING: {score}/100 | STATUS: {verdict}[/bold {color}]",
        border_style=color,
        expand=False
    ))

    # Table
    table = Table(show_header=True, header_style="bold cyan", box=None)
    table.add_column("PILLAR", style="dim")
    table.add_column("VALUE", justify="right")
    table.add_column("RISK", justify="center")

    table.add_row("YIELD CURVE", str(pillars['yield_curve']['value']), pillars['yield_curve']['risk'])
    table.add_row("SAHM RULE", str(pillars['sahm_rule']['value']), pillars['sahm_rule']['risk'])
    table.add_row("SECTOR FLOW", pillars['sector_flow']['value'], pillars['sector_flow']['risk'])
    table.add_row("CREDIT STRESS", pillars['credit_stress']['value'], pillars['credit_stress']['risk'])
    table.add_row("DR. COPPER", pillars['dr_copper']['trend'], pillars['dr_copper']['risk'])

    console.print(table)
    console.print("-" * 50)
    console.print(f"[bold white]ACTIONABLE ADVICE:[/bold white] {advice}")
    console.print("-" * 50)

if __name__ == "__main__":
    run_cli()
