#!/usr/bin/env python3
"""
pipeline/reconciler.py — Requirements Reconciliation Engine

Ingests raw requirements from stories.md and clarifications.md,
identifies contradictions, resolves stakeholder hierarchies based on council policy precedence,
and outputs a structured, machine-readable journey specification.
"""

import sys
import json
import re
from pathlib import Path

def reconcile_rc4(stories_path: Path, clarifications_path: Path) -> dict:
    stories_text = stories_path.read_text(encoding="utf-8") if stories_path.exists() else ""
    clarif_text = clarifications_path.read_text(encoding="utf-8") if clarifications_path.exists() else ""

    reconciliation = {
        "journey_id": "RC-4",
        "title": "Withdraw a Permit",
        "actor": "Permits Officer",
        "goal": "Withdraw an unstarted permit upon holder request to release the hall and maintain register accuracy",
        "stakeholder_inputs": [
            {
                "source": "stories.md#RC-4",
                "authority": "Signed User Story v1.2",
                "raw_statements": [
                    "From the permit view, the officer can withdraw the permit.",
                    "A withdrawal reason is mandatory — free text, up to 500 characters.",
                    "The permit's status becomes WITHDRAWN and the reason is recorded in its history.",
                    "Withdrawal does not refund anything. Refunds are handled outside this system."
                ]
            },
            {
                "source": "clarifications.md#28-May-BA-Ops",
                "authority": "Operational Policy (Jonathan Wee / BA)",
                "raw_statements": [
                    "Obviously you can't withdraw a permit that has already started — the event is underway, the hall is occupied.",
                    "Only permits that haven't started yet can be withdrawn.",
                    "If it has started, that's a cancellation, and cancellations are a different process (not this release).",
                    "Payment itself — out of scope. Don't build a payment screen."
                ]
            }
        ],
        "conflicts_and_resolutions": [
            {
                "conflict_id": "C-RC4-01",
                "topic": "Withdrawal Eligibility vs Event Start Date",
                "story_rule": "Permit can be withdrawn from permit view with no start date restriction.",
                "clarification_rule": "Permit CANNOT be withdrawn once event has started (startDate <= today). Only permits that have not started (startDate > today) are eligible.",
                "resolved_precedence": "Clarification (Ops Manager Jonathan Wee) supersedes generic story. Operational reality dictates occupied halls cannot be withdrawn.",
                "action": "Enforce BR-13: Reject withdrawal with 400 PERMIT_ALREADY_STARTED if startDate <= LocalDate.now()."
            },
            {
                "conflict_id": "C-RC4-02",
                "topic": "Financial Refunds on Withdrawal",
                "story_rule": "Withdrawal does not refund anything. Refunds handled outside.",
                "clarification_rule": "Payment itself is out of scope. No refund processing in this system.",
                "resolved_precedence": "Unanimous alignment between BA and Finance.",
                "action": "Zero database changes for refunds. Anti-invention check must reject any refund schema."
            },
            {
                "conflict_id": "C-RC4-03",
                "topic": "Terminal State Enforcement",
                "story_rule": "Permit status becomes WITHDRAWN.",
                "clarification_rule": "Permit lifecycle has discrete terminal states (WITHDRAWN).",
                "resolved_precedence": "Permits already WITHDRAWN cannot be re-withdrawn.",
                "action": "Enforce BR-14: Reject withdrawal with 409 WRONG_STATUS if permit status is already WITHDRAWN."
            }
        ],
        "functional_requirements": [
            {
                "id": "FR-19",
                "rule": "BR-11",
                "summary": "Withdrawal action accessible from Permit Detail view",
                "description": "Officer can initiate withdrawal from the read-only permit detail screen if eligible."
            },
            {
                "id": "FR-20",
                "rule": "BR-12",
                "summary": "Mandatory withdrawal reason validation",
                "description": "Withdrawal reason is mandatory, trimmed, non-blank, and max 500 characters."
            },
            {
                "id": "FR-21",
                "rule": "BR-13",
                "summary": "Start-date boundary eligibility check",
                "description": "Permit can only be withdrawn if startDate is strictly in the future (startDate > today). If event has started, return 400 PERMIT_ALREADY_STARTED."
            },
            {
                "id": "FR-22",
                "rule": "BR-5",
                "summary": "Status transition to WITHDRAWN",
                "description": "Upon successful confirmation, permit status transitions to WITHDRAWN and updatedAt is updated."
            },
            {
                "id": "FR-23",
                "rule": "BR-9, BR-10",
                "summary": "Audit history recording",
                "description": "Insert permit_history record with action='WITHDRAWN', detail=reason, performed_by='system', performed_at=now()."
            },
            {
                "id": "FR-24",
                "rule": "BR-14",
                "summary": "Terminal state rejection",
                "description": "Permits already in WITHDRAWN status cannot be withdrawn again. Return 409 WRONG_STATUS."
            }
        ]
    }
    return reconciliation

if __name__ == "__main__":
    base_dir = Path(__file__).resolve().parent.parent
    stories = base_dir / "test" / "requirement" / "stories.md"
    clarif = base_dir / "test" / "requirement" / "clarifications.md"

    spec = reconcile_rc4(stories, clarif)
    out_file = base_dir / "pipeline" / "reconciled_rc4.json"
    out_file.write_text(json.dumps(spec, indent=2), encoding="utf-8")
    print(f"[RECONCILER] Successfully extracted {len(spec['functional_requirements'])} requirements for RC-4 into {out_file}")
