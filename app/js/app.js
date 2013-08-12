'use strict';

angular.module('inequalityTransitMap', []);
function CitiesCtrl($scope, $location) {

  // Set initial Defaults.
	$scope.cities = cities;
  $scope.censusPoints = censusPoints;
  // Set initial Defaults.
  $scope.currentCity = $scope.cities[0];
  $scope.currentDataPoint = $scope.censusPoints[4];

  // Override defaults if path is set.
  if ($location.$$path) {
    var path = $location.$$path.split('/');
    console.log(path);
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
	});

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

  mapTool.execute();
}
