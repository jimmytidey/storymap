#!/bin/bash
dir=$(pwd)
url="http://localhost:3000"
mongourl="mongodb://oliver:typewriter@lamppost.9.mongolayer.com:10209/storymap_liverpool"
#/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome "$url/input" "$url/output" & MONGO_URL="$mongourl" meteor
MONGO_URL="$mongourl" electrify