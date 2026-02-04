
df = readxl::read_excel(path = 'all_data_M_2024.xlsx', sheet=1)

querychat::querychat_app(
  df
)
