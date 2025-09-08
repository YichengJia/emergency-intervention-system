#!/usr/bin/env bash

# Start both backend and frontend for development using concurrently.
# This script is optional; it's provided as a convenience when developing locally.

set -e

pushd backend
echo "Starting backend..."
npm install
npm run dev &
BACKEND_PID=$!
popd

pushd .
echo "Starting frontend..."
npm install
npm start &
FRONTEND_PID=$!
popd

echo "Backend PID: $BACKEND_PID, Frontend PID: $FRONTEND_PID"
wait $BACKEND_PID $FRONTEND_PID