# Job Market Explorer Dashboard
## Tableau Build Instructions

This guide walks you through building the Class 01 demo dashboard step-by-step.

**Data Source:** Real federal job postings from USAJobs.gov (615 jobs)
**Data File:** `data/demo_dashboard/jobs_master.csv`

---

## Step 1: Connect to Data

1. Open Tableau Desktop
2. Click **Text file** under Connect
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
- Larger circles in tech hubs (SF, NYC, Seattle)
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
- SQL, Python at top (most common)
- Color shows which skills pay more (Machine Learning, Deep Learning = higher premium)

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
- Data & Analytics and Engineering should be most common

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
- Data & Analytics and Management = highest salaries
- Remote jobs may have slightly lower salaries (less location premium)

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
   > "This dashboard shows 615 REAL federal job postings from USAJobs.gov. These are actual positions you could apply for today."

2. **Show the map:**
   > "Where are the federal tech jobs? Notice DC, Virginia, and Maryland dominate - that's the federal government hub. Click on a state to filter."

3. **Discuss skills:**
   > "Python and SQL are most in-demand. Machine Learning jobs have a salary premium - see the color difference?"

4. **Show salaries:**
   > "Federal jobs range from $42K to $325K. The median is $111K - competitive with private sector!"

5. **Highlight telework:**
   > "Many federal positions now offer telework. Let's filter to see which categories offer more flexibility."

6. **Ask students:**
   > "What questions does this answer? What questions does it NOT answer? How would private sector data differ?"

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
