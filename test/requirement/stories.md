# Riverside Council — Community Hall Booking Permits

## User stories

**Document owner:** BA team
**Version:** 1.2 — 30 Apr 2026
**Status:** Signed off for build

> Residents and organisations book Riverside Council's community halls. A booking that is approved
> becomes a **permit**. Permits Officers manage the permit register: they find permits, review them,
> renew them when a holder wants to keep using the hall, and withdraw them when a holder pulls out.
>
> This release covers the **staff-facing** register only. The public booking portal already exists
> and is out of scope.

### Reference data

Halls (4): Riverside Community Hall, Eastgate Pavilion, Northbrook Function Room, Southbank
Assembly Hall. Each hall has a district and a **daily rate**.

Purpose of booking: Community Event, Religious Service, Private Function, Commercial Use.

---

## RC-1 — Search the permit register

**As a** Permits Officer
**I want to** search the permit register by a combination of filters
**So that** I can find the permit I need to act on without scrolling the whole register.

### Acceptance criteria

1. The officer can search by any combination of: permit number, holder name (partial match, case
   insensitive), hall, purpose, status, and a date range.
2. All filters are optional. With no filters supplied, the whole register is returned.
3. Results are paged, 10 rows to a page, **most recently created first**.
4. The results grid shows: permit number, holder name, hall, purpose, status, start date, end date,
   and fee.
5. A **Reset** control clears every filter and returns the whole register.
6. If nothing matches, the officer sees an empty state, not an error.

---

## RC-2 — View a permit

**As a** Permits Officer
**I want to** open a single permit and see everything about it
**So that** I can decide what action to take.

### Acceptance criteria

1. Opening a row from the results grid shows the full permit, including its renewal history if it
   has been renewed before.
2. The view is read-only. Nothing on this screen changes the permit.
3. The officer can return to the results grid with their search filters still applied.

---

## RC-3 — Renew a permit

**As a** Permits Officer
**I want to** extend a permit to a new end date
**So that** a holder can keep using the hall without applying all over again.

### Acceptance criteria

1. From the permit view, the officer starts a renewal by entering a **new end date**.
2. The new end date must be after the permit's current end date. Otherwise the renewal is rejected
   with a clear message.
3. Only permits in status **ACTIVE** may be renewed.
4. The **renewal fee** is the hall's daily rate multiplied by the number of days added
   (current end date → new end date, counting the added days only).
5. The officer is shown the calculated fee and must confirm it **before** anything is saved.
6. On confirmation:
   - a renewal record is kept, showing the previous end date, the new end date and the fee;
   - the permit's end date becomes the new end date;
   - the permit moves to *awaiting payment*;
   - the change is recorded in the permit's history.

---

## RC-4 — Withdraw a permit

**As a** Permits Officer
**I want to** withdraw a permit when the holder asks me to
**So that** the hall is released and the register stays accurate.

### Acceptance criteria

1. From the permit view, the officer can withdraw the permit.
2. A withdrawal reason is mandatory — free text, up to 500 characters.
3. The permit's status becomes **WITHDRAWN** and the reason is recorded in its history.
4. Withdrawal does not refund anything. Refunds are handled outside this system.

---

## Sample permit records

Provided by the BA for reference. Illustrative, not exhaustive.

| Permit No | Holder | Hall | Purpose | Status | Start | End | Fee |
|---|---|---|---|---|---|---|---|
| P-2026-0001 | Amelia Tan | Riverside Community Hall | Community Event | ACTIVE | 01 Jun 2026 | 14 Jun 2026 | 1,680.00 |
| P-2026-0002 | Grace Fellowship | Eastgate Pavilion | Religious Service | ACTIVE | 05 Jun 2026 | 04 Jul 2026 | 2,850.00 |
| P-2026-0003 | Devi Ramasamy | Northbrook Function Room | Private Function | EXPIRED | 01 Nov 2025 | 07 Nov 2025 | 560.00 |
| P-2026-0004 | Northbrook Yoga Co. | Northbrook Function Room | Commercial Use | ACTIVE | 10 Jun 2026 | 24 Jun 2026 | 1,120.00 |
| P-2026-0006 | Marcus Oyelaran | Southbank Assembly Hall | Private Function | AWAITING PAYMENT | 20 Jun 2026 | 21 Jun 2026 | 300.00 |
| P-2026-0008 | Priya Nair | Riverside Community Hall | Private Function | WITHDRAWN | 20 May 2026 | 22 May 2026 | 360.00 |
| P-2026-0009 | Southbank Arts Trust | Southbank Assembly Hall | Community Event | EXPIRED | 01 Feb 2026 | 10 Feb 2026 | 1,500.00 |
