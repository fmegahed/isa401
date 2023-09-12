


# * Excel example ---------------------------------------------------------


?readxl::read_excel('')
aaic = readxl::read_excel(
  'AIAAIC Repository.xlsx', sheet = 2, skip = 1
                          )

aaic1 = aaic[2:1087, ] # row 2:1087, after the comma means all cols (if 2:4 )
aaic2 = aaic[-1, ]

dplyr::glimpse(aaic1)
str(aaic2)



# * JSON Example ----------------------------------------------------------

sen_list = jsonlite::fromJSON(
  'https://www.govtrack.us/api/v2/role?current=true&role_type=senator'
  )

# are intended to provide information about the structure of the list
names(sen_list) # this will only provide me with the names of the sublists
dplyr::glimpse(sen_list) # show me the names as well as some additional info

sen_df = sen_list$objects

sen_df_cleaned = jsonlite::flatten(sen_df)

