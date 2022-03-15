var getKey = function(obj, value) {
  var returnKey = false;
  $.each(obj, function(key, info) {
    if (info.value == value) {
      returnKey = key;
      return false; 
    };   
  });
  return returnKey;       
}

// ht: http://stackoverflow.com/a/12947816
var val = function commaSeparateNumber(val){
  while (/(\d+)(\d{3})/.test(val.toString())){
    returnVal = val.toString().replace(/(\d+)(\d{3})/, '$1'+','+'$2');
  }
  return returnVal;
}

function sortByKey(array, key) {
    return array.sort(function(a, b) {
        var x = a[key]; var y = b[key];
        return ((x < y) ? -1 : ((x > y) ? 1 : 0));
    });
}

var objSort = function(object, param) {
	var newObj = {};
	var index = [];
	var sorted = [];
	for (var key in object) {

		// build the index
		for (var x in object) {
		   index.push({ key: x, 'stop_sequence': object[x]['stop_sequence'] });
		}

		// sort the index
		index.sort(function (a, b) { 
		   var as = parseInt(a['stop_sequence']), 
		       bs = parseInt(b['stop_sequence']); 

		   return as == bs ? 0 : (as > bs ? 1 : -1); 
		}); 

	}
	for (var i = 0; i < index.length; i++) {
		if (!Object.prototype.hasOwnProperty.call(newObj, index[i]['key'])) {
			sorted.push(object[index[i]['key']]);
			newObj[index[i]['key']] = 1;
		}
	}
	return sorted;

};
var currency = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});
var num = new Intl.NumberFormat('en-US');

var format = function(number, type) {
  if (type == 'currency') {
    return currency.format(number);
  }
  else if (type == 'time') {
    return num.format(number/60) + ' minutes';
  }
  return num.format(number);
}

