# Frontend Auto-Apply Search Filters Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Enable automatic search filtering in the permit register as the user types (with a 300ms debounce on text fields) and immediately on dropdown/date changes, while preserving manual search, reset, and URL back-navigation.

**Architecture:** A generic `useDebounce` hook provides debounced text values (`permitNumber`, `holderName`) with a 300ms delay. `PermitRegister` derives an active query combining debounced text fields with immediate dropdowns/date filters/pagination, executing queries reactively while guarding against out-of-order race conditions. Manual search and reset triggers execute immediately.

**Tech Stack:** React 19, TypeScript, Vite, Tailwind CSS.

## Global Constraints
- Text inputs (`permitNumber`, `holderName`) must debounce queries by 300ms.
- Dropdown selects (`hallId`, `purposeId`, `status`) and date inputs (`startDateFrom`, `startDateTo`) must trigger immediately.
- Form submit (Search button or Enter key) must trigger search immediately with current input values.
- Reset button must clear all inputs and load default register immediately.
- Back-navigation filter persistence (`RC-2 AC-3`) via URL query parameters must be preserved.
- Empty results (`FR-07`, `BR-8`) must return standard EmptyState without errors.
- No regression in `npm run build` or `npm run lint`.

---

### Task 1: Create `useDebounce` Hook

**Files:**
- Create: `frontend/src/lib/useDebounce.ts`

**Interfaces:**
- Produces: `export function useDebounce<T>(value: T, delayMs: number): T`

- [ ] **Step 1: Write `useDebounce` implementation**

Create `frontend/src/lib/useDebounce.ts`:
```typescript
import { useEffect, useState } from 'react';

/**
 * Custom hook that returns a debounced version of the provided value.
 * Updates after `delayMs` has elapsed since the last value change.
 */
export function useDebounce<T>(value: T, delayMs: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delayMs);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delayMs]);

  return debouncedValue;
}
```

- [ ] **Step 2: Verify TypeScript compilation**

Run:
```bash
npm run build --prefix frontend
```
Expected: PASS (exited with code 0).

- [ ] **Step 3: Commit**

```bash
git add frontend/src/lib/useDebounce.ts
git commit -m "feat(frontend): add useDebounce utility hook"
```

---

### Task 2: Integrate Reactive Auto-Apply Search in `PermitRegister.tsx`

**Files:**
- Modify: `frontend/src/components/PermitRegister.tsx`

**Interfaces:**
- Consumes: `useDebounce` from `../lib/useDebounce`
- Consumes: `SearchFilters` from `../types/permit`
- Consumes: `api.searchPermits` from `../services/api`

- [ ] **Step 1: Update `PermitRegister.tsx` to debounce text filters and trigger queries reactively**

In `frontend/src/components/PermitRegister.tsx`:
1. Import `useDebounce` from `../lib/useDebounce`.
2. Apply `useDebounce` to `filters.permitNumber` (300ms) and `filters.holderName` (300ms).
3. Compute `activeFilters`:
```typescript
  const debouncedPermitNumber = useDebounce(filters.permitNumber, 300);
  const debouncedHolderName = useDebounce(filters.holderName, 300);

  const activeFilters = useMemo<SearchFilters>(
    () => ({
      ...filters,
      permitNumber: debouncedPermitNumber,
      holderName: debouncedHolderName,
    }),
    [
      debouncedPermitNumber,
      debouncedHolderName,
      filters.hallId,
      filters.purposeId,
      filters.status,
      filters.startDateFrom,
      filters.startDateTo,
      filters.page,
      filters.size,
    ]
  );
```
4. Maintain a request sequence counter / ref or abort flag in `fetchPermits` to ignore stale out-of-order network responses.
5. In `useEffect`, trigger `fetchPermits(activeFilters)` when `activeFilters` changes.
6. In `handleSearchSubmit`, cancel/override with current raw `filters` immediately: `fetchPermits(filters)`.
7. In `handleReset`, set `filters` to `DEFAULT_FILTERS` and call `fetchPermits(DEFAULT_FILTERS)`.

- [ ] **Step 2: Verify TypeScript compilation and linting**

Run:
```bash
npm run build --prefix frontend && npm run lint --prefix frontend
```
Expected: PASS with 0 errors.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/components/PermitRegister.tsx
git commit -m "feat(frontend): auto-apply search filters on text debounce and select change"
```

---

### Task 3: Comprehensive Verification & Contract Check

**Files:**
- Test / Verify: `frontend/src/components/PermitRegister.tsx`, `frontend/src/components/FilterBar.tsx`

- [ ] **Step 1: Run full frontend build and lint check**

Run:
```bash
npm run build --prefix frontend && npm run lint --prefix frontend
```
Expected: Build succeeds, bundle size within budget, 0 lint errors.

- [ ] **Step 2: Verify with backend test suite**

Ensure full project integrity including backend tests:
Run:
```bash
cd backend && ./mvnw test
```
Expected: All tests pass (`BUILD SUCCESS`).

- [ ] **Step 3: Final Git status check and cleanup**

Verify clean working directory and all commits properly organized.
