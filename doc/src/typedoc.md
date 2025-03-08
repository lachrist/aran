---
layout: default
title: TypeDoc
---

# [TypeDoc ⧉]({{ '/typedoc/index.html' | relative_url }})

<script type="module" defer>
const frame = document.createElement("iframe");
frame.src = "{{ '/typedoc/index.html' | relative_url }}";
frame.style.width = "100%";
frame.style.border = "none";
const content = document.getElementsByClassName("page-content")[0];
content.appendChild(frame);
frame.addEventListener("load", () => {
  frame.style.height = "0px";
  const inner = frame.contentDocument || frame.contentWindow.document;
  if (inner) {
    const timer = setInterval(() => {
      const height = inner.body.scrollHeight;
      if (height > 0) {
        frame.style.height = `${height}px`;
        clearInterval(timer);
      }
    }, 100);
  }
});
</script>
