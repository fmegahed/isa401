
# For the app, we set the working directory to the folder that contains the app
# (by clicking on the inverted triangle in the "Files" pane)
# we did this to simplify how the app would look like when we host it on 
# hugging face

# install.packages("readxl")
df = readxl::read_excel(
  path = "all_data_M_2024.xlsx",
  na = c("**", "*" ,"~") # showing you that we can control NAs in this package
)

# install.packages("querychat")

querychat::querychat_app(
  data_source = df,
  table_name = "our_data",
  greeting = "Welcome to Fadel's App for Exploring the OEWS Dataset",
  client = "openai/gpt-5-mini-2025-08-07"
)
