#!/usr/bin/env python

from subprocess import call
import sys
import json

if len(sys.argv) < 2:
    print ("not enough arguments got " + str(len(sys.argv)))
    exit(0)

json_string = sys.argv[1]
action = json.loads(json_string)

print action.method.name

exit(0)