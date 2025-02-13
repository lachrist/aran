import numpy
import os
import matplotlib.pyplot as plot

def load (include):
  file = open(
    os.path.abspath(
      os.path.join(
        __file__,
        "..",
        "..",
        "count",
        include + "-output.txt",
      ),
    ),
  )
  try:
    return list(map(int, filter(str.strip, file)))
  finally:
    file.close();

def plotBar(include, data, max):
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
          "count-" + include + "-histogram-" + str(max) + ".pdf",
        ),
      ),
    );
  finally:
    plot.close()

def plotBox(include, data):
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
          "count-" + include + "-boxplot.pdf",
        ),
      ),
    )
  finally:
    plot.close()

def main ():
  for include in ["main", "comp"]:
    data = load(include)
    plotBox(include, data)
    for exp in [5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]:
      threshold = 2 ** exp
      print(
        include,
        threshold,
        round(
          100 * len(list(filter(lambda item: item <= threshold, data))) / len(data),
          2,
        ),
      )
      if threshold <= 1024:
        plotBar(include, data, threshold)

if __name__ == "__main__":
  main()

# main 32 93.19
# main 64 97.2
# main 128 98.31
# main 256 98.97
# main 512 99.29
# main 1024 99.54
# main 2048 99.72
# main 4096 99.85
# main 8192 99.93
# main 16384 99.97
# main 32768 99.99
# main 65536 100.0
# comp 32 0.04
# comp 64 20.63
# comp 128 55.61
# comp 256 80.95
# comp 512 92.22
# comp 1024 97.13
# comp 2048 98.6
# comp 4096 99.07
# comp 8192 99.42
# comp 16384 99.68
# comp 32768 99.85
# comp 65536 99.89
