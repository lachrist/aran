"use strict";

const global_Error = global.Error;
const global_SyntaxError = global.SyntaxError;

exports.SyntaxError = global_SyntaxError;

exports.MissingFeatureAranError = class MissingFeatureAranError extends global_Error {
  constructor (message, feature) {
    super(message);
    this.feature = feature;
  }
}

exports.InvalidOptionsAranError = class InvalidArgumentAranError extends global_Error {
  constructor (message) {
    super(message);
  }
};

exports.deadcode = () => { throw new global_Error(`Supposedly deadcode has been reached`) };

exports.abort = (constructor, message, optional) => { throw new (constructor || global_Error)(message, optional) }

exports.assert = (check, constructor, message, optional) => check || exports.abort(constructor, message, optional);
