
const global_Reflect_defineProperty = global.Reflect.defineProperty;

exports.Create = (cache) => ({
  __proto__: null,
  "@completion": cache,
  "@last": true
});

exports.IsLast = (lexic) = lexic["@last"];

exports.GetCompletion = (lexic) => lexic["@completion"];

exports.IsPromoted = (lexic, label) => lexic[label].promoted;

exports.BeforeLabel = (lexic, label) => (
  lexic["@completion"] === null ?
  lexic :
  (
    lexic["@last"] !== lexic[label === null ? "@loop" : label].last ?
    {
      __proto__: lexic,
      "@last": lexic[label == null ? "@loop" : label].last} :
    lexic));

exports.NotLast = (lexic) => (
  lexic["@last"] ?
  {
    __proto__: lexic,
    "@last": false} :
  lexic);

exports.Extend = (lexic, labels, boolean1, boolean2) => {
  lexic = {__proto__:lexic};
  const descriptor = {
    __proto__: null,
    writable: true,
    enumerable: true,
    configurable: true,
    value: {
      __proto__: null,
      last: boolean1,
      promoted: boolean2
    }
  };
  for (let index = 0; index < labels.length; index++) {
    global_Reflect_defineProperty(lexic, labels[index] === null ? "@loop" : labels[index], descriptor);
  }
  return lexic;
};
