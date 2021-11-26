import {assertEqual} from "../../__fixture__.mjs";
import {getSyntax, isSyntaxType} from "./syntax.mjs";
getSyntax();

// Enumeration //
assertEqual(isSyntaxType("!", "UnaryOperator"), true);
assertEqual(isSyntaxType("===", "UnaryOperator"), false);

// Type //
assertEqual(isSyntaxType("foo", "Source"), true);
assertEqual(isSyntaxType(123, "Source"), false);

// Primitive //
assertEqual(isSyntaxType("123", "Primitive"), true);
assertEqual(isSyntaxType("'foo'", "Primitive"), true);
assertEqual(isSyntaxType("undefined", "Primitive"), true);
assertEqual(isSyntaxType("foo", "Primitive"), false);

// Specifier //
assertEqual(isSyntaxType(null, "Specifier"), true);
assertEqual(isSyntaxType("this", "Specifier"), true);
assertEqual(isSyntaxType("new.target", "Specifier"), false);

// ReadableEnclaveVariableIdentifier //
assertEqual(isSyntaxType("foo", "ReadableEnclaveVariableIdentifier"), true);
assertEqual(isSyntaxType("this", "ReadableEnclaveVariableIdentifier"), true);
assertEqual(
  isSyntaxType("function", "ReadableEnclaveVariableIdentifier"),
  false,
);

// WritableEnclaveVariableIdentifier //
assertEqual(isSyntaxType("foo", "WritableEnclaveVariableIdentifier"), true);
assertEqual(isSyntaxType("this", "WritableEnclaveVariableIdentifier"), false);

// LabelIdentifier //
assertEqual(isSyntaxType("foo", "LabelIdentifier"), true);
assertEqual(isSyntaxType("this", "LabelIdentifier"), false);

// VariableIdentifier //
assertEqual(isSyntaxType("foo", "VariableIdentifier"), true);
assertEqual(isSyntaxType("this", "VariableIdentifier"), false);
