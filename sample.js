const AranLive = require("./live");
const aranlive = AranLive({
  binary: (operator, left, right, serial) => {
    const result = eval("left "+operator+" right");
    console.log(left+" "+operator+" "+right+" = "+result);
    return result;
  }
});
global.eval(aranlive.instrument("'Hello' + 'World' + '!'"));