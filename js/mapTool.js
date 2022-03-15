(function() {

	// The component's main object
	mapTool = {};

	mapTool.settings = {
		zoom: 5,
		censusToken: 'b9492c584d1fe26d8727d2e96a84e0689a827cf6',
		mapDiv: "",
		currentDataPoint: "",
		dataPath: "",
		currentRoute: "",
		containerDimensions: {width: 500, height: 400},
		chartMargins: {top: 20, right: 20, bottom: 30, left: 110, buffer: 20},
	}

	mapTool.init = function(settings) {
		// Options.
		options = $.extend(mapTool.settings, settings);

		var map = mapTool.createMap(options.lat, options.lon);
		options.map = map;
		$("g").remove();
		var svg = d3.select("#map").select("svg"),
			g = svg.append("g");
		options.g = g;
		return map;
	}

	mapTool.update = function(updates) {
		options = $.extend(options, updates);  
	}

	mapTool.execute = function() {
		d3.csv(options.dataPath, function(error, stops_data) {
			if (!options.currentRoute) {
				mapTool.addMapPoints(stops_data);
				mapTool.centerMap();
				mapTool.mapPointsHover();
			}			
			mapTool.addRoutes(stops_data);
		});
	}

	mapTool.centerMap = function() {
		options.map.panTo(new L.LatLng(options.lat, options.lon));
		// TODO: Fit to bounds.
		return map;
	}

	mapTool.createMap = function(lat, lon, cloudmade) {
		L.mapbox.accessToken = 'pk.eyJ1IjoiYWNvdWNoMSIsImEiOiJDTy0zMFJrIn0.hewU0mOW08Wm5-0-Qr8TpQ';
		var map = L.mapbox.map('map')
				.setView([lat, lon], options.zoom)
				.addLayer(L.mapbox.styleLayer('mapbox://styles/acouch1/cl0n771pp002415r041gj0d8p'));
		L.svg().addTo(map);

		return map;
	}

	mapTool.addMapPoints = function(stops_data) {

		var feature = options.g.selectAll("circles.points")
			.data(stops_data)
			.enter()
			.append("circle")
			.attr("r", 5)
			.attr("class", function(d) { return "route_" + d.route_id;})
			.attr("stop_id", function(d) { return d.stop_id;})
			.attr("data", function(d) { return d.data;})
			.attr("cx",function(d) { latLon = new L.LatLng(d.stop_lat, d.stop_lon); return options.map.latLngToLayerPoint(latLon).x})
			.attr("cy",function(d) { latLon = new L.LatLng(d.stop_lat, d.stop_lon); return options.map.latLngToLayerPoint(latLon).y})
			.attr("style", function(d) { return "fill: #" + d.route_color; });

		options.map.on("zoom", attach);

		function attach() {
			feature.attr("cx",function(d) { latLon = new L.LatLng(d.stop_lat, d.stop_lon); return options.map.latLngToLayerPoint(latLon).x})
			feature.attr("cy",function(d) { latLon = new L.LatLng(d.stop_lat, d.stop_lon); return options.map.latLngToLayerPoint(latLon).y})
		}
		attach();
	}

	mapTool.getCensusData = function(lat, lon, stopName) {
		var fccUrl = "https://geo.fcc.gov/api/census/block/find?format=json&latitude=" + lat + "&longitude=" + lon + "&censusYear=2010";
		var fccPromise = $.ajax({
		    type: 'GET',
		    url: fccUrl,
		    dataType: 'json',
		    data: {},
		    async: true,
		});
		var dff = $.Deferred();
		fccPromise.then(function(results) {
			var FIPS = results.Block.FIPS;
			var stateFip = FIPS.substring(0,2);
			var countyFip = FIPS.substring(2,5);
			var tractFip = FIPS.substring(5,11);
      var profile = options.currentDataPoint.value.slice(0,1) == 'D' ? '/profile' : '';
			var censusUrl = 'https://api.census.gov/data/2019/acs/acs5' + profile + '?get=' + options.currentDataPoint.value + '&for=tract:' + tractFip + '&in=state:' + stateFip + ' county:' + countyFip + '&key=' + options.censusToken;
			var censusPromise = $.ajax({
				type: 'GET',
				url: censusUrl,
				dataType: 'json',
				data: {},
				async: true,
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
		g.selectAll("circle")
			.on("mouseover", function(d) {
				g.selectAll("circle").attr("class", "");
				d3.select(this)
					.transition()
					.delay(250)
					.attr("class", 'active');

				var bound = this.getBoundingClientRect();
				var offset = bound.width;
				var scrollTop = (window.pageYOffset !== undefined) ? window.pageYOffset : (document.documentElement || document.body.parentNode || document.body).scrollTop
				var top = bound.top + scrollTop - 11;
				d3.select("#tooltip")
					.style("left", (bound.left) + offset + "px")
					.style("top", (top) + "px")
					.style("display", "block")
					.html('<div class="popover fade right in"><div class="arrow"></div><h3 class="popover-title">' + d.route_short_name + ': ' + d.stop_name + '</h3><button onclick="this.parentNode.parentNode.style.display = \'none\';" type="button" class="close" data-dismiss="modal" aria-hidden="true">×</button><div class="popover-content"><p><span class="glyphicon glyphicon-refresh"></span>  loading...</div></div>');

					var data = mapTool.getCensusData(d.stop_lat, d.stop_lon);
					data.done(function(data) {
						var res = data ? format(data[1][0], options.currentDataPoint.type) : "No data";
						d3.select("#tooltip")
							.style("left", (bound.left) + offset + "px")
							.style("top", top + "px")
							.style("display", "block")
							// This is lazy and bad. TODO: fix.
							.html('<div class="popover fade right in"><div class="arrow"></div><h3 class="popover-title">' + d.route_short_name + ': ' + d.stop_name + '</h3><button onclick="this.parentNode.parentNode.style.display = \'none\';" type="button" class="close" data-dismiss="modal" aria-hidden="true">×</button><div class="popover-content"><p>' + options.currentDataPoint.name + ': <strong>' + res + '</strong></div></div>');
					});
		});
		$("button").click(function(){
			$(this).hide();
		});

	}

	mapTool.addRoutes = function(stops_data) {
		var routes = {};
		// Get the lines.
		$.each(stops_data, function(key, value) {
			if ( Object.prototype.toString.call( routes[value.route_id] ) === '[object Object]' ) {
				routes[value.route_id].stops[value.stop_id] = value;
			} else {
				routes[value.route_id] = {id: value.route_id, name: value.route_short_name, color: value.route_color, stops: {}};
				routes[value.route_id].stops[value.stop_id] = value;
			}
		});
		// Add routes to DOM.
    	scope = angular.element($('#CitiesCtrl-div')).scope();
    	scope.$apply(function() {
				scope.routes = routes;
    	});
    	// 
    	if (options.currentRoute) {
    		$("#" + options.currentRoute).addClass('active');
    		$('#graph').empty();
				$('#graph').append('<span class="glyphicon glyphicon-refresh"></span> Loading...');
				$('#map').append('<div id="map-load"><span class="glyphicon glyphicon-refresh"></span> Loading...</div>');

    		var stops = objSort(routes[options.currentRoute].stops);
				var graphPromise = mapTool.getStopsData(stops);
				graphPromise.then(function(results) {
					mapTool.activateRoute(options.currentRoute, routes[options.currentRoute], results, stops_data);
					mapTool.updateGraph(routes[options.currentRoute], results, stops);
					mapTool.updatePointSize(options.currentRoute, results);
					mapTool.mapPointsHover();
					$("#map-load").hide();
				});
			}
	}

	mapTool.updatePointSize = function(route, results) {
		var pointsScale = d3.scale.linear()
			.range([3, 12])
			.domain([0, results.highest]);
		var circleClass = '.route_' + route;

		$(circleClass).each(function() {
			var data = $(this).attr('data');
			if (data) {
			  var size = pointsScale (data);
			}
			else {
				var size = 3;
			}

			$(this).attr('r', size);
		});
	}

	mapTool.activateRoute = function(id, route, results, stops_data) {
		
	    var route_data = [];
	   	var i = 0;
		Object.keys(stops_data).forEach(function(key) {
			if (stops_data[key].route_id == route.id) {
				route_data[i] = stops_data[key];
				i++;
			}
		});
		mapTool.addMapPoints(route_data);
		

		var arrayOfLatLons = [];
		var x = 0;
		$.each(route.stops, function(key, value) {
			arrayOfLatLons[x] = [value.stop_lat, value.stop_lon];
			x++;
		});
		var bounds = new L.LatLngBounds(arrayOfLatLons);
		options.map.fitBounds(bounds);

		return;
	}

	mapTool.stopScale = function (stops) {
		var stopScale = d3.scale.linear()
			.range([0,options.chart_dimensions.width])
			.domain([1, stops.length]);
		return stopScale;
	}

	mapTool.incomeScale = function (highest) {
		var incomeScale = d3.scale.linear()
			.range([options.chart_dimensions.height, 0])
			.domain([0, highest]);
		return incomeScale;
	}

	mapTool.updateGraph = function (route, results, stops) {
		$('#graph').empty();
		options.chart_dimensions = { 
			width: options.containerDimensions.width - options.chartMargins.left - options.chartMargins.right,
			height: options.containerDimensions.height - options.chartMargins.top - options.chartMargins.bottom
  		};
		options.chart = d3.select("#graph")
			.append("svg")
			.attr("width", options.containerDimensions.width)
			.attr("height", options.containerDimensions.height)
			.append("g")
			.attr("transform", "translate(" + options.chartMargins.left + "," + options.chartMargins.top + ")")
			.attr("id","chart");

		// Create Y scale.
		options.income_scale = d3.scale.linear()
			.range([options.chart_dimensions.height, 0])
			.domain([0, results.highest]);
		// Create Y axis.
		options.income_axis = d3.svg.axis()
			.scale(options.income_scale)
			.orient("left")
			.tickPadding(5);
		// Add Y axis.
		options.chart.append("g")
			.attr("class", "y axis")
			.call(options.income_axis);
		// Add Y label.
		d3.select(".y.axis")
			.append("text")
			.attr("text-anchor","middle")
			.text(options.currentDataPoint.name)
			.attr("transform", "rotate (270, 0, 0)")
			.attr("class", "title")
			.attr("x", -180)
			.attr("y", -90);

		// Create X scale.
		options.stopScale = d3.scale.ordinal()
			.rangeBands([0, options.chart_dimensions.width])
			.domain(stops.map(function(d) { return d.stop_name; }));

 		// Create x axis.
		options.stop_axis = d3.svg.axis()
			.scale(options.stopScale)
			.orient('bottom');

		options.chart.append("g")
			.attr("class", "x axis")
			.attr({
				"transform": "translate(0," + options.chart_dimensions.height + ")",
			})
			.call(options.stop_axis);

		options.chart.selectAll(".x.axis text")
			.attr({
      			style: {"text-anchor": "initial"},
					transform: function (d) {
					return "rotate(-90, -10, 5)";
				}
			});
		// Add bars.
		options.chart.selectAll(".bar")
			.data(stops)
			.enter().append("rect")
			.attr("class", "bar")
			.attr("x", function(d) { return options.stopScale(d.stop_name) + ((options.chart_dimensions.width/stops.length)*.25)/2})
			.attr("y", function(d) { return options.income_scale(d.data);})
			.style("fill", function(d) {return '#' + d.route_color; })
			.style("opacity", ".5")
			.attr("width", (options.chart_dimensions.width/stops.length)*.75)
			.attr("height", function(d) { return options.chart_dimensions.height - options.income_scale(d.data)});

		// Add circles.
		$.each(stops, function(key, de) {
			var graphData = {name: de.stop_name, data: de.data, color: de.route_color};
			options.chart.append("circle")
				.datum(graphData)
				.transition()
				.attr("r", 5)
				.style("fill", function(d) {return '#' + d.color; })
				.attr("cx", function(d) {return options.stopScale(key) + ((options.chart_dimensions.width/stops.length)/2)})
				.attr("cy", function(d) {return options.income_scale(d.data)});
			});
	}

  	mapTool.getStopsData = function(stops) {
		var highest = "";
		var total = 0;
		var deferred = new $.Deferred();
		$.each(stops, function(key, de) {
			var data = mapTool.getCensusData(de.stop_lat, de.stop_lon, de.stop_name);
			data.done(function(result) {
				let data = 0;
				if (result) {
					data = result[1][0];
				}
				stops[key].data = data;
				// Could use d3.max at the end but we have to loop through data anyway.
				if (highest < parseFloat(data)) {
					highest = data;
				}
				total = total + 1
				if (stops.length == total) {
					deferred.resolve({stops: stops, highest: highest});
				}
			});
		});
    	return deferred.promise();
  	}

})();
