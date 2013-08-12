(function() {

	// The component's main object
	mapTool = {};

	mapTool.settings = {
		cloudmadeUrl: "http://{s}.tile.cloudmade.com/3c140586b7e74d67b2a01a5fc9a51e7f/102295/256/{z}/{x}/{y}.png",
		cloudmadeZoom: "18",
		cloudmadeAttribution: 'Map data &copy; 2011 OpenStreetMap contributors, Imagery &copy; 2011 CloudMade',
		lat: "95",
		lon: "43",
		zoom: 5,
		censusToken: 'f5bd9c51b563f034639bab7be5bb546c1b456cdc',
		mapDiv: "",
		currentDataPoint: "",
		dataPath: "",
	}

	mapTool.init = function(settings) {
		// Options.
		options = $.extend(mapTool.settings, settings);
		var cloudmadeUrl = options.cloudmadeUrl,
			cloudmade = new L.TileLayer(cloudmadeUrl, {maxZoom: options.cloudmadeZoom, attribution: options.cloudmadeAttribution});

		var map = mapTool.createMap(options.lat, options.lon, cloudmade);
		options.map = map;
		return map;
	}

	mapTool.update = function(updates) {
		options = $.extend(options, updates);
	}
  
	mapTool.execute = function() {

		// TODO: separate as a promise.
		d3.csv(options.dataPath, function(error, stops_data) {
			mapTool.addData(stops_data);
			mapTool.centerMap();
			mapTool.addRoutes(stops_data);
			mapTool.addPoints();
			//createGraph(stops_data, $scope);
		});
	}

	mapTool.centerMap = function() {
		options.map.panTo(new L.LatLng(options.lat, options.lon)); 
		// TODO: Fit to bounds.
		return map;
	}

	mapTool.createMap = function(lat, lon, cloudmade) {
		var map = new L.Map('map', {
			center: new L.LatLng(options.lat, options.lon),
			zoom: options.zoom,
			layers: [cloudmade]
		});
		map._initPathRoot();
		return map;
	}

	mapTool.addData = function(stops_data) {
    $("g").remove();
		var svg = d3.select("#map").select("svg"),
			g = svg.append("g");
    options.g = g;
		var feature = g.selectAll("circles.points")
			.data(stops_data)
			.enter()
			.append("circle")
			.attr("r",5)
			.attr("class", function(d) { return "route_" + d.route_id;})
			.attr("cx",function(d) { latLon = new L.LatLng(d.stop_lat, d.stop_lon); return options.map.latLngToLayerPoint(latLon).x})
			.attr("cy",function(d) { latLon = new L.LatLng(d.stop_lat, d.stop_lon); return options.map.latLngToLayerPoint(latLon).y})
			.attr("style", function(d) { return "fill: #" + d.route_color; });

		options.map.on("viewreset", attach);
		function attach() {
			feature.attr("cx",function(d) { latLon = new L.LatLng(d.stop_lat, d.stop_lon); return options.map.latLngToLayerPoint(latLon).x})
			feature.attr("cy",function(d) { latLon = new L.LatLng(d.stop_lat, d.stop_lon); return options.map.latLngToLayerPoint(latLon).y})
		}
		attach();
	}
  
  mapTool.addPoints = function() {

    g = d3.select("g");
    //g = options.g;
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
					var censusUrl = 'http://api.census.gov/data/2011/acs5?key=' + options.censusToken + '&get=' + options.currentDataPoint.value + ',NAME&for=block+group:1&in=state:' + stateFip + '+county:' + countyFip + '+tract:' + tractFip;
					$.getJSON(censusUrl, function(data) {
						d3.select("#tooltip")
							.style("left", (pageX) + 20 + "px")
							.style("top", (pageY) - 30 + "px")
							.style("display", "block")
							.transition()
							.text(d.route_short_name + ': ' + d.stop_name + ' ' + options.currentDataPoint.name + ': ' + data[1][0]);
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
	}

  mapTool.addRoutes = function(stops_data) {
		var routes = {};
		// Lines
		$.each(stops_data, function(key, value) {
      if ( Object.prototype.toString.call( routes[value.route_id] ) === '[object Object]' ) {
				routes[value.route_id].stops[value.stop_id] = value;
			} else {
				routes[value.route_id] = {name: value.route_short_name, color: value.route_color, stops: {}};
			}
		});
		$('#routes ul').empty();
		$.each(routes, function(id, items) {
			$('#routes ul').append('<li style="background-color: #' + items.color + '"><a href="#' + id  + '">' + items.name + '</a></li>');
		});
    console.log(routes);

		// TODO: switch to ng-model
		d3.selectAll("#routes ul li a")
			.on("click", function(d) { mapTool.activateRoute(d3.select(this).attr("href").substring(1), routes);});
	}
  
  mapTool.activateRoute = function(route, routes) {
    var arrayOfLatLons = [];
    var x = 0;
		$.each(routes[route].stops, function(key, value) {
      arrayOfLatLons[x] = [value.stop_lat, value.stop_lon];
      x++;
    });
    var bounds = new L.LatLngBounds(arrayOfLatLons);
    options.map.fitBounds(bounds);
   
		return;
    updateGraph(route);
  }
  
})();

