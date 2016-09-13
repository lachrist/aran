(function () {
  this._meta_ = {};
  _meta_.apply = function (f, t, xs) {
    console.log("Apply "+f.name);
    return f.apply(t, xs);
  };
} ());
_meta_.__global__=_meta_.__global__||(function () { return this } ());_meta_.__eval__=_meta_.__eval__||eval;_meta_.__apply__=_meta_.__apply__||(typeof Reflect === 'object' ? Reflect.apply : function(f,t,xs){return f.apply(t,xs)});_meta_.__defineProperty__=_meta_.__defineProperty__||Object.defineProperty;(delta=function delta(a,b,c){ return ((b * b) - ((4 * a) * c)); return void 0});(solve=function solve(a,b,c){var _meta_1,_meta_2;var s1;(s1=((-(b) + _meta_.apply((_meta_1=Math)["sqrt"],_meta_1,[_meta_.apply(delta,null,[a,b,c],21)],19)) / (2 * a)));;var s2;(s2=((-(b) - _meta_.apply((_meta_2=Math)["sqrt"],_meta_2,[_meta_.apply(delta,null,[a,b,c],36)],34)) / (2 * a)));; return [s1,s2]; return void 0});void 0;var delta;var solve;_meta_.apply(solve,null,[1,-(5),6],49);