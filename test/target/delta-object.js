const delta = (a, b, c) => b * b - 4 * a * c;
const solve = ({a, b, c}) => {
  const d = delta(a, b, c);
  if (d < 0)
    return [];
  if (d === 0)
    return [(-b) / (2 * a)];
  return [
    (-b - Math.sqrt(d)) / (2 * a),
    (-b + Math.sqrt(d)) / (2 * a)
  ];
};
console.log("Sols: "+solve({a:1, b:6, c:9}));