#!/usr/bin/env python
import re
import csv
import MySQLdb
database = 'gtfs'
dbHost = 'localhost'
dbUser = 'root'
dbPass = ''
tables = {
  'routes',
  'stops',
  'calendar',
  'stop_times',
  'trips'
  }

def createDatabase(dbHost, dbUser, dbPass, database):
  print "Creating database %s" % database
  db = MySQLdb.connect(user=dbUser, passwd=dbPass, db="mysql")
  c = db.cursor()
  c.execute('CREATE DATABASE %s' % database)
  c.close()

def insertData(tables):
  for table in tables:
    csv_data = csv.reader(file(table + ".txt"))
    headers = csv_data.next()
    createTable(table, headers)
    headerString = ", ".join(headers)
    print "Inserting data for %s" % table
    sql = "INSERT INTO %s (%s)" % (table, headerString)
    for row in csv_data:
      query = sql
      i = 0
      for entry in row:
        # This should be less ad hoc.
        entry = re.sub("`" , "\'", entry)
        entry = re.sub("'" , "\\'", entry)
        row[i] = entry
        i = i + 1
      query += " VALUES('%s');" %  "', '".join(row)
      # Could work on more efficient way of doing this.
      executeQuery(gtfs, query)

def createTable(name, columns):
  print "Creating table %s" % name
  sql = "CREATE TABLE %s(id INT NOT NULL AUTO_INCREMENT, PRIMARY KEY(id)" % name
  for column in columns:
    sql += ", %s LONGTEXT" % column

  sql += ")"
  executeQuery(gtfs, sql)

def cleanUpTables():
  print "Optimizing tables"
  sql = """ALTER TABLE stops MODIFY stop_id int;
  ALTER TABLE stop_times MODIFY stop_id int;
  ALTER TABLE stop_times MODIFY stop_sequence int;
  ALTER TABLE stop_times MODIFY trip_id varchar(55);
  ALTER TABLE trips MODIFY trip_id varchar(55);
  ALTER TABLE stop_times ADD INDEX stop_id (stop_id);
  ALTER TABLE stop_times ADD INDEX trip_id (trip_id);
  ALTER TABLE trips ADD INDEX trip_id (trip_id);"""
  executeQuery(gtfs, sql)

def executeQuery(conn, query):
  cur = conn.cursor()
  cur.execute(query)
  rows = cur.fetchall()
  cur.close()
  return rows

def export():
  sql = "SELECT DISTINCT route_id FROM trips;"
  routes = executeQuery(gtfs, sql)
  result = [('stop_id', 'stop_name', 'stop_lat', 'stop_lon', 'route_short_name', 'route_id', 'route_color', 'route_text_color', 'stop_sequence')]
  for route in routes:
    # I want to graph this along the route. There is no list of
    # official stops along routes. This picks the first trip on
    # a Monday as the best guess as to when a trip will be full.
    sql = "SELECT trip_id FROM trips JOIN calendar ON trips.service_id = calendar.service_id WHERE route_id = '%s' AND monday = 1 LIMIT 1;" % route
    tripID = executeQuery(gtfs, sql)
    if len(tripID) > 0:
      print "Exporting route: %s" % route
      sql = "SELECT stops.stop_id stop_id, stops.stop_name, stops.stop_lat, stops.stop_lon, routes.route_short_name, routes.route_id, routes.route_color, routes.route_text_color, stop_sequence FROM stop_times JOIN stops ON stop_times.stop_id = stops.stop_id JOIN trips ON stop_times.trip_id = trips.trip_id JOIN routes ON routes.route_id = trips.route_id  WHERE stop_times.trip_id = '%s' ORDER BY stop_sequence ASC;" % tripID[0]
      result += executeQuery(gtfs, sql)
    else:
      print "No trip for route %s" % route
  fp = open('routes_stops.csv', 'a')
  file = csv.writer(fp)
  file.writerows(result)
  fp.close()

#createDatabase(dbHost, dbUser, dbPass, database)

gtfs = MySQLdb.connect(host=dbHost,
    user=dbUser,
    passwd=dbPass,
    db=database)

cursor = gtfs.cursor()

#insertData(tables)
#cleanUpTables()
export()
cursor.close()
#destroyDatabase()
