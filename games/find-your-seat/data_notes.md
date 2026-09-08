# Find Your Seat: data notes

All facts below were checked on 2026-09-02 on the page cited next to them. Miami University pages were preferred; Wikipedia is used only as a labelled fallback. Anything that could not be verified on an opened page is listed under "Dropped" rather than approximated.

Companion file: `campus_facts.json` (same folder) holds the same facts in machine-readable form.

## Part 1: five campus places

### Farmer School of Business (code FSB)

| Fact | Value | Source (accessed 2026-09-02) |
|---|---|---|
| Official name | Farmer School of Business (the venues page uses the long form "Richard T. Farmer School of Business") | https://miamioh.edu/fsb/about/index.html and https://miamioh.edu/visit-miami/events-and-conferences/events-services/venues.html |
| Street address | 800 East High Street, Oxford, OH 45056 (the school's mailing address adds "Suite 3075") | https://events.miamioh.edu/farmer_school_of_business_946_620_769_765 and https://miamioh.edu/fsb/about/index.html |
| Year the current building opened | 2009. Miami News: "the first since the Farmer School of Business was built in 2009." Wikipedia (fallback) adds "opened in the fall of 2009." | https://miamioh.edu/news/2021/07/building-connections-learn-about-new-building-and-renovation-projects.html ; https://en.wikipedia.org/wiki/Farmer_School_of_Business |
| Extra | "The Farmer School of Business building is the first facility on Miami's campus to earn a Leadership in Energy and Environmental Design (LEED) certification." | https://miamioh.edu/fsb/about/facilities.html |

Note: the FSB "Meet the Farmers" page and the 2016 gift story only mention the 2005 gift that funded construction; they do not give the opening year, so the 2021 Miami News page is the Miami source for 2009.

### Yager Stadium

| Fact | Value | Source (accessed 2026-09-02) |
|---|---|---|
| Sport | Football ("the home of Miami University football") | https://miamiredhawks.com/facilities/yager-stadium/20 |
| Seating capacity | 24,286 ("With the recent renovations and removal of all stands from the South endzone, Miami's capacity has been reduced to 24,286.") | same page |
| Opened | 1983 ("Fred C. Yager Stadium, which opened in 1983") | same page |

Caveat: the same official page also has a facility-details bullet reading "Stadium has seating for 24,000". Both figures are on the page; 24,286 is the one stated as the current capacity. If the game needs one number, use 24,286 and cite the page; if a round number is preferred, "about 24,000" is also defensible from the same page.

### Millett Hall

| Fact | Value | Source (accessed 2026-09-02) |
|---|---|---|
| Sports | Men's basketball, women's basketball, volleyball ("serves as the home of RedHawk men's and women's basketball and volleyball") | https://miamiredhawks.com/facilities/millett-hall/15 |
| Seating capacity | 9,200; downsized to 6,400 for basketball ("The 9,200-seat arena, which has been downsized for basketball in recent years to 6,400") | same page |
| Opened | December 2, 1968 ("John D. Millett Hall, named in honor of Miami University's 16th president, opened its doors on Dec. 2, 1968") | same page |

### Upham Hall

- What it is: an academic building at the center of campus that houses the College of Arts and Science. Miami source: the College of Arts and Science lists its address as "100 Bishop Circle, 143 Upham Hall, Miami University, Oxford, Ohio 45056" (https://miamioh.edu/cas/index.html). Wikipedia fallback for the phrase "academic building": "Upham Hall is an academic building on the campus of Miami University in Oxford, Ohio, United States." (https://en.wikipedia.org/wiki/Upham_Hall_(Miami_University)).
- Upham Arch tradition, one sentence: Miami legend holds that if you kiss your true love under the Upham Hall Arch, you will marry and the bond will never be broken. Exact quote from Miami's traditions page: "If you kiss your true love under the Upham Hall Arch, you will marry and the bond will never be broken." (https://miamioh.edu/about-miami/history-traditions/traditions/). The same page adds: "On June 20, 2009, Miami broke the Guinness World Record for the most people renewing their wedding vows at once under the Upham Arch."

### King Library

- One sentence: King Library is the flagship of the Miami University Libraries and the scholarly hub of Oxford campus life. Exact quote: "King Library, the flagship of the Miami University Libraries and scholarly hub of Oxford campus life for more than 40 years." Address on the same page: "151 S. Campus Ave, Oxford, OH 45056". Named spaces mentioned: the Makerspace, the Sidley Lounge and The Howe Writing Center. Source: https://www.lib.miamioh.edu/about/locations/king-library/ (accessed 2026-09-02).

## Part 2: Fall 2026 sections in FSB rooms

### ISA counts (required; from the official export)

- Source: `Y:/My Drive/Miami/Teaching/ISA 401/data/CourseExport.csv`, an official course export supplied by Fadel. 78 rows, all Term 202710 (Fall Semester 2026-27), Subject ISA, Campus Oxford. File modified 2026-09-02 22:19 EDT.
- Counting rule: the "Meeting Locations" column is pipe-separated (for example "FSB 0031|WEB", "DSB 126|DSB 128"). A section counts for a room if that room appears anywhere in its locations; a section is counted at most once per room.
- Counts cover ISA sections only. In `campus_facts.json` the field is `isa_sections`, and `subjects` is 1 where any ISA section meets in the room (0 otherwise).

| FSB room | Floor | ISA sections |
|---|---|---|
| 0003 | 0 | 13 |
| 0005 | 0 | 1 |
| 0031 | 0 | 16 |
| 1014 | 1 | 2 |
| 1023 | 1 | 5 |
| 2037 | 2 | 10 |
| 2050 | 2 | 11 |

FSB 2050: 11 ISA sections (ISA 321 B; ISA 345 A, B; ISA 381 B, C; ISA 401 A, B; ISA 414 A, C; ISA 634 A, B). Both the export and the course-list scrape below give exactly 11.

### All-subject counts (course-list scrape, kept as a separate field)

The Miami Course List was readable, so the all-subject counts were completed and are stored as `all_sections` and `all_subjects` (with `all_subject_breakdown`) in `campus_facts.json`.

- Source: https://www.apps.miamioh.edu/courselist/
- Term: Fall Semester 2026-27 (term code 202710). Campus: Oxford (campusFilter value O).
- Filter settings: Subject = one subject per query, cycling through all 122 subjects in the site's Subject list (a single query with no subject returns "Your query returned too many results"). Course Number, Attribute, CRN, Part-Of-Term, Title, Instructor, Days and Credit Hours blank; Open/Waitlist = All Courses; Level = All Levels; Start Time 12:00 AM, End Time 11:59 PM; no Alternative Delivery Type boxes checked.
- Method: the site has no JSON endpoint; the Find button posts the form back to the same URL and returns HTML. The scrape replayed that POST once per subject (fields `_token`, `term`, `campusFilter[]`, `subject[]`, and the blanks above) and parsed the `tr.resultrow` rows and the meeting cell (day, time, room, dates; multiple meetings separated by `<hr>`). For every subject the parsed row count equalled the page's own "N results after filters" figure, and no subject query triggered the too-many-results alert.
- Date and time of scrape: 2026-09-02, 22:27:54 to 22:32:48 EDT.
- Totals: 3,261 Oxford sections across 122 subjects; 377 distinct sections meet in an FSB room; 29 FSB rooms host at least one section. Seven sections meet in more than one FSB room (3 in two rooms, 4 in three rooms) and are counted once in each room, so `all_sections` sums to 388.
- Cross-check: the scrape's ISA-only counts per room equal the export's counts for all seven ISA rooms (0003:13, 0005:1, 0031:16, 1014:2, 1023:5, 2037:10, 2050:11), and both sources have 78 ISA sections.
- Raw scrape (all 3,261 rows with meetings): `C:/Users/megahefm/AppData/Local/Temp/claude/Y--My-Drive-Miami-Teaching-ISA-401/2ecd5f80-1ceb-4f38-a94c-02414d88d988/scratchpad/courselist_all.json` (session scratch file, not part of the game folder).

| Floor | Room | All sections | Distinct subjects | Breakdown |
|---|---|---|---|---|
| 0 | 0003 | 13 | 1 | ISA 13 |
| 0 | 0005 | 12 | 3 | ECO 6, ISA 1, MGT 5 |
| 0 | 0012 | 12 | 2 | BLS 3, FIN 9 |
| 0 | 0013 | 13 | 2 | ACC 1, ECO 12 |
| 0 | 0014 | 12 | 2 | ACC 10, FIN 2 |
| 0 | 0019 | 18 | 3 | ACC 5, ECO 9, FIN 4 |
| 0 | 0021 | 12 | 1 | ACC 12 |
| 0 | 0024 | 14 | 1 | MGT 14 |
| 0 | 0025 | 20 | 4 | ACC 5, BLS 7, ECO 5, MGT 3 |
| 0 | 0026 | 11 | 3 | BLS 2, FIN 6, MGT 3 |
| 0 | 0027 | 12 | 2 | BLS 4, FIN 8 |
| 0 | 0028 | 16 | 2 | ACC 3, MGT 13 |
| 0 | 0031 | 16 | 1 | ISA 16 |
| 0 | 0032 | 21 | 3 | ACC 3, IMS 6, MKT 12 |
| 0 | 0033 | 14 | 1 | MKT 14 |
| 0 | 0038 | 14 | 2 | ACC 3, ECO 11 |
| 1 | 1000 | 12 | 5 | ACC 3, BIO 1, BLS 4, ECO 1, ESP 3 |
| 1 | 1006 | 12 | 1 | ESP 12 |
| 1 | 1013 | 13 | 1 | FIN 13 |
| 1 | 1014 | 2 | 1 | ISA 2 |
| 1 | 1023 | 15 | 4 | ACC 1, ISA 5, MKT 7, STA 2 |
| 1 | 1035 | 15 | 2 | ACC 3, MGT 12 |
| 2 | 2037 | 12 | 2 | ISA 10, MGT 2 |
| 2 | 2040 | 12 | 1 | MGT 12 |
| 2 | 2041 | 13 | 2 | ACC 12, BUS 1 |
| 2 | 2046 | 16 | 2 | ACC 3, ESP 13 |
| 2 | 2049 | 16 | 3 | ACC 3, ESP 4, MKT 9 |
| 2 | 2050 | 11 | 1 | ISA 11 |
| 3 | 3061 | 9 | 2 | BUS 1, MKT 8 |

Floor is the first digit of the room number (0xxx ground, 1xxx first, 2xxx second, 3xxx third), as specified for the game; no Miami page was found that states floor numbers explicitly.

### Four floors and one feature per floor

Levels 0, 1, 2 and 3 all host Fall 2026 sections (rooms 0003 to 0038, 1000 to 1035, 2037 to 2050, and 3061), so the game can use four floors.

| Level | Verified feature | Quote and source (accessed 2026-09-02) |
|---|---|---|
| 0 | FSB 0025, the largest reservable room on the ground level, capacity 153; it also hosts the most sections of any FSB room (20, four subjects) | "The room capacity for FSB 1000 and FSB 0025 is 493 and 153, respectively." https://www.miamioh.edu/fsb/facilities/facilities-usage/ |
| 1 | Taylor Auditorium, FSB 1000, the 500-seat auditorium | "Located in the Richard T. Farmer School of Business, the David R. Taylor Auditorium is a 500-seat space that can be configured to accommodate various sizes of groups in an optimal setting." https://miamioh.edu/visit-miami/events-and-conferences/events-services/venues.html ; room number "Taylor Auditorium (FSB 1000)" at https://events.miamioh.edu/farmer_school_of_business_946_620_769_765 . The facilities-usage page gives the room capacity of FSB 1000 as 493, so say "about 500 seats" if precision matters. |
| 2 | The two instructional computer labs, rooms 2037 and 2050 (the FSB IT office is in 2036) | "FSB has two computer labs for instructional use in rooms 2037 and 2050." https://www.miamioh.edu/fsb/facilities/office-of-technology/classrooms/index.html |
| 3 | The Dean's office, Suite 3075 | "800 East High Street, Suite 3075, Oxford, OH 45056" https://miamioh.edu/fsb/about/index.html . That 3075 is on level 3 follows from the room numbering only; no page states the floor. |

## Dropped or not verified

- Number of floors in FSB, and which named spaces (Forsythe Commons, Forsythe Atrium, the trading room, East and West Commons) sit on which floor: no opened Miami page states a floor, so no floor assignment is made for them. The events calendar lists "Forsythe Atrium" and "Forsythe Commons" as FSB locations, and the facilities-usage page mentions East and West Commons (capacity 100), but without floors.
- "ISA computer labs" as the level-0 feature: rooms 0003 and 0031 host only ISA sections in Fall 2026 (scrape), but no page found calls them labs, so the level-2 labs (2037 and 2050), which are documented, are used instead.
- FSB square footage and architect: only on Wikipedia and the architect's site, not on an opened Miami page; not included.
- Upham Hall's construction years and named departments beyond the College of Arts and Science office: Wikipedia only; not included in the game facts.
- The Miami Course List (WebFetch) could not be read without a browser session; all scrape figures come from replaying the site's own form POST as described above.
