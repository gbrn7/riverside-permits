#!/usr/bin/env python3
"""
pipeline/run_pipeline.py — Master Orchestration Script for Part 4

Executes the full pipeline:
1. Reconciler: Ingests raw stories and email clarifications, resolves conflicts.
2. Generator: Produces artifacts (1a, 1b, 1c, 1d) and code (Spring Boot + React).
3. Verifier: Executes Anti-Invention Gate, Anti-Drop Gate, and test suites.

Usage:
    python3 pipeline/run_pipeline.py --story=RC-4
    python3 pipeline/run_pipeline.py --story=RC-4 --simulate-invention
    python3 pipeline/run_pipeline.py --story=RC-4 --simulate-drop
"""

import sys
import argparse
import subprocess
from pathlib import Path

def main():
    parser = argparse.ArgumentParser(description="Riverside Council AI Agent Pipeline Runner")
    parser.add_argument("--story", default="RC-4", help="User story journey to generate (default: RC-4)")
    parser.add_argument("--verify-only", action="store_true", help="Skip generation and run verifier only")
    parser.add_argument("--simulate-invention", action="store_true", help="Test that verifier catches and rejects inventions")
    parser.add_argument("--simulate-drop", action="store_true", help="Test that verifier catches and rejects dropped requirements")
    args = parser.parse_args()

    base_dir = Path(__file__).resolve().parent.parent

    print(f"\n=======================================================")
    print(f"  STARTING AI PIPELINE FOR JOURNEY: {args.story}")
    print(f"=======================================================\n")

    if not args.verify_only:
        # Step 1: Requirements Reconciliation
        print("▶ Stage 1: Running Requirements Reconciliation Engine...")
        reconcile_res = subprocess.run([sys.executable, str(base_dir / "pipeline" / "reconciler.py")], capture_output=True, text=True)
        print(reconcile_res.stdout)
        if reconcile_res.returncode != 0:
            print(f"❌ Reconciler failed: {reconcile_res.stderr}")
            sys.exit(1)

        # Step 2: Downstream Artifact & Code Generation
        print("▶ Stage 2: Running Generator Agent (Artifacts & Code)...")
        gen_res = subprocess.run([sys.executable, str(base_dir / "pipeline" / "generator.py")], capture_output=True, text=True)
        print(gen_res.stdout)
        if gen_res.returncode != 0:
            print(f"❌ Generator failed: {gen_res.stderr}")
            sys.exit(1)

    # Step 3: Verification Checks (Anti-Invention, Anti-Drop, Test Execution)
    print("▶ Stage 3: Running Automated Dual-Gate Verifier...")
    verifier_cmd = [sys.executable, str(base_dir / "pipeline" / "verifier.py")]
    if args.simulate_invention:
        verifier_cmd.append("--simulate-invention")
    if args.simulate_drop:
        verifier_cmd.append("--simulate-drop")

    verif_res = subprocess.run(verifier_cmd)
    sys.exit(verif_res.returncode)

if __name__ == "__main__":
    main()
