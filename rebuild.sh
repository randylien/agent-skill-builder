#!/bin/bash
# Rebuild script for Agent Skill Builder
# Run this script after making changes to the source code

set -e

echo "🔨 Rebuilding Agent Skill Builder..."
echo

# Check if Deno is installed
if ! command -v deno &> /dev/null; then
    echo "❌ Error: Deno is not installed"
    echo
    echo "Please install Deno first:"
    echo "  curl -fsSL https://deno.land/install.sh | sh"
    echo
    echo "Or visit: https://deno.land/#installation"
    exit 1
fi

echo "✓ Deno found: $(deno --version | head -n1)"
echo

# Clean old build
if [ -f "./dist/skill-builder" ]; then
    echo "🗑️  Removing old binary..."
    rm ./dist/skill-builder
fi

# Build new binary
echo "📦 Compiling..."
deno compile --allow-read --allow-write --allow-env --output ./dist/skill-builder src/main.ts

# Verify build
if [ -f "./dist/skill-builder" ]; then
    echo
    echo "✅ Build successful!"
    echo
    ./dist/skill-builder --version
    echo
    echo "Binary location: ./dist/skill-builder"
    echo "Size: $(ls -lh ./dist/skill-builder | awk '{print $5}')"
else
    echo
    echo "❌ Build failed!"
    exit 1
fi
