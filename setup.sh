#!/bin/bash
# ai-brain — one-liner setup for Unix/macOS/Linux
# Usage: curl -fsSL https://raw.githubusercontent.com/ItsWambarYT/ai-brain/main/setup.sh | bash

set -e

# Check Node.js
if ! command -v node &> /dev/null; then
  echo "Error: Node.js is not installed."
  echo "Install it from https://nodejs.org (v18 or higher required)"
  exit 1
fi

NODE_VERSION=$(node -e "process.stdout.write(process.version.replace('v','').split('.')[0])")
if [ "$NODE_VERSION" -lt 18 ]; then
  echo "Error: Node.js v18+ required (found v${NODE_VERSION})"
  echo "Update at https://nodejs.org"
  exit 1
fi

echo "Running ai-brain..."
npx ai-brain --yes
