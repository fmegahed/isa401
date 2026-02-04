# May 2024 OEWS Estimates — Data Dictionary / Description

**Dataset:** Occupational Employment and Wage Statistics (OEWS) Survey (May 2024 Estimates)  
**Publisher:** U.S. Bureau of Labor Statistics (BLS), Department of Labor  
**Website:** https://www.bls.gov/oes/  
**Contact:** oewsinfo@bls.gov  

> Not all fields are available for every type of estimate.

---

## Overview

This dataset provides employment and wage estimates for occupations (SOC) by geography (U.S., state, territory, metropolitan and nonmetropolitan areas) and, for some releases, by industry (NAICS) and ownership. Estimates include employment counts, measures of sampling error (PRSE), and wage levels (mean and percentiles) on hourly and/or annual bases.

---

## Field Definitions

| Field | Description |
|---|---|
| `area` | Geographic identifier: U.S. (99), state FIPS code, Metropolitan Statistical Area (MSA) code, or OEWS-specific nonmetropolitan area code. |
| `area_title` | Area name. |
| `area_type` | Area type: `1`=U.S.; `2`=State; `3`=U.S. Territory; `4`=Metropolitan Statistical Area (MSA); `6`=Nonmetropolitan Area. |
| `prim_state` | Primary state for the given area. `"US"` is used for national estimates. |
| `naics` | North American Industry Classification System (NAICS) code for the given industry. |
| `naics_title` | NAICS title for the given industry. |
| `i_group` | Industry level indicator: cross-industry or NAICS sector, 3-digit, 4-digit, 5-digit, or 6-digit industry. For industries no longer published at the 4-digit NAICS level, “4-digit” indicates the most detailed breakdown available (either a standard NAICS 3-digit industry or an OEWS-specific combination of 4-digit industries). Some industries aggregated to the 3-digit level (e.g., `327000`) may appear twice (once as “3-digit” and once as “4-digit”). |
| `own_code` | Ownership type: `1`=Federal Government; `2`=State Government; `3`=Local Government; `123`=Federal, State, and Local Government; `235`=Private, State, and Local Government; `35`=Private and Local Government; `5`=Private; `57`=Private, Local Government Gambling Establishments (Sector 71), and Local Government Casino Hotels (Sector 72); `58`=Private plus State and Local Government Hospitals; `59`=Private and Postal Service; `1235`=Federal, State, and Local Government and Private Sector. |
| `occ_code` | 6-digit Standard Occupational Classification (SOC) code or OEWS-specific occupation code. |
| `occ_title` | SOC title or OEWS-specific occupation title. |
| `o_group` | SOC occupation level (major/minor/broad/detailed) and all-occupations totals. For occupations no longer published at the SOC detailed level, “detailed” indicates the most detailed data available (either a standard SOC broad occupation or an OEWS-specific combination of detailed occupations). Some occupations aggregated to the SOC broad level may appear twice (once as “broad” and once as “detailed”). |
| `tot_emp` | Estimated total employment, rounded to the nearest 10 (excludes self-employed). |
| `emp_prse` | Percent relative standard error (PRSE) for the employment estimate (measure of sampling error as a percent of the estimate). Lower PRSE generally indicates higher precision. |
| `jobs_1000` | Jobs per 1,000 in the given area for the occupation. **Only available for state and MSA estimates; otherwise blank.** |
| `loc_quotient` | Location quotient: ratio of an occupation’s share of area employment to its share of U.S. employment. Example: 10% locally vs 2% nationally → LQ = 5. **Only available for state, metropolitan, and nonmetropolitan area estimates; otherwise blank.** |
| `pct_total` | Percent of industry employment in the given occupation. Percents may not sum to 100 due to suppressed/unpublished occupations. **Only available for national industry estimates; otherwise blank.** |
| `pct_rpt` | Percent of establishments reporting the occupation for the cell. **Only available for national industry estimates; otherwise blank.** |
| `h_mean` | Mean hourly wage. |
| `a_mean` | Mean annual wage. |
| `mean_prse` | Percent relative standard error (PRSE) for the mean wage estimate (sampling error measure). Lower PRSE generally indicates higher precision. |
| `h_pct10` | Hourly 10th percentile wage. |
| `h_pct25` | Hourly 25th percentile wage. |
| `h_median` | Hourly median wage (50th percentile). |
| `h_pct75` | Hourly 75th percentile wage. |
| `h_pct90` | Hourly 90th percentile wage. |
| `a_pct10` | Annual 10th percentile wage. |
| `a_pct25` | Annual 25th percentile wage. |
| `a_median` | Annual median wage (50th percentile). |
| `a_pct75` | Annual 75th percentile wage. |
| `a_pct90` | Annual 90th percentile wage. |
| `annual` | Contains `"TRUE"` if **only annual** wages are released (e.g., occupations typically working fewer than 2,080 hours/year but paid annually such as teachers, pilots, athletes). |
| `hourly` | Contains `"TRUE"` if **only hourly** wages are released (e.g., occupations typically working fewer than 2,080 hours/year and paid hourly such as actors, dancers, musicians, singers). |

---

## Notes on Missing/Suppressed Values

The dataset uses special symbols in some fields:

- `*` = a wage estimate is not available  
- `**` = an employment estimate is not available  
- `#` = wage is ≥ **$115.00/hour** or ≥ **$239,200/year**  
- `~` = percent of establishments reporting the occupation is **< 0.5%**

---

## Practical Interpretation Tips

- **Employment (`tot_emp`) is rounded** to the nearest 10; small differences may be rounding artifacts.
- **PRSE fields (`emp_prse`, `mean_prse`)** indicate sampling uncertainty; use them to judge reliability.
- **Hourly vs annual fields:** Some occupations will only have one wage basis published (see `annual` and `hourly` flags).

---

## Source Citation

Bureau of Labor Statistics, U.S. Department of Labor. *Occupational Employment and Wage Statistics (OEWS), May 2024 Estimates.*  
https://www.bls.gov/oes/  
