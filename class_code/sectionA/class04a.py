import pandas as pd

wh_df = pd.read_csv('https://www.whitehouse.gov/wp-content/uploads/2022/04/2021_WAVES-ACCESS-RECORDS.csv')

covid_df = pd.read_csv('https://raw.githubusercontent.com/nytimes/covid-19-data/master/us-states.csv')

aaic = pd.read_excel('AIAAIC Repository.xlsx', sheet_name = 1, skiprows = [0,2])

aaic.info()


# JSON Example
# -------------
import requests

# requests can be used to get data from online sources
# .json() tells me that I want to pull the json structure from the request
# and that returned a dict (saw by hovering over the sen_data in my GUI)
sen_data = requests.get('https://www.govtrack.us/api/v2/role?current=true&role_type=senator').json()

# returns the names of the keys for the dict
sen_data.keys()

# given that I have a dict, I am using pandas to create a df from that dict
sen_df = pd.DataFrame.from_dict( sen_data['objects'] )
sen_df.info
