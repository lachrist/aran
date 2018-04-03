function solve (coefs) {
  const delta = coefs.b * coefs.b - 4 * coefs.a * coefs.c;
  if (delta < 0)
    return [];
  if (delta === 0)
    return [(-coefs.b) / (2 * coefs.a)];
  return [
    (-coefs.b - Math.sqrt(delta)) / (2 * coefs.a),
    (-coefs.b + Math.sqrt(delta)) / (2 * coefs.a)
  ];
}

const sols = solve({a:1, b:6, c:9});
if (sols.length === 0)
  console.log("No Solution");
else if (sols.length === 1)
  console.log("Sol = " + sols[0]);
else
  console.log("Sol1 = "+sols[0]+", Sol2 = "+sols[1]);