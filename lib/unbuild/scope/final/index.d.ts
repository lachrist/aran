export type InternalFrame = {
  type: "internal";
};

export type ExternaFrame = {
  type: "external";
};

export type FinalFrame = InternalFrame | ExternaFrame;
