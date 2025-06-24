#!/bin/bash

# PropAgentic Firebase Functions Test Runner
# Easy way to run different test scenarios

echo "🚀 PropAgentic Firebase Functions Test Runner"
echo "=============================================="

# Function to check if emulators are running
check_emulators() {
    echo "📍 Checking Firebase emulators..."
    
    # Check Functions emulator
    if curl -s http://127.0.0.1:5001 > /dev/null 2>&1; then
        echo "✅ Functions emulator running on port 5001"
    else
        echo "❌ Functions emulator not running on port 5001"
        echo "   Please start with: firebase emulators:start --only functions"
        exit 1
    fi
}

# Function to run the simplified test
run_simplified_test() {
    echo ""
    echo "🧪 Running Simplified Test Suite..."
    echo "This tests public functions and checks auth requirements"
    echo ""
    node functions-test-simplified.js
}

# Function to run comprehensive test (requires auth emulator)
run_comprehensive_test() {
    echo ""
    echo "🔐 Running Comprehensive Test Suite..."
    echo "This includes authentication testing (requires auth emulator)"
    echo ""
    
    # Check if auth emulator is running
    if curl -s http://localhost:9099 > /dev/null 2>&1; then
        echo "✅ Auth emulator detected"
        node functions-test-suite-comprehensive.js
    else
        echo "⚠️  Auth emulator not running - some tests will be skipped"
        echo "   To run full tests: firebase emulators:start --only functions,auth"
        node functions-test-suite-comprehensive.js
    fi
}

# Function to test specific function
test_specific_function() {
    echo ""
    echo "🎯 Testing specific function: $1"
    echo ""
    
    if [ -z "$1" ]; then
        echo "Usage: $0 test-function <function-name>"
        echo "Example: $0 test-function ping"
        exit 1
    fi
    
    curl -s "http://127.0.0.1:5001/propagentic/us-central1/$1" \
        -X POST \
        -H "Content-Type: application/json" \
        -d '{"data": {}}' | jq '.' || echo "Function response (raw):"
}

# Main script logic
case "$1" in
    "simple"|"simplified"|"")
        check_emulators
        run_simplified_test
        ;;
    "comprehensive"|"full")
        check_emulators
        run_comprehensive_test
        ;;
    "test-function")
        check_emulators
        test_specific_function "$2"
        ;;
    "check")
        check_emulators
        echo "✅ Emulators are running correctly"
        ;;
    "help"|"-h"|"--help")
        echo ""
        echo "Usage: $0 [command] [options]"
        echo ""
        echo "Commands:"
        echo "  simple, simplified     Run simplified test suite (default)"
        echo "  comprehensive, full    Run comprehensive test suite with auth"
        echo "  test-function <name>   Test a specific function"
        echo "  check                  Check if emulators are running"
        echo "  help                   Show this help message"
        echo ""
        echo "Examples:"
        echo "  $0                     # Run simplified tests"
        echo "  $0 simple              # Run simplified tests"
        echo "  $0 comprehensive       # Run all tests including auth"
        echo "  $0 test-function ping  # Test only the ping function"
        echo "  $0 check               # Check emulator status"
        echo ""
        ;;
    *)
        echo "❌ Unknown command: $1"
        echo "Use '$0 help' for usage information"
        exit 1
        ;;
esac 