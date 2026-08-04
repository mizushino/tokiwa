#!/usr/bin/env bash

set -u

# Firebase also opens the Emulator Hub, logging, and Firestore WebSocket ports
# even when they are not explicitly listed in firebase.json.
readonly firebase_emulator_ports='4000,4400,4500,5000,5001,8080,9099,9150,9199'

is_firebase_emulator_process() {
  local command=$1

  [[ ${command} == *firebase* && ${command} == *emulators:* ]] ||
    [[ ${command} == *cloud-firestore-emulator* ]] ||
    [[ ${command} == *functionsEmulatorRuntime* ]]
}

is_firebase_emulator_controller() {
  local command=$1

  [[ ${command} == *firebase* && ${command} == *emulators:* ]]
}

get_process_command() {
  ps -p "$1" -o args= 2>/dev/null
}

refresh_remaining_pids() {
  remaining_pids=()
  for pid in "${emulator_pids[@]}"; do
    command=$(get_process_command "${pid}")
    if [[ -n ${command} ]] && is_firebase_emulator_process "${command}"; then
      remaining_pids+=("${pid}")
    fi
  done
}

mapfile -t listening_pids < <(lsof -tiTCP:"${firebase_emulator_ports}" -sTCP:LISTEN 2>/dev/null | sort -u)

emulator_pids=()
controller_pids=()
for pid in "${listening_pids[@]}"; do
  command=$(get_process_command "${pid}")
  if is_firebase_emulator_process "${command}"; then
    emulator_pids+=("${pid}")
    if is_firebase_emulator_controller "${command}"; then
      controller_pids+=("${pid}")
    fi
  else
    echo "Leaving non-Firebase process ${pid} running on an emulator port." >&2
  fi
done

if ((${#emulator_pids[@]} == 0)); then
  exit 0
fi

if ((${#controller_pids[@]} > 0)); then
  kill -TERM "${controller_pids[@]}" 2>/dev/null || true
else
  kill -TERM "${emulator_pids[@]}" 2>/dev/null || true
fi

for _ in {1..50}; do
  refresh_remaining_pids
  if ((${#remaining_pids[@]} == 0)); then
    exit 0
  fi
  sleep 0.1
done

kill -TERM "${remaining_pids[@]}" 2>/dev/null || true
for _ in {1..10}; do
  refresh_remaining_pids
  if ((${#remaining_pids[@]} == 0)); then
    exit 0
  fi
  sleep 0.1
done

kill -KILL "${remaining_pids[@]}" 2>/dev/null || true
