

# * Whitehouse Example ----------------------------------------------------

if(require(robotstxt)==F) install.packages('robotstxt')

robotstxt::paths_allowed(paths = '/administration/cabinet/',
                         domain = 'https://www.whitehouse.gov/')


# * * SelectorGadget ------------------------------------------------------

# The selector here was based on what we saw at the bottom of the screen 
# when using the selector gadge
"https://www.whitehouse.gov/administration/cabinet/" |> 
  rvest::read_html() |> 
  rvest::html_elements(".acctext--con") |> 
  rvest::html_text2() -> whitehouse_df

cab_name = whitehouse_df[seq(1, 52, 2)]
cab_title = whitehouse_df[seq(2, 52, 2)]


# alternatively
# this uses the text displayed when you move your cursor using the selector gadget
"https://www.whitehouse.gov/administration/cabinet/" |> 
  rvest::read_html() |> 
  rvest::html_elements("div h3") |> 
  rvest::html_text2() -> cab_name_b

"https://www.whitehouse.gov/administration/cabinet/" |> 
  rvest::read_html() |> 
  rvest::html_elements("div h4") |> 
  rvest::html_text2() -> cab_title_b



# * * Inspect -------------------------------------------------------------

"https://www.whitehouse.gov/administration/cabinet/" |> 
  rvest::read_html() |> 
  rvest::html_elements("div > div.persongrid__item__inner__content > h3") |> 
  rvest::html_text2() -> cab_name_c


"https://www.whitehouse.gov/administration/cabinet/" |> 
  rvest::read_html() |> 
  rvest::html_elements("#content > article > section > div > div > div > div > div > div > div.persongrid__item__inner__content > h4") |> 
  rvest::html_text2() -> cab_title_c

df = data.frame(name = cab_name, title = cab_title)




# * Scraping Multiple Pages -----------------------------------------------

# Approach: Scrape the wanted data from one webpage and then, we will generalize
# this via: (a) function, or (b) a for loop
# As part of that plan, figure out how the URL would change

# Let us start with 2015

"https://www.planecrashinfo.com/2015/2015.htm" |> 
  rvest::read_html("") |> 
  rvest::html_element("body > div:nth-child(2) > center > table") |> 
  rvest::html_table(header = 1) -> crashes_df


# The logic for the "for" loop will be we need to:
# [a] figure out how to change the URL
# [b] not overwrite my data

other_way_for_years = seq(2015, 2020, 1)
years = 2015:2020
years # we will use this for the purpose of changing the URL
# obviously capitalizing on how the URL is changing (this is only valid for this site)


# Let us construct the URL programmaticly
urls = c("https://www.planecrashinfo.com/2015/2015.htm", 
         "https://www.planecrashinfo.com/2020/2020.htm")

base_url = 'https://www.planecrashinfo.com/'
all_crashes = data.frame() # initialize it so I can add data to it

for (i in years) {
  
   # Step 0: Figuring out how the URL will change
   my_url = paste0(base_url, i, '/', i, '.htm')
   print(my_url) # to ensure that it is correct
   
   my_url |> 
     rvest::read_html("") |> 
     rvest::html_element("body > div:nth-child(2) > center > table") |> 
     rvest::html_table(header = 1) -> crashes_df
   
   # the issue is every time I go through the loop I will overwrite crashes_df
   # rbind allows you to row bind (i.e., stack data frames on top of each other)
   all_crashes = rbind(all_crashes, crashes_df)
}


for (counter in 1:length(years)) {
  print(years[counter])
}



# * Scraping multiple pages with purrr and your own function --------------

# this our code for a single URL unchanged
# (only changed the URL in quotes to a parameter named url)
scrape_crashes = function(url){
  url |> 
    rvest::read_html("") |> 
    rvest::html_element("body > div:nth-child(2) > center > table") |> 
    rvest::html_table(header = 1) -> crashes_df
  
  return(crashes_df)
} 

# testing it out for 2024
crashes_2024 = scrape_crashes(url = "https://www.planecrashinfo.com/2024/2024.htm")

# we will create a vector of URLs that we will iteratively apply our function to
urls = paste0(base_url, 2015:2020, '/', 2015:2020, '.htm')
urls

all_crashes_fn = purrr::map_df(.x = urls, .f = scrape_crashes)




