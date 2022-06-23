import "./index.mjs";

// import {
//   declareMeta,
//   declareMetaMacro,
//   makeMetaReadExpression,
//   makeMetaWriteEffect,
//   declareSpecMacro,
//   declareSpecIllegal,
//   declareSpec,
//   makeSpecInitializeStatementArray,
//   makeSpecReadExpression,
//   declareBaseImport,
//   declareBase,
//   makeBaseInitializeStatementArray,
//   makeBaseReadExpression,
//   makeBaseTypeofExpression,
//   makeBaseDiscardExpression,
//   makeBaseMacroWriteEffect,
//   makeBaseWriteEffect,
//   makeScopeDynamicClosureBlock,
//   makeScopeWithBlock,
//   makeScopeExternalLocalEvalProgram,
//   makeScopeScriptProgram,
//   makeScopeModuleProgram,
//   makeScopeGlobalEvalProgram,
//   makeScopeBlock,
//   makeScopeDistantBlock,
//   makeScopeDeadBlock,
//   makeScopeEmptyBlock,
//   makeScopeStaticClosureBlock,
//   makeScopeClosureExpression,
//   makeScopeInternalLocalEvalProgram,
// } from "./index.mjs";

////////////
// Script //
////////////

allignProgram(
  createScopeScriptProgram(
    {strict: true, enclave: true, counter: createCounter(0)},
    (scope) => {
      const variable1 = declareMeta();
      const variable2 = declareMetaMacro();
      declareSpec();
      declareSpecMacro();
      return [];
    },
  ),
);
