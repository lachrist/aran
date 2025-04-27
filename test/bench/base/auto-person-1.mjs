import { main } from "./auto.mjs";
const code = `
  class Person {
    name = "anonymous";
    age = 0;
    constructor(name, age) {
      this.name = name;
      this.age = age;
    }
    greet() {
      console.log(\`Hello, I'm \${this.name}; \${this.age}!\`);
    }
  }
  const alice = new Person("Alice", 30);
  alice.greet(); // "Hello, my name is Alice, I'm 30!"
`;
await main(code, "script", 1);
