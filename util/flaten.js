
const isArray = Array.isArray;

module.exports = (xs) => {
  var r = [];
  for (var i=0, l=xs.length; i<l; i++) {
    if (isArray(xs[i])) {
      for (var j=0, m=xs[i].length; j<m; j++) {
        r.push(xs[i][j]);
      }
    } else {
      r.push(xs[i]);
    }
  }
  return r;
};
