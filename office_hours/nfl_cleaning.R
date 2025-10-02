


# * Reading the Data ------------------------------------------------------

df = readxl::read_excel(
  "C:\\Users\\megahefm\\Dropbox\\PC\\Downloads\\Phase 1.xlsx", 
  sheet = 'SV', skip = 1, range = 'A2:K274'
  ) |> 
  janitor::clean_names() |> 
  dplyr::rename(
    home_away = column1,
    winner_points = pts,
    loser_points = pts_2,
    winner_yards = yds_w,
    loser_yards = yds_l,
    winner_turnovers = tow,
    loser_turnovers = tol
  ) |> 
  dplyr::mutate(
    game_id = dplyr::row_number()
  ) |> 
  dplyr::relocate(game_id, week, total_pts, home_away)

dplyr::glimpse(df)

# game_id is going to be the common key
# split the data into winners and losers
# pivot the data longer for each dataset




# * Creating the two splits -----------------------------------------------

df_winners = df |> 
  dplyr::select(
    game_id, week, total_pts, home_away, dplyr::starts_with("winner_")
  ) |> 
  dplyr::mutate(
    result = 'win',
    home_away = tidyr::replace_na(home_away, 'home') |> stringr::str_replace("@", "away"),
    id_to_be_dropped = dplyr::row_number()
  ) |> 
  dplyr::rename_with(
    .cols = dplyr::starts_with("winner_"),
    .fn = ~ stringr::str_replace(., "winner_", "")
  ) |> 
  dplyr::rename(
    team = tie
  )


df_losers = df |> 
  dplyr::select(
    game_id, week, total_pts, home_away, dplyr::starts_with("loser_")
  ) |> 
  dplyr::mutate(
    result = 'loss',
    home_away = tidyr::replace_na(home_away, 'away') |> stringr::str_replace("@", "home"),
    id_to_be_dropped = dplyr::row_number() + 272
  ) |> 
  dplyr::rename_with(
    .cols = dplyr::starts_with("loser_"),
    .fn = ~ stringr::str_replace(., "loser_", "")
  ) |> 
  dplyr::rename(
    team = tie
  )



# * Put the two datasets on top of each other -----------------------------


df_final = dplyr::bind_rows(df_winners, df_losers) |> 
  dplyr::arrange(week, game_id, id_to_be_dropped) |> 
  dplyr::select(-id_to_be_dropped)


# three operations below are to identify ties

# (a) we calculated an aggregated difference in points for each game
df_ties = df_final |> 
  dplyr::group_by(
    week, game_id
  ) |> 
  dplyr::summarise(
    point_difference = points - dplyr::lag(points)
  ) |> 
  na.omit() |> 
  dplyr::mutate(
    tie_flag = ifelse(point_difference == 0, "Tie", "No Tie")
  )

# adds the tie_flag column to the main dataset
df_final = dplyr::left_join(
  x = df_final,
  y = df_ties |> dplyr::select(week, game_id, tie_flag),
  by = c("week", "game_id")
) 

# update the results in the result column only if we observe a tie
df_final$result = ifelse(
  df_final$tie_flag == "Tie", "tie", df_final$result
)

df_final$tie_flag = NULL # drops this column bec it is now redudant


# * Write the final dataset to a csv file ---------------------------------
readr::write_csv(
  df_final, 
  "C:\\Users\\megahefm\\Dropbox\\PC\\Downloads\\phase1_cleaned_sv.csv"
)
