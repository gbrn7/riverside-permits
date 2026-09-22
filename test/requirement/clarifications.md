# Riverside Council — Permits release

## Clarifications thread

> Collected by the BA from email and chat after the stories were signed off. Pasted here as-is so
> nothing is lost. Not everything below has been folded back into the stories yet.

---

**Email — Finance (Priya Raghavan, Finance Manager) → BA — 12 May 2026**
**Subject: RE: permit renewal fees — please read before you build this**

Hi,

Following up on the walkthrough. Two things on renewal pricing that I need in the build, because we
are currently losing money on this.

First, the renewal fee has to be **capped at 30 days of the daily rate**. It doesn't matter if the
holder extends by 60 days or by a year — they pay for 30. This has been council policy since the
2024 fees review and the current manual process already does it. I appreciate this isn't what the
stories say.

Second, **Council Use bookings are free.** No fee at all, and no payment step. These are our own
departments booking the halls for council business and we do not invoice ourselves.

Third — and this one is important — the officers have been renewing permits that lapsed *months*
ago and back-dating the fee, which is a mess to reconcile. Please put a stop to it. A permit that
has been expired for **more than 90 days** cannot be renewed at all; that holder submits a fresh
booking. Within 90 days is fine, renew it.

Thanks,
Priya

---

**Chat — #permits-project — 19 May 2026**

**Jonathan Wee (Ops Manager, 09:41)**
quick one on the register screen. the officers have asked whether the default sort can be by
**start date, soonest first**. that's how they actually work — they're chasing what's happening this
week, not what got typed in last. the "newest first" thing in the story is how the old system did it
and nobody liked it

**BA (09:52)**
noted, will raise with the team

**Jonathan Wee (09:53)**
also can we get the register exported to excel? finance keep asking me for it and i'm doing it by
hand every friday

**BA (10:02)**
logging it, but that's probably not this release

---

**Email — Hall Supervisor (Sarah Lim) → BA — 22 May 2026**
**Subject: Feedback from the officers on the current screens (long, sorry)**

Hi,

You asked me to gather the officers' complaints about the existing register before the new build, so
here they are. I've put them roughly in the order I hear them.

The biggest one is the **weekend handover**. Whoever is on Saturday has no idea what Friday's officer
did, because the register doesn't show who touched what. This causes real arguments. I know you'll
say audit trail is a separate piece of work, but I'm flagging it again because it's the number one
thing they raise with me.

Second, the **search is too slow to be useful** on the old system — they've mostly given up on it and
keep a spreadsheet instead. I'm hopeful the new one just fixes this by being new.

Third, printing. They print permits for the halls and the layout is wrong. Not your problem I think,
but noting it.

Fourth — and this one is small but it drives them mad — the **"Hall" and "Purpose" columns show codes
instead of names.** So they see RH-02 and the number 2, and they have to go and look up what that
means, every single time. Nobody has memorised the codes and nobody wants to. A couple of times
they've actioned the wrong permit because they misread a code. **Can the new screens show the full
hall name and the full purpose name instead of the codes?**

Lastly they'd like the register to remember their last search, but I suspect that's a nice-to-have.

Thanks for asking. Happy to sit with anyone who wants to watch them work — honestly that's worth more
than this email.

Sarah

---

**Email — BA → Dev team — 28 May 2026**
**Subject: A few answers from the walkthrough**

Hi team, catching up on the open questions from the last session:

- **Withdrawal.** I checked with Jonathan. Obviously you can't withdraw a permit that has already
  started — the event is underway, the hall is occupied. Only permits that haven't started yet.
  If it has started, that's a cancellation, and cancellations are a different process (not this
  release).

- **Permit numbering.** Still checking. The samples in the story doc show `P-2026-0001` but the
  letters Finance send out use `RC/2026/0001`, and I've now been told a third thing by the team who
  maintain the old system. I don't have a straight answer for you yet — flag it and move on, I'll
  come back to you.

- **Statuses.** I don't think we ever wrote the full list down anywhere. Off the top of my head:
  active, expired, withdrawn, awaiting payment, and there's a draft state for bookings that haven't
  been approved. Please sanity-check that against what you find.

- **Payment itself** — out of scope. The permit goes to *awaiting payment* and something else picks
  it up. Don't build a payment screen.

Cheers

---

**Chat — #permits-project — 04 Jun 2026**

**Jonathan Wee (16:20)**
heads up, Westfield Hall comes online in Q4 so the hall list won't stay at 4 forever. don't hardcode
them

**Jonathan Wee (16:21)**
also for renewals — the fee shown to the officer before they confirm needs to be the *actual* amount
we'll invoice. they read it out to the holder on the phone. if it's wrong we get a complaint
