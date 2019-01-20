a:{
  break a;
  throw new Error("Break1");
}
while (true) {
  break;
  throw new Error("Break2");
}