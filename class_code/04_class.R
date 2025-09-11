
# * Process to Scrape Data From a Webpage ---------------------------------

# Step 0: You need to know the URL

# Step 1: Go to the webpage in your browser, open it, 
# In R, we will read the "RAW HTML" [the view page source idea] into our R environment
# rvest::read_html() # reads the raw HTML into R

# Step 2: Identify the commonality
# in the "things" you want scrape
### In plain English, if you were interested in scraping the course title and desc
### Course Titles: Are always bolded and looked the same
### Course Descs: Were not bolded

# In HTML speak, you will have to identify the HTML elements that lead to this behavior
## Course Title: p class of courseblocktitle > strong 

# "#sc_sccoursedescs > div:nth-child(19) > p.courseblocktitle > strong"
# The "#" is the name of an id
# We have a div --> ISA 377 is the 19th course in the list
# The title is in a paragraph of class course block title and it is also bolded <strong>

# rvest::html_elements() or rvest::html_element()
# plural returns everything that matches our selected CSS Selector
# singular returns the first thing that matches our CSS selector


# Step 3: Clean it to Make it Human Readable
# rvest::html_table() -> if we are reading a FULL table
# rvest::html_text2() --> if we are pulling text




# * Scraping your first webpage -------------------------------------------

"https://bulletin.miamioh.edu/courses-instruction/isa/" |> 
  rvest::read_html() |> 
  rvest::html_elements("div > p.courseblocktitle > strong") |> # from Inspect in Chrome
  rvest::html_text2() -> # not a pipe but an arrow to save what is on the left to the next line
  course_titles_approach1


"https://bulletin.miamioh.edu/courses-instruction/isa/" |> 
  rvest::read_html() |> 
  rvest::html_elements("p strong") |> 
  rvest::html_text2() -> # not a pipe but an arrow to save what is on the left to the next line
  course_titles_approach2

"https://bulletin.miamioh.edu/courses-instruction/isa/" |> 
  rvest::read_html() |> 
  rvest::html_elements("#sc_sccoursedescs > div:nth-child(10) > p.courseblocktitle > strong") |> 
  rvest::html_text2() -> # not a pipe but an arrow to save what is on the left to the next line
  course_titles_approach3









# * Going over the first webpage again ------------------------------------

"https://bulletin.miamioh.edu/courses-instruction/isa/" |> 
  rvest::read_html() -> webpage

webpage |> 
  rvest::html_elements("strong") |> 
  rvest::html_text2() ->
  course_titles


# starting with a bad selector (div p) which you get when you move cursor 
# in the selector gadget without clicking

webpage |> 
  rvest::html_elements("div p") |> 
  rvest::html_text2() ->
  course_desc

head(course_desc, 20)

# with this "bad" selector, by inspecting the first 1-20 and the last 6, we 
# learned: (a) the first 100 contain the course titles and their associated descriptions
# (b) course title is odd and course description is even

course_desc = course_desc[ seq(from = 2, to = 100, by = 2) ]


webpage |> 
  rvest::html_elements(".courseblockdesc") |> # by clicking on the selector gadget and selecting the paragraph
  rvest::html_text2() ->
  course_desc_better_selector

df = data.frame(
  title = course_titles, # left is col name, and after the equal the values are coming from that vec
  course_desc # given that this has no equal this will be the col name and the values are going to come from that vec as well
)

readr::write_csv(df, file = 'data/isa_courses.csv' )




# * Plane Crash Table -----------------------------------------------------

"https://www.planecrashinfo.com/2025/2025.htm" |> 
  rvest::read_html() |> 
  rvest::html_elements("center > table") |> 
  rvest::html_table() -> crashes_2025

crashes_df = crashes_2025[[1]]
colnames(crashes_df) = crashes_df[1, ]

crashes_df = crashes_df[-1, ]

dplyr::glimpse(crashes_df)

write.csv(crashes_df, "data/plane_crashes.csv", row.names = F)


# * Robots ----------------------------------------------------------------

robotstxt::paths_allowed(
  paths = "https://bulletin.miamioh.edu/courses-instruction/isa/"
)

