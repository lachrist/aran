export type Template = {
  identifier: string;
  type: string | null;
};

export type Definition = {
  identifier: string;
  parameters: string[];
  source: string;
  specifier: string[];
};

export type Import = Omit<Definition, "identifier">;

export type Declaration = {
  templates: Template[];
  definition: Definition;
};

export type Comment =
  | {
      type: "annotation";
      annotation: string;
    }
  | {
      type: "declaration";
      declarations: Declaration[];
    }
  | {
      type: "other";
    };

export type Keyword =
  | "."
  | ","
  | "("
  | ")"
  | "["
  | "]"
  | "{"
  | "}"
  | "<"
  | ">"
  | "@template"
  | "@typedef"
  | "@type"
  | "import";
