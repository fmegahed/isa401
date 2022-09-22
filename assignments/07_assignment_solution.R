# The solution for assignment 07, which is our second API assignment


# * Question 1 (CIN BP 2021) ----------------------------------------------

pacman::p_load(tidyverse, nflfastR)

pbp <- nflfastR::load_pbp(2021)

cin_2021 = filter(.data = pbp,
                  home_team == 'CIN' | away_team == 'CIN')
table(cin_2021$away_team)




# * Question 2 (Weather.gov API) ------------------------------------------

pacman::p_load(jsonlite)

# https://api.weather.gov/points/39.5070,-84.7452
weather_data = fromJSON('https://api.weather.gov/gridpoints/LWX/25,55/forecast')

oxford_forecast = weather_data$properties$periods



# * Question 3 (FRED Data) ------------------------------------------------

state_vec = state.abb

start_link = 'https://fred.stlouisfed.org/graph/fredgraph.csv?bgcolor=%23e1e9f0&chart_type=line&drp=0&fo=open%20sans&graph_bgcolor=%23ffffff&height=450&mode=fred&recession_bars=on&txtcolor=%23444444&ts=12&tts=12&width=1168&nt=0&thu=0&trc=0&show_legend=yes&show_axis_titles=yes&show_tooltip=yes&id='

end_link = 'UR&scale=left&cosd=1976-01-01&coed=2022-08-01&line_color=%234572a7&link_values=false&line_style=solid&mark_type=none&mw=3&lw=2&ost=-99999&oet=99999&mma=0&fml=a&fq=Monthly&fam=avg&fgst=lin&fgsnd=2020-02-01&line_index=1&transformation=lin&vintage_date=2022-09-20&revision_date=2022-09-20&nd=1976-01-01'

unemployment = tibble()
for (counter in 1:length(state_vec)) {
  fred_link = paste0(start_link, state_vec[counter], end_link)
  
  temp_df = read_csv(fred_link)
  temp_df$symbol = paste0(state_vec[counter], 'UR')
  colnames(temp_df)[2] = 'unemployment'
  
  unemployment = rbind(unemployment, temp_df)
}

