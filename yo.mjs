switch (1) {
  case 1:
    case1();
  case 2:
    case2();
  default:
    caseDefault();
  case 3:
    case3();
  case 4:
    case4();
}

switch (1) {
  case 1:
    case1();
  case 2:
    case2();
  case 3:
    case3();
  case 4:
    case4();
    break;
  default:
    caseDefault();
    case3();
    case4();
}

switch (456) {
  case (console.log("head case 123"), 123):
    console.log("body case 123");
  default:
    console.log("default");
  case (console.log("head case 456"), 456):
    console.log("body case 456");
  case (console.log("head case 789"), 789):
    console.log("body case 789");
}

// switch () {
//   case 1:
// }
