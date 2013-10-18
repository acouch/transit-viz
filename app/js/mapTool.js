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
		containerDimensions: {width: 500, height: 400},
                chartMargins: {top: 20, right: 20, bottom: 30, left: 118},
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
		d3.csv(options.dataPath, function(error, stops_data) {
			mapTool.addMapPoints(stops_data);
			mapTool.centerMap();
			mapTool.addRoutes(stops_data);
			mapTool.mapPointsHover();
			mapTool.createGraph(stops_data);
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

	mapTool.addMapPoints = function(stops_data) {
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

	mapTool.getCensusData = function(lat, lon, stopName) {
		var fccUrl = "http://data.fcc.gov/api/block/find?format=jsonp&latitude=" + lat + "&longitude=" + lon + "&callback=?";
		var fccPromise = $.ajax({
		    type: 'GET',
		    url: fccUrl,
		    dataType: 'json',
		    data: {},
		    async: false,
		});
		var dff = $.Deferred();
		fccPromise.then(function(results) {
			var FIPS = results.Block.FIPS;
			var stateFip = FIPS.substring(0,2);
			var countyFip = FIPS.substring(2,5);
			var tractFip = FIPS.substring(5,11);
			var censusUrl = 'http://api.census.gov/data/2011/acs5?key=' + options.censusToken + '&get=B19013_001E,NAME&for=block+group:1&in=state:' + stateFip + '+county:' + countyFip + '+tract:' + tractFip;
			var censusPromise = $.ajax({
				type: 'GET',
				url: censusUrl,
				dataType: 'json',
				data: {},
				async: false,
			});
			censusPromise.then(function(data) {
				dff.resolve(data);
			}, function() {
				console.log('Census data did not return');
			});
		}, function() {
			console.log('FCC data did not return');
		});
		return dff.promise();
	}

	mapTool.mapPointsHover = function() {

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

					var data = mapTool.getCensusData(d.stop_lat, d.stop_lon);
					data.done(function(data) {
						d3.select("#tooltip")
							.style("left", (pageX) + 20 + "px")
							.style("top", (pageY) - 30 + "px")
							.style("display", "block")
							.transition()
							.text(d.route_short_name + ': ' + d.stop_name + ' ' + options.currentDataPoint.name + ': ' + data[1][0]);

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
			$('#routes ul').append('<li style="background-color: #' + items.color + '"><a ng-click="routeSelect" href="#' + id  + '">' + items.name + '</a></li>');
		});

		// TODO: switch to ng-model
		d3.selectAll("#routes ul li a")
			.on("click", function(d) {
				var id = d3.select(this).attr("href").substring(1);
				mapTool.activateRoute(routes[id]);
				mapTool.updateGraph(id, routes[id]);
			});
	}

	mapTool.activateRoute = function(route) {
		var arrayOfLatLons = [];
		var x = 0;
		$.each(route.stops, function(key, value) {
			arrayOfLatLons[x] = [value.stop_lat, value.stop_lon];
			x++;
		});
		var bounds = new L.LatLngBounds(arrayOfLatLons);
		options.map.fitBounds(bounds);

		return;
		updateGraph(route);
	}

	mapTool.stopScale = function (stops) {
		var stopScale = d3.scale.linear()
			.range([0,options.chart_dimensions.width])
			.domain([1, stops.length]);
		return stopScale;
	}

	mapTool.incomeScale = function (stops) {
		var highest = 0;
		$.each(stops, function(key, stop) {
			if (highest < stop.data) {
				highest = stop.data;
			}
		});

		var incomeScale = d3.scale.linear()
			.range([options.chart_dimensions.height, 0])
			.domain([0, highest]);
		return incomeScale;
	}

	mapTool.createGraph = function (stops_data) {
		$('#graph .content').empty();
		// Graph.
		// TODO: http://bost.ocks.org/mike/chart/
		options.chart_dimensions = { width: options.containerDimensions.width - options.chartMargins.left - options.chartMargins.right-20,
					    height: options.containerDimensions.height - options.chartMargins.top - options.chartMargins.bottom };
		options.chart = d3.select("#graph .content")
			.append("svg")
			.attr("width", options.containerDimensions.width)
			.attr("height", options.containerDimensions.height)
			.append("g")
			.attr("transform", "translate(" + options.chartMargins.left + "," + options.chartMargins.top + ")")
			.attr("id","chart");

		options.stop_scale = d3.scale.linear()
			.range([0,options.chart_dimensions.width])
			.domain([1, 10]);

		options.income_scale = d3.scale.linear()
			.range([options.chart_dimensions.height, 0])
			.domain([0,230000]);

		options.income_axis = d3.svg.axis()
			.scale(options.income_scale)
			.orient("left")
			.tickValues([0, 50000, 100000, 150000, 200000])
			.tickSize(-options.chart_dimensions.width, 0)
			.tickPadding(20)
			.tickFormat(function(d) { return "$" + d; });

		//append the y axis
		options.chart.append("g")
			.attr("class", "y axis")
			.call(options.income_axis);
		d3.select(".y.axis")
			.append("text")
			.attr("text-anchor","middle")
			.text(options.currentDataPoint.name)
			.attr("transform", "rotate (270, 0, 0)")
			.attr("x", -180)
			.attr("y", -110);

	}

	mapTool.updateGraph = function (id, route) {
		// Update circle size. TODO: move
		g.selectAll("circle")
			.transition()
			.attr("r", 2);
		g.selectAll("circle.route_" + id)
			.transition()
			.attr("r", 5);

		var graphData = {};
		g2 = d3.select("#chart")
			.append("g")
                var stops = objSort(route.stops);
		var stop_scale = mapTool.stopScale(stops);
		var income_scale = mapTool.incomeScale(stops);
		$.each(stops, function(key, de) {
			var data = mapTool.getCensusData(de.stop_lat, de.stop_lon, de.stop_name);
			data.done(function(result) {
				var graphData = {name: de.stop_name, data: result[1][0], color: de.route_color};
				options.chart.append("circle")
					.datum(graphData)
					.transition()
					.attr("r", 4)
					.style("fill", function(d) {return '#' + d.color; })
					.attr("cx", function(d) {return stop_scale(key + 1)})
					.attr("cy", function(d) {return options.income_scale(d.data)});
				// TODO: Save data in array and check if data is already called. Check stop_scale to see longest # of stops to change dimension of graph
				// TODO: change income scale
			});

		});

	}
})();
