#!/bin/sh
if [ -n "$METEOR_SETTINGS_FILE" -a -f "$METEOR_SETTINGS_FILE" ]; then
    export METEOR_SETTINGS="$(cat "$METEOR_SETTINGS_FILE")"
fi
# TODO: Check if mongo is starting 
exec node main.js
