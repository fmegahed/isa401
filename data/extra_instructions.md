# Extra Instructions

## Geographic filter (exact)
- Use `area = '99'` for national rows.
- For states, use either:
  - `prim_state = 'CA'` (two-letter state code), **or**
  - `area = 'xxxxx'` (OEWS area code).
- Always specify which state identifier you mean (`prim_state` vs `area`).

## Occupation filter (exact)
- Use `occ_title = 'All Occupations'` or `occ_code = '123456'`.
- If you want the all-occupations row, **prefer** `occ_title = 'All Occupations'`.

## Industry filter (exact, if needed)
- Use `naics_title = 'Cross-industry'` or `naics = 'XXXXX'`.
- Text matches are **case- and punctuation-sensitive**.

## Aggregation level (to prevent duplicate rows)
- Specify the desired level using:
  - `o_group = 'total'` (or another `o_group` value), and/or
  - `i_group = 'cross-industry'`, `'3-digit'`, or `'sector'`.
- Use these intentionally to avoid duplicated or overlapping rows.

## Ownership filter (optional)
- Use `own_code = '5'` for Private.
- Use `own_code = '123'` for all governments.
- Include `own_code` only when you want to restrict results by ownership.

## Aggregation intent (very important)
State whether you want a single row, the raw matching rows, or an aggregate. You can copy/paste:

- **Calculate total:** `SUM(tot_emp)` across rows matching the filters  
- **Show rows:** return the matching row(s) without summing

## Suppressions and special symbols
Specify how to handle `*`, `**`, `#`, and `~`. Example options:
- Exclude rows where `tot_emp` is `'*'` or `'**'`
- Treat `'#'` as a numeric ceiling and include it
- Treat suppressed values as `NULL`

## Rounding and deduplication
- `tot_emp` is rounded to the nearest 10.
- If you want to avoid double-counting across industry or occupation groupings, specify a dedupe approach (for example: “use `o_group = 'total'` to avoid double-counting”).

## Verification step (recommended)
If any filter is ambiguous, request a preview first:
- “Show matching rows so I can confirm `naics_title`, `o_group`, and `occ_title` before aggregating.”

## Action wording (so I take the right next step)
Start your request with:
- **Calculate** / **Compute** → run a query and return computed results
- **Show** / **Filter to** → update the dashboard view and return all columns

---

# Paste-ready prompt templates

- **Calculate total U.S. employment**  
  `area = '99', occ_title = 'All Occupations', naics_title = 'Cross-industry', Calculate: SUM(tot_emp), exclude suppressed tot_emp rows`

- **Show rows to confirm labels**  
  `Show: area = '99' AND occ_title = 'All Occupations'`

- **Compare totals (cross-industry vs summed NAICS), with dedupe**  
  `Compute: area = '99', occ_title = 'All Occupations', SUM(tot_emp) for naics_title = 'Cross-industry' AND SUM(tot_emp) across all naics; use o_group = 'total' to deduplicate`

---

# Default behavior
If you include the relevant filters, I will apply these rules automatically. If a request is ambiguous, I will first show the matching rows and ask you to confirm the labels before aggregating.
