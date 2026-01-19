# Job Market Explorer Dashboard
## Tableau Build Instructions

This guide walks you through building the Class 01 demo dashboard step-by-step.

**Data Source:** Federal job postings from USAJobs.gov (1,276 jobs)
**Data File:** `dashboards/jobs_data.json` or `data/demo_dashboard/jobs_master.csv`
**Summary Stats:** `data/dashboard_summary.csv`

---

## Data Overview

| Metric | Value |
|:---|:---|
| Total Jobs | 1,276 |
| Salary Range | $43,610 - $387,500 |
| Median Salary | $105,469 |
| Average Salary | $112,928 |
| Top Category | Security & Law Enforcement (273 jobs) |
| Highest Paying Category | Data & Analytics ($139,342 avg) |

---

## Step 1: Connect to Data

1. Open Tableau Desktop
2. Click **Text file** under Connect (or **JSON** for jobs_data.json)
3. Navigate to `data/demo_dashboard/jobs_master.csv`
4. Click **Open**
5. Verify data types:
   - `latitude` and `longitude` → Geographic Role: Latitude/Longitude
   - `posted_date` → Date
   - `salary_min`, `salary_max`, `salary_mid` → Number (Whole)
   - `job_id` → String (text identifier)

---

## Step 2: Create Calculated Fields

Go to **Analysis > Create Calculated Field** for each:

### Salary Range (for tooltip)
```
"$" + STR(INT([salary_min]/1000)) + "K - $" + STR(INT([salary_max]/1000)) + "K"
```

### Year-Quarter
```
STR(YEAR([posted_date])) + " Q" + STR(DATEPART('quarter', [posted_date]))
```

---

## Sheet 1: Job Locations Map

### Build Steps:
1. Create new worksheet, name it **"Job Locations"**
2. Drag `longitude` to Columns
3. Drag `latitude` to Rows
4. Change mark type to **Circle**
5. Drag `state_abbr` to Detail
6. Drag `job_id` to Size → Change to **Count**
7. Drag `salary_mid` to Color → Change to **Average**

### Customize:
- **Color:** Edit colors → Use **Orange-Blue Diverging** or **Green-Gold**
- **Size:** Adjust range so differences are visible
- **Tooltip:** Edit to show:
  ```
  <state>
  Jobs: <CNT(job_id)>
  Avg Salary: <AVG(salary_mid)>
  ```

### Expected Result:
- Larger circles in DC/Virginia/Maryland (federal hub)
- Darker colors indicate higher salaries

---

## Sheet 2: Top Skills Bar Chart

### Build Steps:
1. Create new worksheet, name it **"Top Skills"**
2. First, we need to split skills. Since skills are comma-separated, we'll use the `skills_summary.csv` instead.

### Alternative: Use Pre-Aggregated Data
1. Go to **Data > New Data Source**
2. Connect to `data/demo_dashboard/skills_summary.csv`
3. Create new worksheet
4. Drag `skill` to Rows
5. Drag `job_count` to Columns
6. Sort descending by `job_count`
7. Filter to Top 20 skills
8. Drag `salary_premium` to Color

### Customize:
- **Color:** Edit colors → Red-Blue Diverging (negative = blue, positive = red)
- **Sort:** Largest bars at top
- **Tooltip:**
  ```
  <skill>
  Jobs: <job_count>
  Salary Premium: <salary_premium>%
  ```

### Expected Result:
- Communication, Organization, Report Writing at top (most common overall)
- For Data & Analytics roles: SQL (86%), Python (62%) dominate
- Color shows which skills pay more (SQL has $25K premium)

---

## Sheet 3: Job Posting Trends

### Build Steps:
1. Create new worksheet, name it **"Posting Trends"**
2. Drag `posted_date` to Columns → Change to **Month** (continuous)
3. Drag `job_id` to Rows → Change to **Count**
4. Drag `category` to Color

### Customize:
- **Format:** Line chart (already default)
- **Color:** Use distinct colors for each category
- **Title:** "Job Postings Over Time"
- **Axis:** Label Y as "Number of Postings"

### Expected Result:
- Upward trend over time (more recent = more jobs)
- Security & Law Enforcement and Administrative most common overall

---

## Sheet 4: Salary by Category & Remote Type

### Build Steps:
1. Create new worksheet, name it **"Salary Distribution"**
2. Drag `remote_type` to Columns
3. Drag `salary_mid` to Rows
4. Drag `category` to Color
5. Change Mark Type to **Box Plot** (or use Bar chart with AVG)

### Alternative: Simple Bar Chart
1. Drag `category` to Rows
2. Drag `remote_type` to Columns
3. Drag `salary_mid` to Size and Color → Change both to **Average**
4. Add labels showing the average salary

### Customize:
- **Title:** "Average Salary by Category & Work Type"
- **Labels:** Show salary values

### Expected Result:
- Data & Analytics ($139K) and Legal ($135K) = highest salaries
- Security & Law Enforcement = lowest ($94K)

---

## Step 3: Build the Dashboard

1. Click **Dashboard > New Dashboard**
2. Set size to **Automatic** or **1200 x 800**

