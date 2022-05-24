import {assertEqual} from "../__fixture__.mjs";

import {getUUID, getLatestUUID} from "./uuid.mjs";

assertEqual(getUUID(), getLatestUUID());
