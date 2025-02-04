import numpy
import os
import matplotlib.pyplot as plot

def load ():
  file = open(
    os.path.abspath(
      os.path.join(
        __file__,
        "..",
        "..",
        "staging",
        "output",
        "count-branch.jsonl",
      ),
    ),
  )
  try:
    return list(map(int, filter(str.strip, file)))
  finally:
    file.close();

def plotBar(data, max):
  try:
    plot.hist(
      list(filter(lambda x: x <= max, data)),
      bins=numpy.arange(0, max + 1),
      edgecolor="black",
    );
    plot.xlabel("Branch Count");
    plot.title("Branch Count Histogram");
    plot.yscale("log")
    plot.grid(axis="y", linestyle="--")
    plot.savefig(
      os.path.abspath(
        os.path.join(
          __file__,
          "..",
          "count-branch-histogram-" + str(max) + ".pdf",
        ),
      ),
    );
  finally:
    plot.close()

def plotBox(data):
  try:
    plot.boxplot(
      [data],
      tick_labels=["Branch Count"],
      showfliers=False,
    )
    plot.title("Branch Count Boxplot")
    plot.savefig(
      os.path.abspath(
        os.path.join(
          __file__,
          "..",
          "count-branch-boxplot.pdf",
        ),
      ),
    )
  finally:
    plot.close()

def main ():
  data = load()
  plotBar(data, 32)
  plotBar(data, 64)
  plotBar(data, 128)
  plotBar(data, 512)
  plotBar(data, 1024)
  plotBox(data)

if __name__ == "__main__":
  main()
