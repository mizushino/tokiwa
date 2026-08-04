#!/usr/bin/env bash

set -u

# Firebase also opens the Emulator Hub, logging, and Firestore WebSocket ports
# even when they are not explicitly listed in firebase.json.
readonly firebase_emulator_ports='4000,4400,4500,5000,5001,8080,9099,9150,9199'

mapfile -t emulator_pids < <(lsof -tiTCP:"${firebase_emulator_ports}" -sTCP:LISTEN 2>/dev/null | sort -u)

if ((${#emulator_pids[@]} == 0)); then
  exit 0
fi

kill -9 "${emulator_pids[@]}"

