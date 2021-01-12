"use strict";

const global_Reflect_apply = global.Reflect.apply;
const global_String_prototype_substring = global.String.prototype.substring;

const ONE = [1];

const FULL_BREAK = "B";
const FULL_CONTINUE = "C";
const EMPTY_BREAK = "b";
const EMPTY_CONTINUE = "c";

exports.FullBreak = (body) => FULL_BREAK + body;

exports.FullContinue = (body) => FULL_CONTINUE + body;

exports.EmptyBreak = (body) => EMPTY_BREAK + body;

exports.EmptyContinue = (body) => EMPTY_CONTINUE + body;

exports.IsBreak = (label) => label[0] === FULL_BREAK || label[0] === EMPTY_BREAK;

exports.IsContinue = (label) => label[0] === FULL_CONTINUE || label[0] === EMPTY_CONTINUE;

exports.IsEmpty = (label) => label[0] === EMPTY_BREAK || label[0] === EMPTY_CONTINUE;

exports.IsFull = (label) => label[0] === FULL_BREAK || label[0] === FULL_CONTINUE;

exports.GetBody = (label) => global_Reflect_apply(global_String_prototype_substring, label, ONE);
