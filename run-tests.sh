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

# Check if port 3000 is available
if lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null ; then
    echo "⚠️  Port 3000 is already in use. Stopping existing process..."
    lsof -ti:3000 | xargs kill -9
    sleep 2
fi

echo "🔧 Starting React Router dev server..."
# Start app server in background
npm run dev -- --port 3000 &
APP_DEV_PID=$!

# Wait for server to start
echo "⏳ Waiting for server to start..."
sleep 10

# Check if server is running
if ! curl -s http://localhost:3000 > /dev/null; then
    echo "❌ Failed to start dev server"
    kill $APP_DEV_PID 2>/dev/null
    exit 1
fi

echo "✅ Server is running on http://localhost:3000"

# Run the tests
echo "🧪 Running Playwright tests..."
npx playwright test

# Capture exit code
TEST_EXIT_CODE=$?

# Clean up
echo "🧹 Cleaning up..."
kill $APP_DEV_PID 2>/dev/null

# Exit with test result
if [ $TEST_EXIT_CODE -eq 0 ]; then
    echo "✅ All tests passed!"
else
    echo "❌ Some tests failed!"
fi

exit $TEST_EXIT_CODE
