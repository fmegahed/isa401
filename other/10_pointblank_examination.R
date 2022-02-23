pacman::p_load(tidyverse, magrittr, lubridate, pointblank, hms)

bike_tbl = read_csv('Data/bike_sharing_data.csv') %>% 
  mutate(
    datetime = mdy_hm(datetime, tz = 'America/New_York'),
    date =  datetime %>% as_date(),
    hour = datetime %>% as_hms() %>% hour() 
    ) %>% 
  relocate(datetime, date, hour)

bike_tbl %<>% mutate_at(.vars = c('season', 'holiday', 'workingday', 'weather'),
                        as_factor) 

bike_tbl$casual[1:5] = 0

act <- action_levels(warn_at = 0.01, notify_at = 0.01, stop_at = NULL)

agent <-
  create_agent(bike_tbl, actions = act) %>%
  col_vals_between(columns = vars(temp, atemp, humidity, windspeed), 0, 100) %>% 
  col_vals_gte(columns = vars(casual, registered), 0) %>% 
  col_vals_gt(columns = vars(count), 0) %>% 
  col_is_factor(columns = vars(season, holiday, workingday, weather)) %>% 
  col_vals_in_set(columns = vars(hour), set = seq(0, 23, by = 1)) %>% 
  col_vals_not_null(columns = names(bike_tbl)) %>% 
  col_vals_expr(expr(count == casual + registered) ) %>% 
  col_vals_expr(expr = expr(sources %in% c('AD campaign', 'ad campaign'))) %>% 
  col_vals_expr(expr = ~ str_detect(sources, pattern = 'google'),
                label = 'non google sources')

res <- interrogate(agent, sample_limit = nrow(bike_tbl))
res %>% export_report(filename = 'report.html')
