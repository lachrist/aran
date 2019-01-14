function fac (n) {
  if (n === 0)
    return 1;
  return n * fac(n - 1);
}
console.log("6! is "+fac(6));
