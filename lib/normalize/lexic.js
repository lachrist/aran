
exports.CreateProgram = (cache) => ({
  __proto__: null,
  Tag: "program",
  Last: true,
  CompletionCache: cache,
  SwitchDiscriminantCache: null,
  SwitchMatchedCache: null
});

exports.CreateFunction = () => ({
  __proto__: null,
  Last: null,
  Tag: "function",
  CompletionCache: null,
  SwitchDiscriminantCache: null,
  SwitchMatchedCache: null
});

exports.CreateArrow = () => ({
  __proto__: null,
  Last: null,
  Tag: "arrow",
  CompletionCache: null,
  SwitchDiscriminantCache: null,
  SwitchMatchedCache: null
});

exports.GetCompletionCache = (lexic) => lexic.CompletionCache;

exports.IsFunction = (lexic) => lexic.Tag === "function";

exports.SetSwitch = (lexic, cache1, cache2) => ({
  __proto__: lexic,
  SwitchDiscriminantCache: cache1,
  SwitchMatchedCache: cache2});

exports.GetSwitchDiscriminantCache = (lexic) => lexic.SwitchDiscriminantCache;

exports.GetSwitchMatchedCache = (lexic) => lexic.SwitchMatchedCache;

exports.FlipLast = (lexic) => {
  if (lexic.Last === null) {
    throw new global_Error("Cannot flip last field");
  }
  return {
    __proto__: lexic,
    Last: !lexic.Last
  };
};

exports.IsLast = (lexic) => {
  if (lexic.Last === null) {
    throw new global_Error("Cannot flip last field");
  }
  return lexic.Last;
};
