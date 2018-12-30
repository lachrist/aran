let depth = "";
exports.apply = (f, t, xs, serial) => {
  console.log(depth + f.name + "(" + xs.join(", ") + ")");
  depth += ".";
  const x = Reflect.apply(f, t, xs);
  depth = depth.substring(1);
  console.log(depth + x);
  return x;
};
