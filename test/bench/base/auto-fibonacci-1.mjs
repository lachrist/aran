import { main } from "./auto.mjs";
const code = `
  const fibo = (n) => {
    if (n <= 1) return n;
    return fibo(n - 1) + fibo(n - 2);
  }
`;
await main(code, "module", 1);
