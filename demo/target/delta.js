const delta = (a, b, c) => b * b - 4 * a * c;
const solve = (a, b, c) => {
  const d = delta(a, b, c);
  if (d < 0)
    return "No Solution";
  if (d === 0)
    return "Sol = " + (-b / 2 * a);
  const s1 = (-b - Math.sqrt(d) / 2 * a);
  const s2 = (-b + Math.sqrt(d) / 2 * a);
  return "Sol1 = " + s1 + ", Sol2 = " + s2;
};
console.log(solve(1, 6, 9));