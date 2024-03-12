export type PublicKey =
  | {
      computed: true;
      access: "public";
      converted: boolean;
      data: aran.Expression<unbuild.Atom>;
    }
  | {
      computed: false;
      access: "public";
      converted: true;
      data: estree.Key;
    };

export type PrivateKey = {
  computed: false;
  access: "private";
  converted: true;
  data: estree.PrivateKey;
};

export type Key = PublicKey | PrivateKey;
