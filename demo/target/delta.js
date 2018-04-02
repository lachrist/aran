let a = 1, b = 6, c = 9;
const delta = b * b - 4 * a * c;
if (delta < 0) {
  console.log("No Solution");
} else if (delta === 0) {
  console.log("Sol = " + (-b / 2 * a));
} else {
  const sol1 = (-b - Math.sqrt(delta) / 2 * a);
  const sol2 = (-b + Math.sqrt(delta) / 2 * a);
  console.log("Sol1 = "+sol1+", Sol2 = "+sol2);
}