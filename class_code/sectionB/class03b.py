import pandas as pd # allows me to say pd.fun_name

"""
check the current working directory using the os package
I will show you that you can pull a specific function from a library 
using the from pkg import fun_name
"""

from os import getcwd

getcwd() # to show that the project in R also applies to Python

burrow_df = pd.read_csv("burrow_career_stats.csv", header = 1)

burrow_df.info() # will show the column types and names
burrow_df.describe() # will provide typical summary stats for float/numeric cols
