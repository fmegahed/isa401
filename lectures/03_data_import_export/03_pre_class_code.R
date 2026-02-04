
## Loading and cleaning the OEWS dataset
## --------------------------------------

# Download: https://www.bls.gov/oes/special-requests/oesm24all.zip 
# Website: https://www.bls.gov/oes/tables.htm
oews_raw = readxl::read_excel("data/all_data_M_2024.xlsx", sheet = 1) |> 
  janitor::clean_names()

dplyr::glimpse(oews_raw) # Note the character variables


oews = oews_raw |> 
  dplyr::mutate(
    dplyr::across( c(emp_prse:a_pct90), as.numeric ),
    dplyr::across( is.character, as.factor )
  )

dplyr::glimpse(oews) # All good
skimr::skim(oews) # Nice visual summary

# A quick explorer app
qc = querychat::querychat_app(
  oews,
  client = "openai/gpt-5-mini-2025-08-07", # ollama/ministral-3:3b
  greeting = "Welcome to Our ISA 401 Assistant for Understanding the OEWS Dataset",
  extra_instructions = "data/extra_instructions.md",
  data_description = 'data/data_desc.md'
)

qc$run()