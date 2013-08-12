var getKey = function(obj, value) {
  var returnKey = -1;
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

