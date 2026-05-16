#!/bin/bash
echo "CWD: $(pwd)"
echo "Node: $(node -v)"
echo "NPM: $(npm -v)"
echo "Listing node_modules/.bin:"
ls -F ../../node_modules/.bin | grep vite
echo "Checking @vitejs:"
ls -F ../../node_modules/@vitejs/plugin-react
echo "Running node check-deps.js:"
node check-deps.js
