pacman::p_load(tidyverse, jsonlite, tidycensus)


# * Through the API -------------------------------------------------------

county_populations = fromJSON("https://api.census.gov/data/2020/dec/pl?get=P1_001N&for=county:017,165&in=state:39")
str(county_populations)

county_tibble = tibble(population = county_populations[2:3, 1],
                       state = 'Ohio',
                       county_number = as.numeric(county_populations[2:3, 3]) )


# * Through tidycensus ----------------------------------------------------

census_api_key("befa92e72cdca31bac55b43f87e207201c10f0ef")

county_tibble2 <- get_decennial(geography = "county",
                                state = 'OH',
                                county = c('Butler County', 'Warren County'),
                                variables = "P1_001N", 
                                year = 2020)

county_tibble3 <- get_decennial(geography = "county",
                                state = 'OH',
                                variables = "P1_001N", 
                                year = 2020)

county_tibble3 = filter(county_tibble3,
                        NAME %in% c('Butler County, Ohio', "Warren County, Ohio"))
