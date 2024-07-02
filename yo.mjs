global.eval(`
  (function ([f]) {
    console.log({f}); // { f: 123 }
    {
      console.log({f}); // { f: [Function: f] }
      function f () {}
      console.log({f}); // { f: [Function: f] }
    }
    console.log({f}); // { f: 123 }
  } ([123]));
`);
