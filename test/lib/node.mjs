import { assertEqual } from "../fixture.mjs";
import { packPrimitive, unpackPrimitive } from "../../lib/node.mjs";

const { undefined } = globalThis;

assertEqual(unpackPrimitive(packPrimitive(undefined)), undefined);
assertEqual(unpackPrimitive(packPrimitive(123)), 123);
assertEqual(unpackPrimitive(packPrimitive(123n)), 123n);
assertEqual(unpackPrimitive(packPrimitive("foo")), "foo");
assertEqual(unpackPrimitive(packPrimitive(null)), null);
