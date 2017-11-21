function fibo (n) {
  if (n < 2)
    return n;
  var fibo1 = fibo(n-1);
  var fibo2 = fibo(n-2);
  return fibo1 + fibo2;
}
fibo(6);