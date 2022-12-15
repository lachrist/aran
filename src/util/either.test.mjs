import { assertEqual } from "../__fixture__.mjs";
import {
  makeLeft,
  makeRight,
  isLeft,
  isRight,
  fromLeft,
  fromRight,
} from "./either.mjs";

assertEqual(isLeft(makeLeft("payload")), true);
assertEqual(fromLeft(makeLeft("payload")), "payload");
assertEqual(isRight(makeRight("payload")), true);
assertEqual(fromRight(makeRight("payload")), "payload");
