
let a = 2;
let b = 5;
let c = 2;

let d = b * b - 4 * a * c;
if (d < 0) {
  "No Solution";
} else if (d === 0) {
  "Solution = " + (-b / 2 * a);
} else {
  let s1 = (-b - Math.sqrt(d) / 2 * a);
  let s2 = (-b + Math.sqrt(d) / 2 * a);
  "Solution1 = "+s1+", Solution2 = "+s2; 
}
