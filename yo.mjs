import { runInThisContext } from "node:vm";

runInThisContext(`

{

var result;
var vals = [];

result = [ unresolvable ] = vals;



console.log(result, vals);

}

console.log(unresolvable, undefined);


`);

var eval = 123;
