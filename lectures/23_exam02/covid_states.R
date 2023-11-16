states = COVID19::covid19(
  country = 'US', level = 2, start = '2020-03-01', end = '2022-12-31'
)

colnames(states)

states = states |> dplyr::select(
  administrative_area_level_1, administrative_area_level_2, date, confirmed, deaths, population
) |> 
  dplyr::rename(
    country = administrative_area_level_1,
    state = administrative_area_level_2,
    confirmed_cases = confirmed,
    confirmed_deaths = deaths
  )

states = states |> dplyr::arrange(state, date)

states = states |> dplyr::filter(
  !state %in% c('Virgin Islands', 'Puerto Rico', 'Northern Mariana Islands', 'Alaska', 'American Samoa', 'Guam', 'Hawaii', 'District of Columbia')
)

most_recent_na_date <- states %>%
  dplyr::filter(apply(., 1, function(x) any(is.na(x)))) |> 
  dplyr::arrange(dplyr::desc(date)) |>
  dplyr::slice(1) |>
  dplyr::pull(date)

states = states |> dplyr::filter(date > most_recent_na_date)

readr::write_csv(states, 'data/exam02_covid19_states_f23.csv')
