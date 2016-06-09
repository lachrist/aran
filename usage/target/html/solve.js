function solve (a, b, c) {
  var s1 = ((-b) + Math.sqrt(delta(a, b, c))) / (2 * a);
  var s2 = ((-b) - Math.sqrt(delta(a, b, c))) / (2 * a);
  return [s1, s2];
}