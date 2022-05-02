import {assertEqual} from "../../__fixture__.mjs";
import {makeFrame, getFrameBox} from "./frame.mjs";

assertEqual(getFrameBox(makeFrame("box")), "box");
