pacman::p_load(tidyverse, readxl, GGally, magrittr, calendR)



# * calendar plot ---------------------------------------------------------

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


unique_crashes_2022 = 
  crashes %>%
  filter(date >= "2023-01-01" & date <= "2023-12-31") %>% 
  group_by(instanceid) %>% 
  select(-datecrashreported) %>% 
  filter(typeofperson == 'D - DRIVER') %>% 
  select(instanceid, date, dayofweek, hour, weather, 
         address_x, latitude_x, longitude_x) %>%
  unique() %>% 
  mutate(dayofweek = as_factor(dayofweek),
         hour = as_factor(hour),
         weather = as_factor(weather)
  ) %>% 
  ungroup()

weather_levels = levels(unique_crashes_2022$weather)

daily_crashes_2022 = unique_crashes_2022 %>% 
  mutate(weather = factor(weather, levels = sort(weather_levels))) %>% 
  select(instanceid, date, weather) %>% 
  group_by(date) %>% 
  count()

write_csv(x = daily_crashes_2022, file = 'data/cincy_daily_crashes_2023.csv')

miamired = '#C3142D'

cal = calendR(title = NULL,
              year = 2022,
              special.days = daily_crashes_2022$n,
              orientation = "landscape",
              day.size = 2,
              months.size = 8,
              weeknames.size = 3,
              margin = 0,
              text.size = 8,
              title.size = 14,
              gradient = TRUE,
              low.col = "#FFFFED",
              special.col = miamired,
              legend.pos = 'right',
              legend.title = '# Crashes') + 
  theme(plot.title = element_text(face = 'bold', color =  miamired),
        legend.title = element_text(face = 'bold', size = 9), 
        legend.text = element_text(size = 7),
        plot.caption = element_text(size = 7)) +
  labs(caption = 'Created by: Fadel Megahed | Data source: City of Cincy Open Data Portal (rvmt-pkmq)')

cal


# * ggparcoord ------------------------------------------------------------

download.file('https://www.fueleconomy.gov/feg/EPAGreenGuide/xls/all_alpha_23.xlsx',
              destfile = 'data/mpg_2023.xlsx', mode = 'wb')
mpg_2023 = read_excel('data/mpg_2023.xlsx')

model_make = mpg_2023$Model %>% str_split_fixed(" ", 2) %>% as.data.frame() %>% tibble()
colnames(model_make) <- c("Manufacturer", "Make")

mpg_2023 = bind_cols(mpg_2023, model_make) %>% relocate(Manufacturer, Make)

mpg_2023 %<>% 
  mutate_at( vars('Displ', 'Cyl', 'City MPG', 'Hwy MPG', 'Cmb MPG', 'Comb CO2'), 
                         as.numeric ) %<>%
  mutate_if(is.character, as.factor)

set.seed(2023)
mpg_2023 %>%
  na.omit() %>% 
  group_by(`Veh Class`) %>% 
  sample_n(1, replace = T) %>% 
  ungroup() %>% 
  mutate(Model = as.character(Model) ) %>% 
  select(Model,`Cmb MPG`, Displ, Cyl, `Air Pollution Score`, `Comb CO2`) -> mpg_2023_sample 

write_csv(x = mpg_2023_sample, file = 'data/mpg_2023_sample.csv')

manufacturers = sample(mpg_2023_large$Manufacturer, size = 6)

mpg_2023_large = mpg_2023[sample.int(nrow(mpg_2023), size = 50),] |> 
  select(Manufacturer, Model,`Cmb MPG`, Displ, Cyl, `Air Pollution Score`, `Comb CO2`) |> 
  arrange(Manufacturer) |> 
  na.omit() |> 
  dplyr::filter(Manufacturer %in% manufacturers)


write_csv(x = mpg_2023_large, file = 'data/mpg_2023_large.csv')

ggparcoord(data = mpg_2023_sample, columns = 2:ncol(mpg_2023_sample),
           showPoints = T, groupColumn = 1) + 
  scale_color_brewer(palette = 'Paired') +
  geom_line(size = 1.5) +
  geom_point(size = 4) +
  theme_bw() +
  theme(legend.position = 'top') +
  labs(x = 'Factor', y = 'Scaled Value', 
       title = 'Some Factors Impacting the Combined MPG for 2023 Vehicles',
       caption = 'Data source: https://www.fueleconomy.gov/feg/download.shtml')
