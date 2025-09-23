


# * Whitehouse (Person+Title and Bio) -------------------------------------

"https://www.whitehouse.gov/administration/the-cabinet/" |> 
  rvest::read_html() ->
  cabinet_page

cabinet_page |> 
  rvest::html_elements("div > h3 > strong") |> 
  rvest::html_text2() -> titles_and_names

cabinet_page |> 
  rvest::html_elements("h3 strong") |> 
  rvest::html_text2() -> titles_and_names1

cabinet_page |> 
  rvest::html_elements("strong") |> 
  rvest::html_text2() -> titles_and_names2


# Optional splitting

split_result <- stringr::str_split_fixed(titles_and_names, ",", 2)

# Create two separate vectors
titles <- stringr::str_trim(split_result[, 1])
names <- stringr::str_trim(split_result[, 2])

df = data.frame(title = titles, name = names)
df$name[3] = "Pam Bondi"

# Get their bios
#wp--skip-link--target > div > p:nth-child(4)
cabinet_page |> rvest::html_elements("div > p") |> rvest::html_text2() -> all_paragraphs

all_paragraphs |> stringr::str_detect("Zeldin") -> zeldin_index

all_paragraphs[3:7]




# * Plane Crash Example (2024, 2025) --------------------------------------

# * * One page example ----------------------------------------------------

"https://www.planecrashinfo.com/2025/2025.htm" |> rvest::read_html() |> 
  rvest::html_elements("table") |> rvest::html_table() -> c25

df = c25[[1]]
colnames(df) = df[1, ]
df = df[-1, ] # - drop first row and keep all columns


# * * For Loop Basics -----------------------------------------------------

example_vector = 1:3

for (counter in example_vector) {
  print( example_vector[counter]  )
}

# the reason I mentioned this, is we can use that to generate different URLS
# for the sake of being lazy, assuming that you wanted to go over 50 years worth of crashes
# you are not going to construct that URL by hand

crash_urls_by_hand = c(
  "https://www.planecrashinfo.com/2024/2024.htm",
  "https://www.planecrashinfo.com/2025/2025.htm"
)

years = 2004:2005 # recommended for multiple years in a row seq(2024, 2025)

# handy if you want to generate 50 URLs following some pattern
# you can leverage how the sequence in that changes
crash_urls_lazy = paste0(
  "https://www.planecrashinfo.com/", years, "/", years, ".htm"
)

all_crash_data = data.frame() # initialization (0 obs of 0 variables)

for (i in crash_urls_lazy) {
  Sys.sleep(15)
  paste("URL being read:", i) # note that my vector contains strings, which I cannot use for indexing but I can use 
  # the entire string to be the URL that I will read
  
  i |> rvest::read_html_live() |>
    rvest::html_elements("table") |> rvest::html_table() -> c25
  
  # extracting the first sublist (sublist of one)
  df = c25[[1]]
  colnames(df) = df[1, ] # setting the colnames to first row
  df = df[-1, ] # - drop first row and keep all columns
  
  # we will store df at the bottom of my all_crash_data
  all_crash_data = rbind(all_crash_data, df)
  print(all_crash_data)
  print("---------------------------------------")
  
}



# * Write your Own Function -----------------------------------------------


scrape_crash_db = function(url = "https://www.planecrashinfo.com/2017/2017.htm"){
  url |> 
    rvest::read_html_live() |> 
    rvest::html_elements("table") |> 
    rvest::html_table() -> c25
  
  # extracting the first sublist (sublist of one)
  df = c25[[1]]
  colnames(df) = df[1, ] # setting the colnames to first row
  df = df[-1, ] # - drop first row and keep all columns
  
  Sys.sleep(20) # pause for 20 seconds
  return(df)
  
}

all_data = purrr::map_df(.x = crash_urls_lazy, .f = scrape_crash_db)


rvest::html_attr()
