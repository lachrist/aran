type Foo =
  | {
      type: "tag1";
    }
  | {
      type: "tag2";
    }
  | {
      type: "tag3";
    };

type Bar =
  | {
      type: "tag1";
    }
  | {
      type: "tag2";
    }
  | {
      type: "tag3";
    };

type Point<T extends "tag1"> = {};

const convert = <X extends "foo" | "bar">(arg: { type: X }): { type: X } => {
  return { type: "foo" };
};

const convertFooBar = <T extends "tag1" | "tag2" | "tag3">(
  foo: Foo & { type: T },
): Bar & { type: T } => {
  const type = foo.type;
  switch (type) {
    case "tag1":
      // Type '{ type: "tag1"; }' is not assignable to type 'Bar & { type: T; }'.
      // Types of property 'type' are incompatible.
      // Type '"tag1"' is not assignable to type 'T'.
      // '"tag1"' is assignable to the constraint of type 'T', but 'T' could be instantiated with a different subtype of constraint '"tag1" | "tag2" | "tag3"'.ts(2322)
      return { type };
    case "tag2":
      return { type: "tag2" };
    case "tag3":
      // TypeScript will now raise an error here
      return { type: "tag2" }; // Error: Type '"tag2"' is not assignable to type 'T'
    default: {
      throw new Error("unreachable");
    }
  }
};
