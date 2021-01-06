"use strict";

const global_Reflect_apply = global.Reflect.apply;
const global_String_prototype_substring = global.String.prototype.substring;

const ONE = [1];

const FULL_BREAK = "B";
const FULL_CONTINUE = "C";
const EMPTY_BREAK = "b";
const EMPTY_CONTINUE = "c";

exports._make_full_break = (body) => FULL_BREAK + body;

exports._make_full_continue = (body) => FULL_CONTINUE + body;

exports._make_empty_break = (body) => EMPTY_BREAK + body;

exports._make_empty_continue = (body) => EMPTY_CONTINUE + body;

exports._is_break = (label) => label[0] === FULL_BREAK || label[0] === EMPTY_BREAK;

exports._is_continue = (label) => label[0] === FULL_CONTINUE || label[0] === EMPTY_CONTINUE;

exports._is_empty = (label) => label[0] === EMPTY_BREAK || label[0] === EMPTY_CONTINUE;

exports._is_full = (label) => label[0] === FULL_BREAK || label[0] === FULL_CONTINUE;

exports._get_body = (label) => global_Reflect_apply(global_String_prototype_substring, label, ONE);
