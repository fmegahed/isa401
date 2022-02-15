

# * NFL Data --------------------------------------------------------------


install.packages("ggrepel", type = "binary")
install.packages("ggimage", type = "binary")
install.packages("nflfastR", type = "binary")

library(tidyverse)
library(ggrepel)
library(ggimage)
library(nflfastR)

options(scipen = 9999)

data <- load_pbp(2021)
glimpse(data)

# Q1: what is the total number of plays/observations involving CIN in the 2021 season
cincy_data = data %>% filter(home_team == 'CIN' | away_team == 'CIN')


# Q2: Pick a variable of interest and aggregate it by game for the entire season
cincy_data %>% 
  group_by(game_id) %>% 
  summarise(number_over = if_else(total - total_line > 0, 1, 0),
            diff_from_total_line = total - total_line) %>% unique() -> over_under_tbl

head(over_under_tbl, 21)



# * Spotifyr ---------------------------------------------------------------

pacman::p_load(spotifyr)

access_token <- get_spotify_access_token()

# For all the superbowl artists (Mary J Blige, Snoop Dogg, Dr Dre, Eminem and Kendrick Lamar)

snoop_dog = spotifyr::get_artist('7hJcb9fa4alzcOq3EaNPoG')
snoop_dog_albums = spotifyr::get_artist_albums('7hJcb9fa4alzcOq3EaNPoG', market = 'US')
snoop_do_top_tracks = spotifyr::get_artist_top_tracks('7hJcb9fa4alzcOq3EaNPoG')
snoop_dog_audio_features = spotifyr::get_artist_audio_features('7hJcb9fa4alzcOq3EaNPoG')

snoop_dog_id = '7hJcb9fa4alzcOq3EaNPoG' # from https://www.kaggle.com/ehcall/spotify-artists/version/1




# * weather.gov API -------------------------------------------------------

# Get the grid points for Oxford, Ohio
grid_point = jsonlite::fromJSON('https://api.weather.gov/points/39.5070,-84.7452')
gridr_GET = httr::GET(url = 'https://api.weather.gov/points/39.5070,-84.7452') %>% 
  httr::content(type = 'text') %>% jsonlite::fromJSON()

# 25 and 35

# Get the forecast for Oxford, Ohio
weather = jsonlite::fromJSON('https://api.weather.gov/gridpoints/CLE/25,35/forecast?units=us')

weather_tbl = weather$properties$periods



# * City of Cincy Crash Reports -------------------------------------------


https://dev.socrata.com/foundry/data.cincinnati-oh.gov/rvmt-pkmq