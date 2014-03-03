'use strict';

var TransitVizApp = angular.module('inequalityTransitMap', ['ngRoute', 'transitVizControllers']);

TransitVizApp.config(['$routeProvider',
  function($routeProvider) {
    $routeProvider.
      when('/routes/:cityId/:censusId/:routeId', {
				templateUrl: 'partials/viz.html',
        controller: 'CitiesCtrl'
      }).when('/routes/:cityId/:censusId', {
				templateUrl: 'partials/viz.html',
        controller: 'CitiesCtrl'
      }).when('/about', {
				templateUrl: 'partials/page.html',
        controller: 'AboutCtrl'
      }).otherwise({
				templateUrl: 'partials/viz.html',
        controller: 'CitiesCtrl'
      });;
  }]);

transitVizControllers.controller('AboutCtrl', ['$scope', 
  function($scope) {
		$('.page-body').text('This is a thing.');
  }]);

transitVizControllers.controller('CitiesCtrl', ['$scope', 'Project','$location', '$routeParams', 
  function($scope, Project, $location, $routeParams) {
  	$('.nav-tabs a').click(function(e) {
		$("#tooltip").hide();
		e.preventDefault();
	});
    console.log(Project);
	//Project.saveOrUpdate('testsavecb', 'testupdatecb', 'errorSave', 'errorUpdate');
	$scope.projects = Project.query();

	// Set initial Defaults.
	$scope.cities = cities;
	$scope.censusPoints = censusPoints;
	$scope.currentCity = $scope.cities[0];
	$scope.currentDataPoint = $scope.censusPoints[2];
	var width = $(".col-md-10").width() - 50;
    
	// Override defaults if path is set.
    if ($routeParams.cityId) {
		var cityKey = getKey($scope.cities, $routeParams.cityId);
		$scope.currentCity = $scope.cities[cityKey];
		var censusKey = getKey($scope.censusPoints, $routeParams.censusId);
		$scope.currentDataPoint = $scope.censusPoints[censusKey];
    }
    if ($routeParams.routeId) {
		$scope.currentRoute = $routeParams.routeId;
    }
	else {
		$scope.currentRoute = "";
    }

	var map = mapTool.init({
		lat: $scope.currentCity.lat,
		lon: $scope.currentCity.lon,
		zoom: $scope.currentCity.zoom,
		dataPath:  $scope.currentCity.dataPath,
		currentDataPoint: $scope.currentDataPoint,
		containerDimensions: {width: width, height: 500},
		currentRoute: $scope.currentRoute,
	});
		
	$scope.routeAdd = function(route) {
		$location.path('/routes/' + $scope.currentCity.value + '/' + $scope.currentDataPoint.value + '/' + route.id);
	}

	mapTool.execute();

	// Respond to change in city or data point.
	$scope.dataSelect = function() {
		$location.path('/routes/' + $scope.currentCity.value + '/' + $scope.currentDataPoint.value);
		mapTool.update({
			lat: $scope.currentCity.lat,
			lon: $scope.currentCity.lon,
			zoom: $scope.currentCity.zoom,
			dataPath:  $scope.currentCity.dataPath,
			currentDataPoint: $scope.currentDataPoint,
		});
		mapTool.execute();
	};
  }]);

function CitiesCtrl($scope, $location) {

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
