(function () {
  this.__hidden__ = {};
  __hidden__.apply = function (f, t, xs) {
    console.log("Apply " + f.name);
    return f.apply(t, xs);
  };
} ());
__hidden__.__eval__=__hidden__.__eval__||eval;__hidden__.__apply__=__hidden__.__apply__||function(f,t,xs){return f.apply(t,xs)};__hidden__.__defineProperties__=__hidden__.__defineProperties__||Object.defineProperties;(delta=function delta(a,b,c){return ((b * b) - ((4 * a) * c));});(solve=function solve(a,b,c){var __hidden__1,__hidden__2;var s1=((-(b) + __hidden__.apply((__hidden__1=Math).sqrt,__hidden__1,[__hidden__.apply(delta,void 0,[a,b,c],21)],19)) / (2 * a));var s2=((-(b) - __hidden__.apply((__hidden__2=Math).sqrt,__hidden__2,[__hidden__.apply(delta,void 0,[a,b,c],36)],34)) / (2 * a));return [s1,s2];});var delta;var solve;__hidden__.apply(solve,void 0,[1,-(5),6],49);