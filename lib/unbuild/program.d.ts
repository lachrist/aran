export type ReifyGlobalProgram = {
  kind: "module" | "script" | "eval";
  situ: "global";
  plug: "reify";
};

export type AlienGlobalProgram = {
  kind: "module" | "script" | "eval";
  situ: "global";
  plug: "alien";
};

export type AlienLocalProgram = {
  kind: "eval";
  situ: "local";
  plug: "alien";
};

export type ReifyLocalProgram = {
  kind: "eval";
  situ: "local";
  plug: "reify";
};

export type Program =
  | ReifyGlobalProgram
  | AlienGlobalProgram
  | AlienLocalProgram
  | ReifyLocalProgram;

////////////////////
// Global | Local //
////////////////////

export type GlobalProgram = ReifyGlobalProgram | AlienGlobalProgram;

export type LocalProgram = AlienLocalProgram | ReifyLocalProgram;

///////////////////
// Alien | Reify //
///////////////////

export type AlienProgram = AlienGlobalProgram | AlienLocalProgram;

export type ReifyProgram = ReifyGlobalProgram | ReifyLocalProgram;

/////////////////
// Root | Node //
/////////////////

export type RootProgram = GlobalProgram | AlienLocalProgram;

export type NodeProgram = ReifyLocalProgram;
