
# starter code to access the MySQL database, which is hosting the GE data


# * Loading the Required Package ------------------------------------------

pacman::p_load(RMySQL)


# * Connecting to the Database and Listing the 7 Tables -------------------

mysqlconnection = dbConnect(
  RMySQL::MySQL(),
  dbname='gedata',
  host='mysql.fsb.miamioh.edu',
  port=3306,
  user='fsbstud',
  password='fsb4you')


dbListTables(mysqlconnection) # displays the tables available in this database.
