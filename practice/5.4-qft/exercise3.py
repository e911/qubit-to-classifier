"""
title: The classical half of Shor's algorithm
task: For N = 15 with a = 7, and for N = 21 with a = 2, find the period r of a^{x} mod N by trying x = 1, 2, 3, …, then compute gcd(a^{r/2} − 1, N) and gcd(a^{r/2} + 1, N).
hint: `pow(a, x, N)` computes a^{x} mod N quickly, and `math.gcd` finds greatest common divisors.
note: The quantum computer's only job in Shor's algorithm is finding r. Trying x one by one, as here, takes far too long when N has hundreds of digits.
"""
import math

for N, a in [(15, 7), (21, 2)]:
    r = 1
    while pow(a, r, N) != 1:
        r += 1
    half = pow(a, r // 2)
    print(f"N = {N}, a = {a}: powers {[pow(a, x, N) for x in range(1, r + 1)]}, period r = {r}")
    print(f"   gcd({half} - 1, {N}) = {math.gcd(half - 1, N)},  gcd({half} + 1, {N}) = {math.gcd(half + 1, N)}")
