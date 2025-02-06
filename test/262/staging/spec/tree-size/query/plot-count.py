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
        "count",
        "stage-output.txt",
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
          "..",
          "output",
          "count-histogram-" + str(max) + ".pdf",
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
          "..",
          "output",
          "boxplot.pdf",
        ),
      ),
    )
  finally:
    plot.close()

def main ():
  data = load()
  plotBox(data)
  for exp in [5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]:
    threshold = 2 ** exp
    print(
      threshold,
      round(
        100 * len(list(filter(lambda item: item <= threshold, data))) / len(data),
        2,
      ),
    )
    if threshold <= 1024:
      plotBar(data, threshold)

if __name__ == "__main__":
  main()

# 32 36.66
# 64 62.23
# 128 80.9
# 256 90.74
# 512 95.52
# 1024 97.38
# 2048 98.0
# 4096 98.35
# 8192 98.69
# 16384 98.93
# 32768 99.05
# 65536 99.08
