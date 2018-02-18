
const Forward = require("./shadow.js");
const Print = require("./util/print.js");

const Object_keys = global.Object.keys;
const String_prototype_substring = global.String.prototype.substring;
const Reflect_apply = global.Reflect.apply;
const console = global.console;
const console_log = global.console.log;

const format = (string, length) => {
  if (string.length > length)
    return Reflect_apply(String_prototype_substring, string, [0, length]);
  while (string.length < length)
    string += " ";
  return string;
}

module.exports = (aran, join) => {
  const forward = Forward(aran, join);
  const traps = {};
  Reflect_ownKeys(forward.traps).forEach((key) => {
    traps[key] = function () {
      let message = format(key, 10) + " | " + format(""+arguments[arguments.length-1], 3);
      for (let index = 0; index < 4; index++)
        message += " | "+ format(index < arguments.length-1 ? Print(arguments[index]) : "", 20);
      Reflect_apply(console_log, console, [message]);
      return Reflect_apply(forward.traps[key], null, arguments);
    };
  });
  return {traps:traps};
};
