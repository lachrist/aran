import matplotlib.pyplot as plt
import json
import sys

stdin = sys.stdin.read()
plot = json.loads(stdin)
plt.boxplot(plot["payload"], tick_labels=plot["labels"], showfliers=False)
plt.title(plot["title"])
plt.savefig(plot["output"])
plt.close()
