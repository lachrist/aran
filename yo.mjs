// file:///Users/lachrist/Desktop/workspace/aran/test262/test/language/module-code/verify-dfs.js
let _ARAN_ESCAPE_exp_foo;
export { _ARAN_ESCAPE_exp_foo as foo };
import "./yoyo.mjs";
{
  let _ARAN_ESCAPE_var_original_foo = "deadzone";
  _ARAN_ESCAPE_var_original_foo = 123;
  _ARAN_ESCAPE_exp_foo = _ARAN_ESCAPE_var_original_foo;
}
