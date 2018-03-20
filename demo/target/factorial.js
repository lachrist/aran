function fac (x) {
  if (x === 0)
    return 1;
  return x * fac(x - 1);
}
console.log("6! is "+fac(6));