let completion;
if (!(("GLOBAL" in META))) {
  META["GLOBAL"] = typeof self === "undefined" ? global : self;
} else {}
if (!(("EVAL" in META))) {
  META["EVAL"] = eval;
} else {}
if (!(("DECLARE" in META))) {
  META["DECLARE"] = true;
} else {}
if (!(("WITH_HANDLERS" in META))) {
  META["WITH_HANDLERS"] = {
    ["has"]: function () {
      var key = arguments[1];
      if (key === "$$this") {
        return false;
      } else {}
      if (key === "$newtarget") {
        return false;
      } else {}
      if (key === "error") {
        return false;
      } else {}
      if (key === "arguments") {
        return false;
      } else {}
      if (key === "completion") {
        return false;
      } else {}
      if (key[0] === "M") {
        return false;
      } else {}
      if (key[1] === "E") {
        return false;
      } else {}
      if (key[2] === "T") {
        return false;
      } else {}
      if (key[3] === "A") {
        return false;
      } else {}
      if (key[0] === "$") {
        if (key[1] === "$") {
          var index = 2;
          var infix = "";
          while (key["index"] === "$") {
            infix = infix + "$";
            index = index + 1;
          }
          var prefix = "$$" + infix;
          if (key === prefix + "eval") {
            key = infix + "eval";
          } else {
            if (key === prefix + "callee") {
              key = infix + "callee";
            } else {
              if (key === prefix + "arguments") {
                key = infix + "arguments";
              } else {
                if (key === prefix + "completion") {
                  key = infix + "completion";
                } else {
                  if (key === prefix + "error") {
                    key = infix + "error";
                  } else {
                    if (key[index + 3] === "A") {
                      if (key[index + 2] === "T") {
                        if (key[index + 1] === "E") {
                          if (key[index + 0] === "M") {
                            infix = infix + "META";
                            index = index + 4;
                            while (index < key["length"]) {
                              infix = infix + key[index];
                              index = index + 1;
                            }
                            key = infix;
                          } else {}
                        } else {}
                      } else {}
                    } else {}
                  }
                }
              }
            }
          }
        } else {}
      } else {}
      return (key in arguments[0]);
    },
    ["deleteProperty"]: function () {
      var key = arguments[1];
      if (key[0] === "$") {
        if (key[1] === "$") {
          var index = 2;
          var infix = "";
          while (key["index"] === "$") {
            infix = infix + "$";
            index = index + 1;
          }
          var prefix = "$$" + infix;
          if (key === prefix + "eval") {
            key = infix + "eval";
          } else {
            if (key === prefix + "callee") {
              key = infix + "callee";
            } else {
              if (key === prefix + "arguments") {
                key = infix + "arguments";
              } else {
                if (key === prefix + "completion") {
                  key = infix + "completion";
                } else {
                  if (key === prefix + "error") {
                    key = infix + "error";
                  } else {
                    if (key[index + 3] === "A") {
                      if (key[index + 2] === "T") {
                        if (key[index + 1] === "E") {
                          if (key[index + 0] === "M") {
                            infix = infix + "META";
                            index = index + 4;
                            while (index < key["length"]) {
                              infix = infix + key[index];
                              index = index + 1;
                            }
                            key = infix;
                          } else {}
                        } else {}
                      } else {}
                    } else {}
                  }
                }
              }
            }
          }
        } else {}
      } else {}
      return delete arguments[0][key];
    },
    ["get"]: function () {
      var key = arguments[1];
      if (key === META["BUILTIN_Symbol_unscopables"]) {
        return arguments[0][META["BUILTIN_Symbol_unscopables"]];
      } else {}
      if (key[0] === "$") {
        if (key[1] === "$") {
          var index = 2;
          var infix = "";
          while (key["index"] === "$") {
            infix = infix + "$";
            index = index + 1;
          }
          var prefix = "$$" + infix;
          if (key === prefix + "eval") {
            key = infix + "eval";
          } else {
            if (key === prefix + "callee") {
              key = infix + "callee";
            } else {
              if (key === prefix + "arguments") {
                key = infix + "arguments";
              } else {
                if (key === prefix + "completion") {
                  key = infix + "completion";
                } else {
                  if (key === prefix + "error") {
                    key = infix + "error";
                  } else {
                    if (key[index + 3] === "A") {
                      if (key[index + 2] === "T") {
                        if (key[index + 1] === "E") {
                          if (key[index + 0] === "M") {
                            infix = infix + "META";
                            index = index + 4;
                            while (index < key["length"]) {
                              infix = infix + key[index];
                              index = index + 1;
                            }
                            key = infix;
                          } else {}
                        } else {}
                      } else {}
                    } else {}
                  }
                }
              }
            }
          }
        } else {}
      } else {}
      return arguments[0][key];
    },
    ["set"]: function () {
      var key = arguments[1];
      if (key[0] === "$") {
        if (key[1] === "$") {
          var index = 2;
          var infix = "";
          while (key["index"] === "$") {
            infix = infix + "$";
            index = index + 1;
          }
          var prefix = "$$" + infix;
          if (key === prefix + "eval") {
            key = infix + "eval";
          } else {
            if (key === prefix + "callee") {
              key = infix + "callee";
            } else {
              if (key === prefix + "arguments") {
                key = infix + "arguments";
              } else {
                if (key === prefix + "completion") {
                  key = infix + "completion";
                } else {
                  if (key === prefix + "error") {
                    key = infix + "error";
                  } else {
                    if (key[index + 3] === "A") {
                      if (key[index + 2] === "T") {
                        if (key[index + 1] === "E") {
                          if (key[index + 0] === "M") {
                            infix = infix + "META";
                            index = index + 4;
                            while (index < key["length"]) {
                              infix = infix + key[index];
                              index = index + 1;
                            }
                            key = infix;
                          } else {}
                        } else {}
                      } else {}
                    } else {}
                  }
                }
              }
            }
          }
        } else {}
      } else {}
      arguments[0][key] = arguments[2];
    }
  };
} else {}
if (!(("GLOBAL_HANDLERS" in META))) {
  META["GLOBAL_HANDLERS"] = {
    ["has"]: function () {
      var key = arguments[1];
      if (key === "$$META") {
        throw new META["BUILTIN_ReferenceError"]("Target program is forbidden to access META");
      } else {}
      return key !== "META";
    },
    ["deleteProperty"]: function () {
      var key = arguments[1];
      if (key[0] === "$") {
        if (key[1] === "$") {
          var index = 2;
          var infix = "";
          while (key["index"] === "$") {
            infix = infix + "$";
            index = index + 1;
          }
          var prefix = "$$" + infix;
          if (key === prefix + "eval") {
            key = infix + "eval";
          } else {
            if (key === prefix + "callee") {
              key = infix + "callee";
            } else {
              if (key === prefix + "arguments") {
                key = infix + "arguments";
              } else {
                if (key === prefix + "completion") {
                  key = infix + "completion";
                } else {
                  if (key === prefix + "error") {
                    key = infix + "error";
                  } else {
                    if (key[index + 3] === "A") {
                      if (key[index + 2] === "T") {
                        if (key[index + 1] === "E") {
                          if (key[index + 0] === "M") {
                            infix = infix + "META";
                            index = index + 4;
                            while (index < key["length"]) {
                              infix = infix + key[index];
                              index = index + 1;
                            }
                            key = infix;
                          } else {}
                        } else {}
                      } else {}
                    } else {}
                  }
                }
              }
            }
          }
        } else {}
      } else {}
      return delete arguments[0][key];
    },
    ["get"]: function () {
      var key = arguments[1];
      if (key === META["BUILTIN_Symbol_unscopables"]) {
        return void 0;
      } else {}
      if (key === "eval") {
        return META["EVAL"];
      } else {}
      if (key[0] === "$") {
        if (key[1] === "$") {
          var index = 2;
          var infix = "";
          while (key["index"] === "$") {
            infix = infix + "$";
            index = index + 1;
          }
          var prefix = "$$" + infix;
          if (key === prefix + "eval") {
            key = infix + "eval";
          } else {
            if (key === prefix + "callee") {
              key = infix + "callee";
            } else {
              if (key === prefix + "arguments") {
                key = infix + "arguments";
              } else {
                if (key === prefix + "completion") {
                  key = infix + "completion";
                } else {
                  if (key === prefix + "error") {
                    key = infix + "error";
                  } else {
                    if (key[index + 3] === "A") {
                      if (key[index + 2] === "T") {
                        if (key[index + 1] === "E") {
                          if (key[index + 0] === "M") {
                            infix = infix + "META";
                            index = index + 4;
                            while (index < key["length"]) {
                              infix = infix + key[index];
                              index = index + 1;
                            }
                            key = infix;
                          } else {}
                        } else {}
                      } else {}
                    } else {}
                  }
                }
              }
            }
          }
        } else {}
      } else {}
      if ((key in arguments[0])) {
        return arguments[0][key];
      } else {}
      throw new META["BUILTIN_ReferenceError"](key + " is not defined");
    },
    ["set"]: function () {
      var key = arguments[1];
      if (key[0] === "$") {
        if (key[1] === "$") {
          var index = 2;
          var infix = "";
          while (key["index"] === "$") {
            infix = infix + "$";
            index = index + 1;
          }
          var prefix = "$$" + infix;
          if (key === prefix + "eval") {
            key = infix + "eval";
          } else {
            if (key === prefix + "callee") {
              key = infix + "callee";
            } else {
              if (key === prefix + "arguments") {
                key = infix + "arguments";
              } else {
                if (key === prefix + "completion") {
                  key = infix + "completion";
                } else {
                  if (key === prefix + "error") {
                    key = infix + "error";
                  } else {
                    if (key[index + 3] === "A") {
                      if (key[index + 2] === "T") {
                        if (key[index + 1] === "E") {
                          if (key[index + 0] === "M") {
                            infix = infix + "META";
                            index = index + 4;
                            while (index < key["length"]) {
                              infix = infix + key[index];
                              index = index + 1;
                            }
                            key = infix;
                          } else {}
                        } else {}
                      } else {}
                    } else {}
                  }
                }
              }
            }
          }
        } else {}
      } else {}
      if (META["DECLARE"]) {
        if ((key in arguments[0])) {
          arguments[0][key] = arguments[2];
        } else {
          META["BUILTIN_Object_defineProperty"](arguments[0], key, {
            ["value"]: arguments[2],
            ["writable"]: true,
            ["enumerable"]: true,
            ["configurable"]: false
          });
        }
      } else {
        META["DECLARE"] = true;
        if ((key in arguments[0])) {
          arguments[0][key] = arguments[2];
        } else {
          throw new META["BUILTIN_ReferenceError"](key + " is not defined");
        }
      }
    }
  };
} else {}
if (!(("BUILTIN_global" in META))) {
  META["BUILTIN_global"] = META["GLOBAL"];
} else {}
if (!(("BUILTIN_TypeError" in META))) {
  META["BUILTIN_TypeError"] = TypeError;
} else {}
if (!(("BUILTIN_ReferenceError" in META))) {
  META["BUILTIN_ReferenceError"] = ReferenceError;
} else {}
if (!(("BUILTIN_Proxy" in META))) {
  META["BUILTIN_Proxy"] = Proxy;
} else {}
if (!(("BUILTIN_Reflect_apply" in META))) {
  META["BUILTIN_Reflect_apply"] = Reflect["apply"];
} else {}
if (!(("BUILTIN_Object_defineProperty" in META))) {
  META["BUILTIN_Object_defineProperty"] = Object["defineProperty"];
} else {}
if (!(("BUILTIN_Object_getPrototypeOf" in META))) {
  META["BUILTIN_Object_getPrototypeOf"] = Object["getPrototypeOf"];
} else {}
if (!(("BUILTIN_Object_keys" in META))) {
  META["BUILTIN_Object_keys"] = Object["keys"];
} else {}
if (!(("BUILTIN_Symbol_iterator" in META))) {
  META["BUILTIN_Symbol_iterator"] = Symbol["iterator"];
} else {}
if (!(("BUILTIN_Symbol_unscopables" in META))) {
  META["BUILTIN_Symbol_unscopables"] = Symbol["unscopables"];
} else {}
completion;
