
# we set the working directory to the folder that contains the app.r file
# (by clicking on the triangle next to more in the files pane)
# my motivation for doing this, it would simplify the hosting of the app
# on hugging face which you will do in your assignment 03


df = readxl::read_excel(path = 'all_data_M_2024.xlsx', sheet=1,
                        na = c("", "**", "~", "*") # for illustration
                        )

querychat::querychat_app(
  df,
  "our_data",
  greeting = "Welcome to Fadel's Data Explorer App",
  client = "openai/gpt-5-mini-2025-08-07"
)
