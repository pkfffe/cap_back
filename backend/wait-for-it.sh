#!/usr/bin/env bash
# Use like: ./wait-for-it.sh host:port -- command args

hostport="$1"
shift

host=$(echo "$hostport" | cut -d : -f 1)
port=$(echo "$hostport" | cut -d : -f 2)

echo "⏳ Waiting for $host:$port..."

while ! nc -z "$host" "$port"; do
  sleep 1
done

echo "✅ $host:$port is available, executing command: $@"
exec "$@"