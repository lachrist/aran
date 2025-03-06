---
layout: default
title: TypeDoc
---

# TypeDoc

<script type="module" defer>
const frame = document.createElement("iframe");
frame.src = "/typedoc/index.html";
frame.style.width = "100%";
frame.style.border = "none";
frame.scrolling = "no";
frame.style.overflow = "hidden";
const content = document.getElementsByClassName("page-content")[0];
content.appendChild(frame);
let inner = null;
const resize = () => {
  if (inner) {
    console.log("resize", inner.body.scrollHeight);
    frame.style.height = inner.body.scrollHeight + "px";
  }
};
frame.addEventListener("load", () => {
  inner = frame.contentDocument || frame.contentWindow.document;
  console.log("load");
  resize();
});
setInterval(resize, 1000);
</script>
