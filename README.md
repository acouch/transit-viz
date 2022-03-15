# Visuazlising Inequality and other Census Data along transit routes

This still needs a lot of work, but the foundation currently allows the graphing and mapping of census data along transit routes.

Any city with GTFS data can be plugged in. There is a python script to convert GTFS data to produce the stops along each route. GTFS does not provide that by default as the stops along a route could change per day.   

## Adding new cities

1. Download gtfs data and add to data folder
2. Build stops data:

```bash

docker build -t tv .
docker run --name=transit_vis -td tv
docker docker exec -it transit_vis python3 data_convert.py [FOLDER NAME]
docker docker exec -it transit_vis cat data/[FOLDER NAME]/routes_stops.csv > data/[FOLDER NAME]/routes_stops.csv

```

3. Add to app by adding city to "cities" var in `./js/data.js` 

