"""
title: How memory grows
task: Print how many bytes a full state vector needs for n = 10, 20, 30, 40 and 50 qubits, at 16 bytes per complex amplitude, in convenient units.
hint: The number of amplitudes is 2^{n} (`2 ** n` in Python). Divide by 1,000 repeatedly to step through kB, MB, GB, TB and PB.
"""


def readable(nbytes):
    for unit in ["bytes", "kB", "MB", "GB", "TB", "PB", "EB"]:
        if nbytes < 1000:
            return f"{nbytes:.0f} {unit}"
        nbytes /= 1000
    return f"{nbytes:.0f} ZB"


for n in [10, 20, 30, 40, 50]:
    print(f"{n} qubits: {2 ** n:>20,} amplitudes, {readable(16 * 2 ** n)}")
