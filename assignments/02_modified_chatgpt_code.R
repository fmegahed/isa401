
if(require(tidyverse)==F) install.packages('tidyverse'); library(tidyverse)
if(require(tidyquant)==F) install.packages('tidyquant'); library(tidyquant)
if(require(maps)==F) install.packages('maps'); library(maps)
if(require(RColorBrewer)==F) install.packages('RColorBrewer'); library(RColorBrewer)
if(require(gganimate)==F) install.packages('gganimate'); library(gganimate)

# based on the error message
if(require(devtools)==F) install.packages('devtools') 
if(require(transformr)==F) devtools::install_github("thomasp85/transformr")


# step 1
states <- c("AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "FL", "GA", 
            "HI", "ID", "IL", "IN", "IA", "KS", "KY", "LA", "ME", "MD", 
            "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NJ", 
            "NM", "NY", "NC", "ND", "OH", "OK", "OR", "PA", "RI", "SC", 
            "SD", "TN", "TX", "UT", "VT", "VA", "WA", "WV", "WI", "WY") 

state_symbols <- paste0(states, "UR")

unemployment_data <- tq_get(state_symbols, 
                            get = "economic.data", 
                            from = "2003-01-01", 
                            to = "2023-01-08")

# step 2
state_names <- c("AL" = "Alabama", "AK" = "Alaska", "AZ" = "Arizona", "AR" = "Arkansas", 
                 "CA" = "California", "CO" = "Colorado", "CT" = "Connecticut", "DE" = "Delaware", 
                 "FL" = "Florida", "GA" = "Georgia", "HI" = "Hawaii", "ID" = "Idaho", 
                 "IL" = "Illinois", "IN" = "Indiana", "IA" = "Iowa", "KS" = "Kansas", 
                 "KY" = "Kentucky", "LA" = "Louisiana", "ME" = "Maine", "MD" = "Maryland", 
                 "MA" = "Massachusetts", "MI" = "Michigan", "MN" = "Minnesota", "MS" = "Mississippi", 
                 "MO" = "Missouri", "MT" = "Montana", "NE" = "Nebraska", "NV" = "Nevada", 
                 "NH" = "New Hampshire", "NJ" = "New Jersey", "NM" = "New Mexico", "NY" = "New York", 
                 "NC" = "North Carolina", "ND" = "North Dakota", "OH" = "Ohio", "OK" = "Oklahoma", 
                 "OR" = "Oregon", "PA" = "Pennsylvania", "RI" = "Rhode Island", "SC" = "South Carolina", 
                 "SD" = "South Dakota", "TN" = "Tennessee", "TX" = "Texas", "UT" = "Utah", 
                 "VT" = "Vermont", "VA" = "Virginia", "WA" = "Washington", "WV" = "West Virginia", 
                 "WI" = "Wisconsin", "WY" = "Wyoming")


unemployment_data <- unemployment_data |>
  dplyr::mutate(
    state = substr(symbol, 1, 2),
    state_name = state_names[state]
  )

map_data <- map_data("state")
unemployment_data$region <- tolower(unemployment_data$state_name)

merged_data <- dplyr::left_join(map_data, unemployment_data, by = "region")

p <- ggplot() +
  geom_polygon(data = merged_data, 
               aes(x = long, y = lat, group = group, fill = price), 
               color = "white", size = 0.2) +
  geom_text(data = filter(merged_data, region == "ohio"), 
            aes(x = long, y = lat, label = price), 
            size = 3, check_overlap = TRUE) +
  coord_map() +
  scale_fill_distiller(palette = "Spectral", 
                       na.value = "grey90", 
                       guide = guide_colorbar(title = "Unemployment Rate")) +
  labs(title = "Unemployment Rate by State: {format(frame_time, '%Y-%m')}") +
  theme_void() +
  theme(plot.title = element_text(hjust = 0.5),
        legend.position = "bottom") +
  transition_time(date) +
  ease_aes('linear')

animate(p, fps = 1, duration = 240)