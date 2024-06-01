type Foo =
  | {
      type: "foo1";
      data: number;
    }
  | {
      type: "foo2";
      data: string;
    };

const f = <F extends Foo>(type: F["type"], data: F["data"]): number => {
  const foo: {
    type: F["type"];
    data: F["data"];
  };
  const foo = { type, data };
  if (foo.type === "foo1") {
    // Type 'string | number' is not assignable to type 'number'.
    return foo.data;
  } else if (foo.type === "foo2") {
    // Property 'length' does not exist on type 'string | number'.
    return foo.data.length;
  } else {
    throw new Error("unreachable");
  }
};
