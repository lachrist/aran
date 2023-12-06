function SwitchTest(value) {
  var result = 0;

  switch (value) {
    case 0:
      console.log("case 0");
      result += 2;
    case 1:
      console.log("case 1");
      result += 4;
      break;
    case 2:
      console.log("case 2");
      result += 8;
    case 3:
      console.log("case 3");
      result += 16;
    default:
      console.log("default");
      result += 32;
      break;
    case 4:
      console.log("case 4");
      result += 64;
  }

  return result;
}

console.log(SwitchTest(4));
