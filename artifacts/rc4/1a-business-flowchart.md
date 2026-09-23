# Artifact 1a — Business Flowchart: RC-4 (Withdraw a Permit)

> **Audience:** Non-technical council officers, Hall Supervisors, and Public-Sector Stakeholders  
> **Rule:** No HTTP verbs, no database tables, no JSON fields, no technical jargon.

```mermaid
flowchart TD
    Start(["Officer opens Permit Details screen"]) --> CheckStatus{"Is the permit already withdrawn?"}
    
    CheckStatus -- "Yes" --> NoAction["Withdraw button is disabled\nNotice: Permit is already withdrawn"]
    CheckStatus -- "No" --> CheckDate{"Has the event already started?\n(Today is on or after Start Date)"}
    
    CheckDate -- "Yes (Event started)" --> BlockStarted["Withdraw button is disabled\nNotice: In progress or past events cannot be withdrawn.\nMust be handled via Cancellation Process."]
    CheckDate -- "No (Future event)" --> ShowButton["Officer clicks 'Withdraw Permit' button"]
    
    ShowButton --> OpenModal["System opens 'Withdraw Permit' dialog\nPrompts officer for mandatory reason"]
    OpenModal --> InputReason["Officer types reason for withdrawal\n(Up to 500 characters)"]
    
    InputReason --> ValidateInput{"Is reason provided?\n(1 to 500 characters)"}
    ValidateInput -- "No / Empty" --> ShowValidation["Display error message:\n'Reason is required'"] --> InputReason
    ValidateInput -- "Exceeds 500 chars" --> ShowLengthError["Display character limit warning"] --> InputReason
    
    ValidateInput -- "Yes (Valid)" --> ConfirmAction["Officer reviews and clicks\n'Confirm Withdrawal'"]
    ConfirmAction --> ProcessWithdraw["System marks permit as WITHDRAWN\nand records reason in history"]
    
    ProcessWithdraw --> SuccessBanner["Display confirmation banner:\n'Permit successfully withdrawn. Hall released.'"]
    SuccessBanner --> RefreshView["Permit status updates to WITHDRAWN\nAudit log displays withdrawal entry\nWithdraw button disabled"]
    RefreshView --> EndState(["Permit view updated"])
```

### Key Business Decisions Displayed to Officers:
1. **Unstarted Bookings Only:** Only permits whose events have not yet commenced can be withdrawn. If the date has passed or the event is underway, it must follow the Cancellation procedure.
2. **Mandatory Audit Reason:** Council regulations require an official explanation (e.g. holder requested, illness, severe weather) up to 500 characters.
3. **No Financial Refund in this System:** Withdrawal releases the facility reservation. If a refund is due, it is issued by Council Finance through their separate accounting portal.
