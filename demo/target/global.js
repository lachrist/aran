console.log(Math.sqrt(4));
console.log(Date());
console.log(global.Date());
console.log(this.Date());
(function () {
  console.log(this.Date());
} ());