function buildViz($scope) {
  d3.csv($scope.currentCity.path, function(error, stops_data) {
    createMap(stops_data, $scope);
    centerMap($scope);
    createGraph(stops_data, $scope);
  });
}

function centerMap($scope) {
  $scope.map.panTo(new L.LatLng($scope.currentCity.lat, $scope.currentCity.lon)); 
  // TODO: Fit to bounds.
}

function createMap(stops_data, $scope) {
  var censusKey = 'f5bd9c51b563f034639bab7be5bb546c1b456cdc';

  var svg = d3.select("#map").select("svg"),
  g = svg.append("g");

  var feature = g.selectAll("circles.points")
    .data(stops_data)
    .enter()
    .append("circle")
    .attr("r",5)
    .attr("class", function(d) { return "route_" + d.route_id;})
    .attr("cx",function(d) { latLon = new L.LatLng(d.stop_lat, d.stop_lon); return $scope.map.latLngToLayerPoint(latLon).x})
    .attr("cy",function(d) { latLon = new L.LatLng(d.stop_lat, d.stop_lon); return $scope.map.latLngToLayerPoint(latLon).y})
    .style("fill", function(d) { return d.route_color; });

  $scope.map.on("viewreset", update);
  function update() {
    feature.attr("cx",function(d) { latLon = new L.LatLng(d.stop_lat, d.stop_lon); return $scope.map.latLngToLayerPoint(latLon).x})
    feature.attr("cy",function(d) { latLon = new L.LatLng(d.stop_lat, d.stop_lon); return $scope.map.latLngToLayerPoint(latLon).y})
  }

  update();

  g.selectAll("circle")
  .on("mouseover", function(d) {
    d3.select(this)
      .transition()
      .delay(250)
      .attr("r", 8);

      var pageX = d3.event.pageX;
      var pageY = d3.event.pageY;
      d3.select("#tooltip")
        .style("left", (pageX) + 20 + "px")
        .style("top", (pageY) - 30 + "px")
        .style("display", "block")
        .transition()
        .text(d.route_short_name + ': ' + d.stop_name + 'loading...');

      var fccUrl = "http://data.fcc.gov/api/block/find?format=jsonp&latitude=" + d.stop_lat + "&longitude=" + d.stop_lon + "&callback=?";
      $.getJSON(fccUrl, null, function (results) {
        var FIPS = results.Block.FIPS;
        var stateFip = FIPS.substring(0,2);
        var countyFip = FIPS.substring(2,5);
        var tractFip = FIPS.substring(5,11);
        var censusUrl = 'http://api.census.gov/data/2011/acs5?key=' + censusKey + '&get=' + $scope.currentDataPoint.value + ',NAME&for=block+group:1&in=state:' + stateFip + '+county:' + countyFip + '+tract:' + tractFip;
        $.getJSON(censusUrl, function(data) {
          d3.select("#tooltip")
            .style("left", (pageX) + 20 + "px")
            .style("top", (pageY) - 30 + "px")
            .style("display", "block")
            .transition()
            .text(d.route_short_name + ': ' + d.stop_name + ' ' + $scope.currentDataPoint.name + ': ' + data[1][0]);
        });
      });
  });

  g.selectAll("circle")
  .on("mouseout", function(d) {
      d3.select(this)
        .transition()
        .attr("r", 5);
      $('#tooltip').hide();
  });
  var routes = {};
  // Lines
  $.each(stops_data, function(key, value){
    routes[value.route_id] = {name: value.route_short_name, color: value.route_color};
  });
  $('#routes ul').empty();
  $.each(routes, function(id, items) {
    $('#routes ul').append('<li style="background-color: #' + items.color + '"><a href="#' + id  + '">' + items.name + '</a></li>');
  });


  // Action.
  d3.selectAll("#routes ul li a")
  .on("click", function(d) { moveItMoveIt(d3.select(this).attr("href"), stops_data)});
}

//
//
// GRAPH
//
//
function moveItMoveIt(id) {
  g.selectAll("circle")
    .transition()
    .attr("r", 2);
  g.selectAll("circle.route_" + id)
    .transition()
    .attr("r", 5);

  var graphData = {};
  // TODO: make more efficient.
  var x = 1;
  g2 = d3.select("#chart")
    .append("g")
  $.each(stops_data, function(key, de) {
    if (de.route_id == id) {
      var fccUrl = "http://data.fcc.gov/api/block/find?format=jsonp&latitude=" + de.stop_lat + "&longitude=" + de.stop_lon + "&callback=?";
      $.getJSON(fccUrl, null, function (results) {
        var FIPS = results.Block.FIPS;
        var stateFip = FIPS.substring(0,2);
        var countyFip = FIPS.substring(2,5);
        var tractFip = FIPS.substring(5,11);
        var censusUrl = 'http://api.census.gov/data/2011/acs5?key=' + censusKey + '&get=B19013_001E,NAME&for=block+group:1&in=state:' + stateFip + '+county:' + countyFip + '+tract:' + tractFip;
        $.getJSON(censusUrl, function(data) {
          graphData = {name: de.stop_name, data: data[1][0], color: de.route_color};
          chart.append("circle")
            .datum(graphData)
            .transition()
            .attr("r", 4)
            .style("fill", function(d) {return '#' + d.color; })
            .attr("cx", function(d) {return stop_scale(x)})
            .attr("cy", function(d) {return income_scale(d.data)});
          x++;
        });
      });
    }
  });
}

function createGraph(stops_data, $scope) {
  destroyGraph();
  // Graph.
  // TODO: http://bost.ocks.org/mike/chart/
  var container_dimensions = {width: 500, height: 400},
               margins = {top: 20, right: 20, bottom: 30, left: 118},
               chart_dimensions = { width: container_dimensions.width - margins.left - margins.right-20,
                                    height: container_dimensions.height - margins.top - margins.bottom };
  var chart = d3.select("#graph .content")
  .append("svg")
  .attr("width", container_dimensions.width)
  .attr("height", container_dimensions.height)
  .append("g")
  .attr("transform", "translate(" + margins.left + "," + margins.top + ")")
  .attr("id","chart");

  var stop_scale = d3.scale.linear()
  .range([0,chart_dimensions.width])
  .domain([1, 10]);

  var income_scale = d3.scale.linear()
  .range([chart_dimensions.height, 0])
  .domain([0,230000]);

  var income_axis = d3.svg.axis()
  .scale(income_scale)
  .orient("left")
  .tickValues([0, 50000, 100000, 150000, 200000])
  .tickSize(-chart_dimensions.width, 0)
  .tickPadding(20)
  .tickFormat(function(d) { return "$" + d; });

  
  //append the y axis
  chart.append("g")
     .attr("class", "y axis")
     .call(income_axis);
  d3.select(".y.axis")
  .append("text")
  .attr("text-anchor","middle")
  .text($scope.currentDataPoint.name)
  .attr("transform", "rotate (270, 0, 0)")
  .attr("x", -180)
  .attr("y", -110);

}

function destroyMap() {
  $('#map').empty();
  $('#routes ul').empty();
}
function destroyGraph() {
  $('#graph .content').empty();
}
