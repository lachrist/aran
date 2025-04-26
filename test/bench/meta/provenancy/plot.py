
import matplotlib.pyplot as plot

import os
import json

# read data from file

__dirname__ = os.path.dirname(__file__)

def load (path):
  with open(path, "r") as file:
    return json.load(file)

if __name__ == "__main__":
  dump = load(__dirname__ + "/trace/dump.json")
  plot.boxplot(
    dump["data"],
    tick_labels = dump["labels"],
    showfliers = False,
  )
  plot.yscale("log")
  plot.savefig(__dirname__ + "/trace/plot.pdf")
  plot.close()
