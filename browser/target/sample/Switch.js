
(function () {
  var i=0
  switch (2) {
    case 1: throw 'Switch1';
    case 2: i++;
    default:
      i++;
      break;
    case 2: throw 'Switch2';
  }
  if(i !== 2) {throw 'Switch3' }
} ())
