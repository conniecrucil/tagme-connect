#!/bin/bash

# Test runner script for Playwright tests
# This script sets up the environment and runs the tests

echo "🚀 Starting Playwright Test Suite"
echo "=================================="

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "❌ Error: .env file not found!"
    echo "Please create a .env file with the required environment variables."
    echo "See ENVIRONMENT_VARIABLES.md for details."
    exit 1
fi

# Check if Netlify CLI is installed
if ! command -v netlify &> /dev/null; then
    echo "📦 Installing Netlify CLI..."
    npm install -g netlify-cli
fi

# Check if port 8888 is available
if lsof -Pi :8888 -sTCP:LISTEN -t >/dev/null ; then
    echo "⚠️  Port 8888 is already in use. Stopping existing process..."
    lsof -ti:8888 | xargs kill -9
    sleep 2
fi

echo "🔧 Starting Netlify dev server..."
# Start Netlify dev in background
netlify dev --port 8888 &
NETLIFY_PID=$!

# Wait for server to start
echo "⏳ Waiting for server to start..."
sleep 10

# Check if server is running
if ! curl -s http://localhost:8888 > /dev/null; then
    echo "❌ Failed to start Netlify dev server"
    kill $NETLIFY_PID 2>/dev/null
    exit 1
fi

echo "✅ Server is running on http://localhost:8888"

# Run the tests
echo "🧪 Running Playwright tests..."
npx playwright test

# Capture exit code
TEST_EXIT_CODE=$?

# Clean up
echo "🧹 Cleaning up..."
kill $NETLIFY_PID 2>/dev/null

# Exit with test result
if [ $TEST_EXIT_CODE -eq 0 ]; then
    echo "✅ All tests passed!"
else
    echo "❌ Some tests failed!"
fi

exit $TEST_EXIT_CODE
