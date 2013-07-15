'use strict';

// Declare app level module which depends on filters, and services
angular.module('inequalityTransitMap', ['myApp.filters', 'myApp.services', 'myApp.directives', 'myApp.controllers']);
function CitiesCtrl($scope, $location) {

  $scope.cities = cities;
  $scope.censusPoints = censusPoints;
  // Set initial Defaults.
  $scope.currentCity = $scope.cities[0];
  $scope.currentDataPoint = $scope.censusPoints[4];

  // Override defaults if path is set.
  if ($location.$$path) {
    var path = $location.$$path.split('/');
    var cityKey = getKey($scope.cities, path[1]);
    var censusKey = getKey($scope.censusPoints, path[2]);
    $scope.currentCity = $scope.cities[cityKey];
    $scope.currentDataPoint = $scope.censusPoints[censusKey];
  }

  var cloudmadeUrl = 'http://{s}.tile.cloudmade.com/3c140586b7e74d67b2a01a5fc9a51e7f/101965/256/{z}/{x}/{y}.png',
    cloudmadeAttribution = 'Map data &copy; 2011 OpenStreetMap contributors, Imagery &copy; 2011 CloudMade',
    cloudmade = new L.TileLayer(cloudmadeUrl, {maxZoom: 18, attribution: cloudmadeAttribution});

  var map = new L.Map('map', {
    center: new L.LatLng($scope.currentCity.lat, $scope.currentCity.lon), 
    zoom: $scope.currentCity.zoom, 
    layers: [cloudmade]
  });
          
  map._initPathRoot()    
  $scope.map = map

  $scope.dataSelect = function() {
    $location.path('/' + $scope.currentCity.value + '/' + $scope.currentDataPoint.value)
    buildViz($scope);
  };
  buildViz($scope);
}
