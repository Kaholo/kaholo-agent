#!/usr/bin/env python
import sys
import json

def sayHello(action):
    res = action["params"]["NAME"]
    print("Hello " + res)

if len(sys.argv) < 2:
    print ("not enough arguments got " + str(len(sys.argv)))
    exit(-1)

json_string = sys.argv[1]
action = json.loads(json_string)

if action["method"]["name"] == "hello":
    sayHello(action)

exit(0)