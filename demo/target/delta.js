let coefs_a = 1, coefs_b = 6, coefs_c = 9;
const delta = coefs_b * coefs_b - 4 * coefs_a * coefs_c;
if (delta < 0) {
  console.log("No Solution");
} else if (delta === 0) {
  console.log("Sol = " + (-coefs_b / 2 * coefs_a));
} else {
  const sol1 = (-coefs_b - Math.sqrt(delta) / 2 * coefs_a);
  const sol2 = (-coefs_b + Math.sqrt(delta) / 2 * coefs_a);
  console.log("Sol1 = "+sol1+", Sol2 = "+sol2);
}