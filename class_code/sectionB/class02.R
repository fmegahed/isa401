install.packages( c('tidyverse', 'tidyquant') ) # do not run this everytime

library(tidyverse)
library(tidyquant)



# * Step 1 ----------------------------------------------------------------



# Create a vector of state abbreviations
states <- state.abb
states <- states[!states %in% c("HI", "AK")] # Exclude Hawaii and Alaska

# Create symbols for FRED
symbols <- paste0(states, "UR")

# Get unemployment data
unemployment_data <- symbols %>%
  enframe(name = NULL, value = "symbol") %>%
  tq_get(get  = "economic.data",
         from = "2003-01-01",
         to   = "2023-08-01")


# * Step 2 -----------------------------------------------------------------

# Add state name and abbreviation columns
unemployment_data <- unemployment_data %>%
  mutate(state_abb = substr(symbol, 1, 2), # Extract state abbreviation from symbol
         state_name = state.name[match(state_abb, state.abb)]) # Match abbreviation to state name


# * Step 3 ----------------------------------------------------------------

install.packages(c("ggplot2", "maps", "RColorBrewer"))
library(ggplot2)
library(maps)
library(RColorBrewer)

# Aggregate data
unemployment_data_agg <- unemployment_data %>%
  group_by(state_abb, state_name) %>%
  summarize(mean_unemployment = mean(price, na.rm = TRUE))

# Get the map data
states_map <- map_data("state")

# Convert the state names to abbreviations in the map data
states_map$region <- state.abb[match(states_map$region, tolower(state.name))]

# Merge the map data with the unemployment data
merged_data <- merge(states_map, unemployment_data_agg, 
                     by.x = "region", by.y = "state_abb", all.x = TRUE)

# Create the choropleth map
ggplot() +
  geom_map(data = merged_data, aes(map_id = region, fill = mean_unemployment), 
           map = states_map) +
  expand_limits(x = states_map$long, y = states_map$lat) +
  scale_fill_gradientn(colours = color_palette, 
                       na.value = "grey90", 
                       name = "Mean Unemployment Rate") +
  coord_map() +
  labs(title = "Mean Unemployment Rate by State (2003-2023)", 
       x = "", y = "") +
  theme_void()
