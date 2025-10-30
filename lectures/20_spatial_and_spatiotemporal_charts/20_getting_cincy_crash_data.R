pacman::p_load(tidyverse, magrittr, janitor, lubridate)

crashes = readr::read_csv("https://data.cincinnati-oh.gov/api/views/rvmt-pkmq/rows.csv?accessType=DOWNLOAD") %>% 
  janitor::clean_names() %>% 
  select(address_x, latitude_x, longitude_x, age, 
         cpd_neighborhood, crashseverity, 
         datecrashreported, dayofweek, gender, injuries, 
         instanceid,
         typeofperson, weather)

crashes %<>% 
  mutate(datetime = parse_date_time(datecrashreported, 
                                    orders = "'%m/%d/%Y %I:%M:%S %p",
                                    tz = 'America/New_York',
                                    locale = "English"),
         hour = hour(datetime),
         date = as_date(datetime)
  )

unique_crashes_2024 = 
  crashes %>%
  dplyr::filter(date >= ymd("2024-01-01") & date <= ymd("2024-12-31")) %>% 
  group_by(instanceid) %>% 
  slice(1) %>% # keep only one of the data by instance id
  select(-datecrashreported) %>%  
  select(instanceid, date, dayofweek, hour, weather, 
         address_x, latitude_x, longitude_x) %>%
  unique() %>% 
  mutate(dayofweek = as_factor(dayofweek),
         hour = as_factor(hour),
         weather = as_factor(weather)
  ) %>% 
  ungroup()

write_csv(x = unique_crashes_2024, file = 'data/cincy_2024_crashes.csv')

unique_crashes_2024 %>% select(dayofweek, weather) %>% 
  map(.f = table) -> results

unique_crashes_2024 |> 
  dplyr::arrange(date) |> 
  dplyr::group_by(date) |> 
  dplyr::count() -> cincy_daily_crashes_2024

write_csv(x = cincy_daily_crashes_2024, file = 'data/cincy_daily_crashes_2024.csv')
  
  
