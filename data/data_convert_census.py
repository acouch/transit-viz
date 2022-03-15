#!/usr/bin/env python
from __future__ import division
import re
import csv
import urllib2
import pprint
import json
import sys

census_indicators = ['B01003_001E', 'B01002_001E', 'B19013_001E', 'B01001_001E', 'B01001_002E', 'B01001_026E', 'B25058_001E', 'B25064_001E', 'B25077_001E', 'B25003_001E', 'B25003_002E', 'B25003_003E', 'B08301_001E', 'B08301_002E', 'B08301_003E', 'B08301_004E', 'B08301_010E', 'B08301_011E', 'B08301_012E', 'B08301_013E', 'B08301_014E', 'B08301_015E', 'B08301_016E', 'B08301_017E', 'B08301_018E', 'B08301_019E', 'B08301_020E', 'B08301_021E', 'B25035_001E']

census_indicators = ['B19013_001E']

census_token = "f5bd9c51b563f034639bab7be5bb546c1b456cdc"

def csv_dict_reader(file_obj):
   reader = csv.DictReader(file_obj, delimiter=',')
   data = []
   for line in reader:
    	data.append(line)
   return data


def read_file(name):
#	with open("data/septa_gtfs/routes_stops.csv") as f_obj:
	with open(name) as f_obj:
		data = csv_dict_reader(f_obj)
		sys.stdout.write("Imported CSV %s \n" % name)
		return data
        
def add_fip(data):
	updata = []
	x = 1;
	sys.stdout.write("Fetching FIPS Data\n")
	length = len(data);
	for stop in data:
		lat = stop['stop_lat']
		lon = stop['stop_lon']
		url = "http://data.fcc.gov/api/block/find?format=jsonp&latitude=" + lat + "&longitude=" + lon
		req = urllib2.Request(url)
		req.add_header('Accept', 'application/json')
		res = urllib2.urlopen(req)
		result = res.read()
		fips = result[27:42]
		stop['fips'] = fips
		drawProgressBar(x/length)
		x = x + 1;
		updata.append(stop)
	return updata	

def add_census(data, token):
	updata = []
	length = len(data);
	x = 1;
	sys.stdout.write("Fetching Census Data\n")
	for stop in data:
		fips = stop['fips']
		stateFip = fips[0:2]
		countyFip = fips[2:5]
		tractFip = fips[5:11]
		for indicator in census_indicators:
			url = 'http://api.census.gov/data/2011/acs5?key=' + token + '&get=' + indicator + ',NAME&for=block+group:1&in=state:' + stateFip + '+county:' + countyFip + '+tract:' + tractFip
			response = json.loads(urllib2.urlopen(url).read())
			census_data = response[1][0]
			stop[indicator] = census_data
		x = x + 1
		updata.append(stop)
		drawProgressBar(x/length)
	return updata


def drawProgressBar(percent, barLen = 50):
    sys.stdout.write("\r")
    progress = ""
    for i in range(barLen):
        if i < int(barLen * percent):
            progress += "="
        else:
            progress += " "
    sys.stdout.write("[ %s ] %.2f%%" % (progress, percent * 100))
    sys.stdout.flush()

def write_file(name, data):
	ofile  = open(name, "wb")
	writer = csv.writer(ofile, delimiter=',')
	headers = data[0].keys()
	writer.writerow(headers)
	for row in data:
		writer.writerow(row.values())

	ofile.close()


data = read_file("routes_stops.csv")
data = add_fip(data)
write_file("routes_stops_fip.csv", data)
data = read_file("routes_stops_fip.csv")
data = add_census(data, census_token)
write_file("routes_stops_census.csv", data)

