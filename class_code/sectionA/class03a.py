import pandas as pd

"""
The import below only pulls the getcwd() from the os pkg
and I can use it without saying os.getcwd()
"""
from os import getcwd 

getcwd()

burrow_df = pd.read_csv('burrow_career_stats.csv', header = 1)
burrow_df.info()
