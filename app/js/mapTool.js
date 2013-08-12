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
		console.log('buts party');
		console.log(options.lat);
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
			mapTool.centerMap(options.map, options.lat, options.lon);
			mapTool.addData(options.map, stops_data, options.lat, options.lon, options.currentDataPoint);
			//createGraph(stops_data, $scope);
		});
  }

	mapTool.centerMap = function(map, lat, lon) {
		map.panTo(new L.LatLng(lat, lon)); 
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

  mapTool.addData = function(map, stops_data, lat, lon, currentDataPoint) {

		var svg = d3.select("#map").select("svg"),
			g = svg.append("g");

		var feature = g.selectAll("circles.points")
			.data(stops_data)
			.enter()
			.append("circle")
			.attr("r",5)
			.attr("class", function(d) { return "route_" + d.route_id;})
			.attr("cx",function(d) { latLon = new L.LatLng(d.stop_lat, d.stop_lon); return map.latLngToLayerPoint(latLon).x})
			.attr("cy",function(d) { latLon = new L.LatLng(d.stop_lat, d.stop_lon); return map.latLngToLayerPoint(latLon).y})
			.attr("style", function(d) { return "fill: #" + d.route_color; });

		map.on("viewreset", update);
		function update() {
			feature.attr("cx",function(d) { latLon = new L.LatLng(d.stop_lat, d.stop_lon); return map.latLngToLayerPoint(latLon).x})
			feature.attr("cy",function(d) { latLon = new L.LatLng(d.stop_lat, d.stop_lon); return map.latLngToLayerPoint(latLon).y})
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
					var censusUrl = 'http://api.census.gov/data/2011/acs5?key=' + options.censusToken + '&get=' + currentDataPoint.value + ',NAME&for=block+group:1&in=state:' + stateFip + '+county:' + countyFip + '+tract:' + tractFip;
					$.getJSON(censusUrl, function(data) {
						d3.select("#tooltip")
							.style("left", (pageX) + 20 + "px")
							.style("top", (pageY) - 30 + "px")
							.style("display", "block")
							.transition()
							.text(d.route_short_name + ': ' + d.stop_name + ' ' + currentDataPoint.name + ': ' + data[1][0]);
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
  
})();

