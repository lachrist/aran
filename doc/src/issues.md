---
layout: default-title
title: Issues
---

Beside performance overhead, Aran has some known issues that may cause instrumented programs to no behave as their pre-instrumented version. Most of these issues requires fairly convoluted code to arise.

{% for issue in site.issues %}
- [{{ issue.title }}]({{ issue.url }})
{% endfor %}
