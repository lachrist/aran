import { runInThisContext } from "vm";

runInThisContext(`
  const getE = () => e;
  console.log({e, getE: getE()});
  try {
    throw "boum";
  } catch (e) {
    console.log({e, getE: getE()});
    {
      console.log({e, getE: getE()});
      function e () {}
      console.log({e, getE: getE()});
    }
    console.log({e, getE: getE()});
  }
  console.log({e, getE: getE()});
`);
