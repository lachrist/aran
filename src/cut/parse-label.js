
const apply = Reflect.apply;
const substring = String.prototype.substring;

exports.split = (label) => label[0] === "b" || label[0] === "B";

exports.core = (label) => label[0] === "B" || label[0] === "C" ? null : apply(substring, label, [1]);
