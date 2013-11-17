'use strict';

angular.module('inequalityTransitMap', []);
function CitiesCtrl($scope, $location) {

	// Set initial Defaults.
	$scope.cities = cities;
	$scope.censusPoints = censusPoints;
	$scope.currentCity = $scope.cities[0];
	$scope.currentDataPoint = $scope.censusPoints[4];
  var width = $(window).width() - 50;
  $('#map').width(width);
  $('#graph').width(width);

	// Override defaults if path is set.
	if ($location.$$path) {
		var path = $location.$$path.split('/');
		var cityKey = getKey($scope.cities, path[1]);
		var censusKey = getKey(censusPoints, path[2]);
		$scope.currentCity = $scope.cities[cityKey];
		$scope.currentDataPoint = $scope.censusPoints[censusKey];
	}

	var map = mapTool.init({
		lat: $scope.currentCity.lat,
		lon: $scope.currentCity.lon,
		zoom: $scope.currentCity.zoom,
		dataPath:  $scope.currentCity.dataPath,
		currentDataPoint: $scope.currentDataPoint,
		containerDimensions: {width: width, height: 500},
// TODO: currentRoutes
	});
  
  $scope.routeAdd = function(route) {
    $("#" + route.id).addClass('active');
		$location.path('/' + $scope.currentCity.value + '/' + $scope.currentDataPoint.value + '/' + route.id);
			mapTool.activateRoute(route);
			mapTool.updateGraph(route.id, route);
  }

	mapTool.execute();

	// Respond to change in city or data point.
	$scope.dataSelect = function() {
		$location.path('/' + $scope.currentCity.value + '/' + $scope.currentDataPoint.value);
		mapTool.update({
			lat: $scope.currentCity.lat,
			lon: $scope.currentCity.lon,
			zoom: $scope.currentCity.zoom,
			dataPath:  $scope.currentCity.dataPath,
			currentDataPoint: $scope.currentDataPoint,
		});
		mapTool.execute();
	};

}
// TODO:
// GRAPH:
// - break out income, demo, eth
// - demo
// - - female vs male
// - - age total
// - - age per gender
// - x axis markers
// - tooltips
// MAP:
// - size of dot based off relative size of result
// - remove other dots 
// TOOLTIP:
// - show graph highlighted
// STOP:
// - click through to map, graphs for income, demo, eth
