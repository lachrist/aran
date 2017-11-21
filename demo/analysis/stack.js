
const scope = ;
const stack =

traps.with = (env, idx)

traps.get = (obj, key, idx) => {
  const node = aran.node(idx);
  if (node.type === "CallExpression") {
    var $key = stack.pop();
    var $obj = stack.peek();
  } else if (node.type === "UpdateExpression") {
    var $key = stack.peek();
    stack.swap();
    var $obj = stack.peek();
  } else {
    var $key = stack.pop();
    var $obj = stack.pop();
  }
  stack.push($obj[key]);
  return obj[key];
};

traps.binary = (opr, arg1, arg2, idx) => {
  const node = aran.node(idx);
  if (node.type === "SwitchStatement") {
    const $arg2 = stack.pop();
    const $arg1 = stack.peek();
  } else {
    const $arg1 = stack.pop();
    const $arg2 = stack.pop();
  }
  stack.push();
};
