import { runInThisContext } from "vm";

runInThisContext(`
  const getF = () => f;
  console.log({ f, ff: getF() });
  {
    console.log({ f, ff: getF() });
    function* f () {}
    console.log({ f, ff: getF() });
  }
  console.log({ f, ff: getF() });
`);
