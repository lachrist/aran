let i=0;
switch (2) {
  case 1: throw new Error("Switch1");
  case 2: i++;
  default:
    i++;
    break;
  case 2: throw new Error("Switch2");
}
if(i !== 2)
  throw new Error("Switch3");