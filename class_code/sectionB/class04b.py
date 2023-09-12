# libraries

import pandas as pd
import requests


# Reading CSVs
# -------------

wh_df = pd.read_csv('https://www.whitehouse.gov/wp-content/uploads/2023/08/2023.05_WAVES-ACCESS-RECORDS.csv')

wh_df.info


fred_df = pd.read_csv("https://fred.stlouisfed.org/graph/fredgraph.csv?bgcolor=%23e1e9f0&chart_type=line&drp=0&fo=open%20sans&graph_bgcolor=%23ffffff&height=450&mode=fred&recession_bars=on&txtcolor=%23444444&ts=12&tts=12&width=1318&nt=0&thu=0&trc=0&show_legend=yes&show_axis_titles=yes&show_tooltip=yes&id=UNRATE&scale=left&cosd=1948-01-01&coed=2023-08-01&line_color=%234572a7&link_values=false&line_style=solid&mark_type=none&mw=3&lw=2&ost=-99999&oet=99999&mma=0&fml=a&fq=Monthly&fam=avg&fgst=lin&fgsnd=2020-02-01&line_index=1&transformation=lin&vintage_date=2023-09-07&revision_date=2023-09-07&nd=1948-01-01")
fred_df.info()

women_df = pd.read_csv("https://raw.githubusercontent.com/glosophy/women-data/master/WomenTotal.csv")

women_df.info()


# Read Excel:
# ------------

# first open the file
# [1] Which sheet; [2] which row contains your header; [3] delete non-informative rows
# skiprows gets applied before the header argument so my header is now row 0
ai_df = pd.read_excel('AIAAIC Repository.xlsx', sheet_name = 1, skiprows= [0,2])

# note that ai_df.info will not show all column names (but ai_df.info() will)
ai_df.info()


# JSON:
# ----

sen_data = requests.get('https://www.govtrack.us/api/v2/role?current=true&role_type=senator').json()

# by inspecting my Python environment, sen_data is a dictionary object

# chaining in python (as piping in R)
sen_df = pd.DataFrame.from_dict( sen_data['objects'] )
sen_df.info()
