function fac (x) {
  if (x === 0)
    return 1;
  return x * fac(x - 1);
}
console.log(fac(6));