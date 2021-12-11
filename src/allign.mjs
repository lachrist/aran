const Fs = require("fs");
const Os = require("os");
const Path = require("path");
const ChildProcess = require("child_process");
const Chalk = require("chalk");
const Diff = require("diff");

exports.match = (node1, node2, callback, _result, _message) => (
  (_result = allign_all("root", flaten(node1), flaten(node2))),
  (_message = Result.getErrorMessage(_result)),
  _message === null
    ? callback(true, _result)
    : (require("fs").writeFileSync(
        require("path").join(__dirname, "..", "..", "..", "tmp-1.js"),
        Generate.generate(node1),
        "utf8",
      ),
      require("fs").writeFileSync(
        require("path").join(__dirname, "..", "..", "..", "tmp-2.js"),
        Generate.generate(node2),
        "utf8",
      ),
      callback(
        false,
        _message +
          "\n" +
          ArrayLite.join(
            ArrayLite.map(
              Diff.diffWords(
                Generate.generate(node1),
                Generate.generate(node2),
              ),
              (part) => Chalk[colorize(part.added, part.removed)](part.value),
            ),
            "",
          ),
      ))
);


// (success, result) =>
//   success,
//   (
//     success ?
//     null :
//   if (success) {
//     return callback(true, result); }
//   return callback(
//     false
//   diff(Generate.generate(node1), Generate.generate(node2));
//   let path1;
//   let path2;
//   try {
//     path1 = get_tmp_path();
//     path2 = get_tmp_path();
//     Fs.writeFileSync(path1, Generate.generate(node1), "utf8");
//     Fs.writeFileSync(path2, Generate.generate(node2), "utf8");
//     diff(Generate.generate(node1), Generate.generate(node2));
//     // `pr -m -t -w ${process.stdout.columns} ${path1} ${path2}`
//     // `paste ${path1} ${path2} | expand -t ${global_Math_floor(process.stdout.columns / 2)}`
//     // `diff --side-by-side --with=${process.stdout.columns} ${path1} ${path2}`
//     return callback(
//       false,
//       (
//         result +
//         "\n" +
//         ChildProcess.execSync(
//           `pr -m -t -w ${process.stdout.columns} ${path1} ${path2}`,
//           {
//             __proto__: null,
//             encoding: "utf8"}))); }
//   finally {
//     unlink(path1);
//     unlink(path2); } });

// const diff = (code1, code2, _colorize) => ArrayLite.join(
//   ArrayLite.map(
//     Diff.diffWords(code1, code2),
//     (part) => Chalk[colorize(part.added, part.removed)](part.value)),
//   "");
const global_Object_assign = global.Object.assign;
const global_String = global.String;
const global_JSON_stringify = global.JSON.stringify;
const global_Math_floor = global.Math.floor;
const global_Math_random = global.Math.random;
const global_Date_now = global.Date.now;
const global_Reflect_apply = global.Reflect.apply;
const global_console_error = global.console.error;
const global_console = global.console;

// const get_tmp_path = () => Path.join(
//   Os.tmpdir(),
//   `aran-match-${global_Date_now()}-${global_Math_floor(10e10 * global_Math_random())}`);
//
// const unlink = (path) => {
//   try {
//     Fs.unlinkSync(path); }
//   catch (error) {
//     /* istanbul ignore next */
//     global_Reflect_apply(global_console_error, global_console, [error]); } };

const colorize = (added, removed) => {
  if (added) {
    return "green";
  }
  if (removed) {
    return "red";
  }
  return "grey";
};


export * from "./parse.mjs";
export * from "./generate.mjs";
export * from "./ast/index.mjs";
