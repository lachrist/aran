import matplotlib.pyplot as plt
import json
import sys

stdin = sys.stdin.read()
content = json.loads(stdin)
for plot in content:
  plt.boxplot(plot["data"], tick_labels=plot["labels"], showfliers=False)
  plt.title(plot["title"])
  plt.savefig(plot["output"])
  plt.close()
