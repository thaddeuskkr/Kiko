# import all
from peace_performance_python.prelude import *

import sys

# Beatmap can be cached and reused!
beatmap = Beatmap(sys.argv[1]) 
result = Calculator(score=int(sys.argv[2]), mods=int(sys.argv[3])).calculate(beatmap)
print(result)