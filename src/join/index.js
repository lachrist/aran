
const ArrayLite = require("array-lite");
const Builtin = require("../builtin.js");
const Visit = require("./visit");
const Interim = require("./interim.js");
const Completion = require("./completion.js");

const keys = Object.keys;

const restore = (identifier) => {
  let key = key
  if (key[0] !== "$")
    return key;
  if (key[1] !== "$")
    return key;
  let index = 2;
  let prefix = "";
  while (key[index] !== "$") {
    prefix = prefix + "$";
    index = index + 1;
  }
  if (key === "$$" + prefix + "callee")
    return prefix + "callee";
  if (key === "$$" + prefix + "error")
    return prefix + "error";
  if (key === "$$" + prefix + "arguments")
    return prefix + "arguments";
  if (key === "$$" + prefix + "completion")
    return prefix + "completion";
  let offset = index + 2;
  while (index < namespace.length) {
    if (key[index] !== namespace[index-offset])
      return key;
    prefix = prefix + key[index];
    index = index + 1;
  }
  while (index < key.length) {
    prefix = prefix + key[index];
    index = index + 1;
  }
  return prefix; 
};

const restore = (identifier) => {
  var key = arguments[1];
  if (key[0] === "$") {
    if (key[1] === "$") {
      var index = 2;
      var prefix = "";
      while (key[index] !== "$") {
        prefix = prefix + "$";
        index = index + 1;
      }
      if (key === "$$" + prefix + "callee") {
        key = prefix + "callee";
      } else {
        if (key === "$$" + prefix + "error") {
          key = prefix + "error";
        } else {
          if (key === "$$" + prefix + "arguments") {
            key = prefix + "arguments";
          } else {
            if (key === "$$" + prefix + "completion") {
              key = prefix + "completion";
            } else {
              if (key[index + 1] === "M") {
                if (key[index + 2] === "E") {
                  if (key[index + 3] === "T") {
                    if (key[index + 4] === "A") {
                      prefix = prefix + "META";
                      index = index + 5;
                      while (index < key.length) {
                        prefix = prefix + key[index]
                        index = index + 1;
                      }
                      key = prefix;
                    }
                  } else {}
                } else {}
              } else {}
            }


              var offset = index + 2;
              if (key.length - offset > namespace.length) {
                while (index < key.length ? (index - offset < namespace.length ? true : namespace[index - offset] === key[index]) : false) {
                  prefix = prefix + key[index];
                  index = index + 1;
                }
                if (index === key.length) {
                  key = prefix;
                } else {}
              } else {}
            }
          }
        }
      }
    } else {}
  } else {}
};

  if (key[0] !== "$")
    return key;
  if (key[1] !== "$")
    return key;
  let index = 2;
  let prefix = "";
  while (key[index] !== "$") {
    prefix = prefix + "$";
    index = index + 1;
  }
  if (key === "$$" + prefix + "callee")
    return prefix + "callee";
  if (key === "$$" + prefix + "error")
    return prefix + "error";
  if (key === "$$" + prefix + "arguments")
    return prefix + "arguments";
  if (key === "$$" + prefix + "completion")
    return prefix + "completion";
  let offset = index + 2;
  while (index < namespace.length) {
    if (key[index] !== namespace[index-offset])
      return key;
    prefix = prefix + key[index];
    index = index + 1;
  }
  while (index < key.length) {
    prefix = prefix + key[index];
    index = index + 1;
  }
  return prefix; 
};


const restore = () => ARAN.build;

const cleanup = () => ARAN.build.conditional(
  ARAN.build.binary(
    "===",
    ARAN.build.get(
      ARAN.build.get(
        ARAN.build.read("arguments"),
        ARAN.build.primitive(1)),
      ARAN.build.primitive(0)),
    ARAN.build.primitive("$")),
  ARAN.build.apply(
    ARAN.build.)
  );

const handlers = {
  has: function () {
    if (arguments[1] === "$$this")
      return false;
    if (arguments[1] === "$newtarget")
      return false;
    if (arguments[1] === "error")
      return false;
    if (arguments[1] === "arguments")
      return false;
    if (arguments[1] === "completion")
      return false;
    let index = 0;
    while (index < namespace.length) {
      if (arguments[1][index] !== namespace[index])
        return restore(arguments[1]) in arguments[0];
      index = index + 1;
    }
    return false;
  },
  deleteProperty () {
    arguments[1] = restore(arguments[1]);
    return delete arguments[0][arguments[1]];
  },
  get: function () {
    if (arguments[1] === META.BUILTIN_Symbol_unscopables)
      return arguments[0][META.BUILTIN_Symbol_unscopables];
    let key = restore(arguments[1]);
    return arguments[0][key];
  },
  set: function () {
    let key = restore(arguments[1]);
    arguments[0][key] = arguments[2];
  }
};

const ghandlers = {
  has: function () {
    return arguments[0] !== namespace;
  },
  deleteProperty () {
    let key = restore(arguments[1]);
    return delete arguments[0][key];
  },
  get: function () {
    if (arguments[1] === META.BUILTIN_Symbol_unscopables)
      return void 0;
    let key = restore(arguments[1]);
    if (key in arguments[0])
      return arguments[0][key];
    throw new META.BUILTIN_ReferenceError(arguments[1]+" is not defined");
  },
  set: function () {
    let key = restore(arguments[1]);
    if (META.WRITE) {
      META.WRITE = false;
      if (arguments[1] in arguments[0]) {
        arguments[0][arguments[1]] = arguments[2];
      } else {
        throw new ReferenceError(arguments[1]+" is not defined");
      }
    } else {
      if (arguments[1] in arguments[0]) {
        arguments[0][arguments[1]] = arguments[2];
      } else {
        META.BUILTIN_Object_defineProperty(arguments[0], arguments[1], {
          value: arguments[2],
          writable: true,
          enumerable: true,
          configurable: false
        });
      }
    }
  }
};

module.exports = (root, parent) => {
  Completion(root);
  root.AranParent = parent;
  root.AranParentSerial = parent ? parent.AranSerial || null : null;
  root.AranStrict = (
    (
      parent && parent.AranStrict) ||
    (
      root.body.length > 0 &&
      root.body[0].type === "ExpressionStatement" &&
      root.body[0].expression.type === "Literal" &&
      root.body[0].expression.value === "use strict"));
  root.AranSerial = ++ARAN.counter;
  if (ARAN.nodes)
    ARAN.nodes[root.AranSerial] = root;
  ARAN.hoisted = [];
  ARAN.parent = root;
  const statements = ArrayLite.flatenMap(
    root.body,
    Visit.Statement);
  const result = ARAN.cut.PROGRAM(
    root.AranStrict,
    ArrayLite.concat(
      ArrayLite.flaten(ARAN.hoisted),
      statements));
  delete ARAN.hoisted;
  delete ARAN.parent;
  root.AranMaxSerial = ARAN.counter;
  return result;
};
