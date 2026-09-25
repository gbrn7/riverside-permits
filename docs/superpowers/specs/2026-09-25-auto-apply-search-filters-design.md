# Design Specification: Auto-Apply Filtering in Search Permits

- **Document:** 2026-09-25-auto-apply-search-filters-design.md
- **Status:** Approved
- **Author:** Antigravity AI & Human Architect
- **Context:** Riverside Council Permit Register Frontend (`RC-1 Search`, `RC-2 View`)

---

## 1. Background & Goals

Currently, the Riverside Council Hall Permit Register allows officers to input filters across 7 criteria:
- `permitNumber` (text)
- `holderName` (text)
- `hallId` (select)
- `purposeId` (select)
- `status` (select)
- `startDateFrom` (date)
- `startDateTo` (date)

Currently, typing or selecting filters only modifies local state, requiring officers to press Enter or click the "Search" button to trigger the backend API call (`GET /api/permits`).

### Goal
Enhance the user experience by automatically applying filters as officers interact with the inputs:
1. **Debounced Search-as-You-Type:** Keystrokes in text inputs (`permitNumber`, `holderName`) trigger search automatically after a 300ms pause.
2. **Immediate Trigger for Discrete Filters:** Dropdowns (`hallId`, `purposeId`, `status`) and date inputs (`startDateFrom`, `startDateTo`) apply immediately upon selection/change.
3. **Manual Trigger Preserved:** The "Search" button and Enter key remain active to allow immediate submission without waiting for the debounce timeout.
4. **Immediate Reset:** The "Reset" button clears all fields and resets to the default full register immediately.
5. **Preserve URL & Navigation State:** URL query parameters update on successful search and back-navigation (`RC-2 AC-3`) continues to restore filter state.

---

## 2. Architecture & Data Flow

### 2.1 Hook Architecture (`useDebounce.ts`)
A reusable utility hook is created at `frontend/src/lib/useDebounce.ts`:
```typescript
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

### 2.2 Active Query Composition in `PermitRegister.tsx`
`PermitRegister` manages:
1. `filters: SearchFilters` — Immediate state representing current input field values.
2. `debouncedPermitNumber = useDebounce(filters.permitNumber, 300)`
3. `debouncedHolderName = useDebounce(filters.holderName, 300)`
4. `activeFilters: SearchFilters` — Derived query combining debounced text values with immediate dropdown/date/pagination values:
   - `permitNumber: debouncedPermitNumber`
   - `holderName: debouncedHolderName`
   - `hallId: filters.hallId`
   - `purposeId: filters.purposeId`
   - `status: filters.status`
   - `startDateFrom: filters.startDateFrom`
   - `startDateTo: filters.startDateTo`
   - `page: filters.page`
   - `size: filters.size`

When `activeFilters` changes, an effect triggers `fetchPermits(activeFilters)`.

### 2.3 Manual Immediate Search & Reset
- **Manual "Search" / Form Submit:** Submitting the form calls `fetchPermits(filters)` immediately with the raw un-debounced filter values, ensuring zero perceived latency if the user hits Enter or clicks the Search button.
- **Reset:** Calling `handleReset` resets `filters` to `DEFAULT_FILTERS`, cancels any pending timeouts, and immediately fetches the full register.

### 2.4 Race Condition & Cancellation Guard
To prevent rapid sequential requests from resolving out-of-order, `fetchPermits` uses an `AbortController` (or sequence ID) to cancel/ignore stale responses when a newer request is dispatched.

---

## 3. Detailed Component Modifications

### 3.1 `frontend/src/lib/useDebounce.ts`
- New file providing `useDebounce` generic hook.

### 3.2 `frontend/src/components/PermitRegister.tsx`
- Integrate `useDebounce` for text filter fields.
- Trigger `fetchPermits` reactively on changes to `activeFilters`.
- Preserve existing pagination handling and error banners.
- Sync URL search params cleanly upon each executed search.

### 3.3 `frontend/src/components/FilterBar.tsx`
- Keep component fully controlled without breaking changes to props interface.
- Maintain existing buttons (`Search` and `Reset`) and form submission.

---

## 4. Verification & Testing

1. **Unit / Static Verification:**
   - Execute TypeScript compiler check: `npm run build` or `npx tsc --noEmit`.
   - Verify zero lint/type regressions.
2. **Behavioral Testing:**
   - Type in `permitNumber` or `holderName` -> observe API request fires ~300ms after user stops typing.
   - Change `hallId`, `purposeId`, or `status` -> observe API request fires immediately.
   - Click "Search" -> observe request fires immediately.
   - Click "Reset" -> observe all inputs clear and full register loads immediately.
   - Navigate to Permit Detail and click Back -> observe filters and results are preserved from URL params.
