var svg = d3.select("svg");

var routes = tributary.routes;
var world = tributary.world110;
var countries = topojson.object(world, world.objects.land);


var width = tributary.sw;
var height = tributary.sh;
var center = {
  x: width/2,
  y: height/2
}
var colorScale = d3.scale.category20();

var lonlat = [-122.4376, 37.77];

var projection = d3.geo.mercator()
//var projection = d3.geo.albers()
  .center(lonlat)  
  .scale(1238395)
  .translate([width/2, height/2])

var xy = projection(lonlat);

var graticule = d3.geo.graticule()

var path = d3.geo.path()
  .projection(projection);

svg.append("path")
    .datum(graticule)
    .attr("class", "graticule")
    .attr("d", path);

svg.append("path")
.attr("d", path(countries))
.classed("land", true);

/*
svg.append("circle")
.attr({
  cx: xy[0],
  cy: xy[1],
  r: 10
})*/

svg.selectAll("path.routes")
.data(routes.features)
.enter()
.append("path")
.attr("d", path)
.style("stroke", function(d,i) { return colorScale(i)})
.style("fill", "none")
.style("stroke-width", 3)