


# * Business Formation Statistics (Census) --------------------------------

# https://www.census.gov/econ/bfs/index.html

rename_series = function(x){
  if( x %in% c("BA_BA", "BA_CBA" , "BA_WBA" , "BA_HBA")){
    return('application')
  }
  else if(x %in% c('BF_DUR4Q' ,'BF_DUR8Q')){
    return('avg_duration')
  }
  else return('formation')
}


bfs = read_csv("https://www.census.gov/econ/bfs/csv/bfs_monthly.csv")
  
bfs$series_cat = map_chr(bfs$series, rename_series)


bfs_longer = bfs %>% 
  pivot_longer(cols = jan:dec, names_to = 'month', values_to = 'value')



# * Unemployment Rate -----------------------------------------------------
states = unique(bfs$geo)
id_remove = which(states %in% c("US", "NO", "MW", "SO", "WE", "HI", "AK") )
states = states[-id_remove]

fred_start = 'https://fred.stlouisfed.org/graph/fredgraph.csv?bgcolor=%23e1e9f0&chart_type=line&drp=0&fo=open%20sans&graph_bgcolor=%23ffffff&height=450&mode=fred&recession_bars=on&txtcolor=%23444444&ts=12&tts=12&width=1168&nt=0&thu=0&trc=0&show_legend=yes&show_axis_titles=yes&show_tooltip=yes&id='
fred_end = 'UR&scale=left&cosd=1976-01-01&coed=2022-07-01&line_color=%234572a7&link_values=false&line_style=solid&mark_type=none&mw=3&lw=2&ost=-99999&oet=99999&mma=0&fml=a&fq=Monthly&fam=avg&fgst=lin&fgsnd=2020-02-01&line_index=1&transformation=lin&vintage_date=2022-09-13&revision_date=2022-09-13&nd=1976-01-01'

unemployment = map_df(.x = states,
                      .f = function(x){
                        complete_url = paste0(fred_start,x,fred_end)
                        read_csv(complete_url)
                      })
unemployment_long = pivot_longer(unemployment, cols = 2:50, names_to = 'state', values_to = 'unemployment') %>% 
  mutate(state = str_remove(state, 'UR')) %>% 
  drop_na()
