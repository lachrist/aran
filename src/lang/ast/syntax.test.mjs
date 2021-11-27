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
assertEqual(isSyntaxType(null, "Specifier"), false);
assertEqual(isSyntaxType("this", "Specifier"), true);
assertEqual(isSyntaxType("new.target", "Specifier"), false);

// NullableSpecifier //
assertEqual(isSyntaxType(null, "NullableSpecifier"), true);
assertEqual(isSyntaxType("this", "NullableSpecifier"), true);
assertEqual(isSyntaxType("new.target", "NullableSpecifier"), false);

// ReadableEnclaveVariable //
assertEqual(isSyntaxType("foo", "ReadableEnclaveVariable"), true);
assertEqual(isSyntaxType("this", "ReadableEnclaveVariable"), true);
assertEqual(isSyntaxType("function", "ReadableEnclaveVariable"), false);

// WritableEnclaveVariable //
assertEqual(isSyntaxType("foo", "WritableEnclaveVariable"), true);
assertEqual(isSyntaxType("this", "WritableEnclaveVariable"), false);

// Label //
assertEqual(isSyntaxType("foo", "Label"), true);
assertEqual(isSyntaxType("this", "Label"), false);

// Variable //
assertEqual(isSyntaxType("foo", "Variable"), true);
assertEqual(isSyntaxType("this", "Variable"), false);
