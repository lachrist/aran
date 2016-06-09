function delta (a, b, c) { return  b * b - 4 * a * c }
function solve (a, b, c) {
  var s1 = ((-b) + Math.sqrt(delta(a, b, c))) / (2 * a);
  var s2 = ((-b) - Math.sqrt(delta(a, b, c))) / (2 * a);
  return [s1, s2];
}
solve(1, -5, 6);