### Layout:
```
+----------------------------------------+
|           JOB MARKET EXPLORER          |
|              2023 - 2026               |
+-------------------+--------------------+
|                   |                    |
|    Job Locations  |    Top Skills      |
|       (Map)       |    (Bar Chart)     |
|                   |                    |
+-------------------+--------------------+
|                   |                    |
|  Posting Trends   | Salary by Category |
|   (Line Chart)    |    (Bar/Box)       |
|                   |                    |
+-------------------+--------------------+
|  [Filters: Remote Type] [Category]     |
+----------------------------------------+
```

### Add Sheets:
1. Drag **Job Locations** to top-left
2. Drag **Top Skills** to top-right
3. Drag **Posting Trends** to bottom-left
4. Drag **Salary Distribution** to bottom-right

### Add Filters:
1. Click on Job Locations sheet in dashboard
2. Click dropdown arrow → **Filters > Remote Type**
3. Show filter as **Single Value (dropdown)** or **Multiple Values (list)**
4. Right-click filter → **Apply to Worksheets > All Using This Data Source**

5. Repeat for `category` filter

### Add Title:
1. Drag **Text** object to top
2. Enter: **Job Market Explorer 2023-2026**
3. Format: Large, bold, centered

### Add Interactivity:
1. Select the Map sheet
2. Click **Dashboard > Actions > Add Action > Filter**
3. Name: "Filter by State"
4. Source: Job Locations
5. Target: All other sheets
6. Run on: Select

---

## Step 4: Final Touches

### Color Theme:
- Use consistent colors across all sheets
- Suggestion: Blues for general, Orange for highlights

### Fonts:
- Title: Tableau Bold, 18pt
- Sheet titles: Tableau Semibold, 12pt
- Labels: Tableau Regular, 10pt

### Tooltips:
- Keep consistent format across all sheets
- Include relevant context

### Save:
1. **File > Save As**
2. Name: `Job_Market_Explorer.twbx`
3. Save to `dashboards/` folder

---

## Quick Demo Script

When presenting to Class 01:

1. **Start with the big picture:**
   > "This dashboard shows 1,276 REAL federal job postings from USAJobs.gov. These are actual positions you could apply for today."

2. **Show the map:**
   > "Where are the federal jobs? Notice DC, Virginia, and Maryland dominate - that's the federal government hub. Click on a state to filter."

3. **Discuss skills:**
   > "Overall, communication and organizational skills dominate. But filter to Data & Analytics, and you'll see SQL appears in 86% of those roles, with Python at 62%."

4. **Show salaries:**
   > "Federal jobs range from $44K to $388K. The median is $105K. Data & Analytics roles average $139K - the highest paying category!"

5. **Highlight the D&A premium:**
   > "Data & Analytics roles pay $33K more than the overall median - $139K vs $105K. And within D&A, SQL appears in 86% of roles, making it essentially required."

6. **Ask students:**
   > "What questions does this answer? What questions does it NOT answer? How would private sector data differ?"

---

## Key Statistics (Verified)

### Jobs by Category
| Category | Count | Avg Salary |
|:---|---:|---:|
| Security & Law Enforcement | 273 | $93,979 |
| Administrative | 239 | $107,569 |
| Medical & Healthcare | 223 | $119,639 |
| Other | 172 | $113,927 |
| IT & Systems | 128 | $114,525 |
| Engineering | 83 | $129,090 |
| Legal | 82 | $135,161 |
| Cybersecurity | 55 | $128,602 |
| Data & Analytics | 21 | $139,342 |

### Top Skills in Data & Analytics Roles
| Skill | % of D&A Jobs |
|:---|---:|
| SQL | 85.7% |
| Project Management | 71.4% |
| Statistics | 71.4% |
| Python | 61.9% |
| Quality Assurance | 61.9% |
| Data Modeling | 57.1% |

### Salary Premium Calculation Method
The category salary premium is calculated using **medians** (consistent with the dashboard):

```
Premium = Median(salary_mid for category) - Median(salary_mid for all jobs)
```

Example for Data & Analytics:
- D&A jobs: n=21, median salary = $138,667
- All jobs: n=1,276, median salary = $105,469
- **D&A Premium = $138,667 - $105,469 = $33,198**

**Why median?** Median is less affected by outliers (very high or low salaries), making it a more representative measure of typical salary.

**Note on skill-based premiums:** Within D&A roles, SQL appears in 86% of jobs (18/21), leaving only 3 jobs without SQL—too small a sample for meaningful skill-premium comparisons. The appropriate insight is that SQL is *essential* for D&A roles, not that it commands a premium within D&A.

---

## Troubleshooting

**Map not showing?**
- Ensure `latitude` and `longitude` have Geographic Role assigned
- Check that coordinates are valid (US locations)

**Skills not splitting?**
- Use the pre-aggregated `skills_summary.csv` instead
- Or use Tableau Prep to split the comma-separated field

**Dates not parsing?**
- Ensure `posted_date` is recognized as Date type
- Format should be YYYY-MM-DD

---

*Dashboard designed for ISA 401 Class 01 Demo - Spring 2026*
*Data last verified: January 2026*
