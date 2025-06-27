#!/bin/bash

# PropAgentic Background Agent Startup Script
# Launches the complete background agent system for rebuilding property creation and invitation system

set -e

# Colors for output
RED='\\033[0;31m'
GREEN='\\033[0;32m'
YELLOW='\\033[1;33m'
BLUE='\\033[0;34m'
PURPLE='\\033[0;35m'
CYAN='\\033[0;36m'
NC='\\033[0m' # No Color

# Function to print colored output
print_color() {
    printf "${1}${2}${NC}\\n"
}

# Function to print section headers
print_header() {
    echo
    print_color $CYAN "╔══════════════════════════════════════════════════════════════════════════════╗"
    printf "${CYAN}║${NC}%-78s${CYAN}║${NC}\\n" "  $1"
    print_color $CYAN "╚══════════════════════════════════════════════════════════════════════════════╝"
    echo
}

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to check prerequisites
check_prerequisites() {
    print_header "CHECKING PREREQUISITES"
    
    local all_good=true
    
    # Check Node.js
    if command_exists node; then
        local node_version=$(node --version)
        print_color $GREEN "✅ Node.js: $node_version"
    else
        print_color $RED "❌ Node.js not found. Please install Node.js 18 or higher."
        all_good=false
    fi
    
    # Check npm
    if command_exists npm; then
        local npm_version=$(npm --version)
        print_color $GREEN "✅ npm: v$npm_version"
    else
        print_color $RED "❌ npm not found. Please install npm."
        all_good=false
    fi
    
    # Check Firebase CLI
    if command_exists firebase; then
        local firebase_version=$(firebase --version | head -n1)
        print_color $GREEN "✅ Firebase CLI: $firebase_version"
    else
        print_color $RED "❌ Firebase CLI not found. Please install: npm install -g firebase-tools"
        all_good=false
    fi
    
    # Check if logged into Firebase
    if firebase projects:list >/dev/null 2>&1; then
        print_color $GREEN "✅ Firebase authentication: Logged in"
    else
        print_color $YELLOW "⚠️  Firebase authentication: Not logged in. Run 'firebase login' if needed."
    fi
    
    # Check Task Master files
    if [ -f ".taskmaster/tasks/tasks.json" ]; then
        print_color $GREEN "✅ Task Master: Initialized"
    else
        print_color $YELLOW "⚠️  Task Master: Not fully initialized"
    fi
    
    # Check functions directory
    if [ -d "functions" ]; then
        print_color $GREEN "✅ Functions directory: Found"
    else
        print_color $RED "❌ Functions directory not found. Please ensure you're in the project root."
        all_good=false
    fi
    
    if [ "$all_good" = false ]; then
        print_color $RED "❌ Prerequisites check failed. Please resolve the issues above."
        exit 1
    fi
    
    print_color $GREEN "✅ All prerequisites satisfied!"
}

# Function to make scripts executable
make_scripts_executable() {
    print_header "PREPARING SCRIPTS"
    
    chmod +x .taskmaster/scripts/background-agent.js
    chmod +x .taskmaster/scripts/automation/sendgrid-setup.js
    chmod +x .taskmaster/scripts/monitoring/dashboard.js
    
    print_color $GREEN "✅ Scripts made executable"
}

# Function to show menu
show_menu() {
    print_header "PROPAGENTIC BACKGROUND AGENT SYSTEM"
    
    echo "Choose an option:"
    echo
    print_color $CYAN "1) 🚀 Run Background Agent (Full Automation)"
    print_color $CYAN "2) 📊 Launch Monitoring Dashboard"
    print_color $CYAN "3) 🔧 SendGrid Setup & Testing"
    print_color $CYAN "4) 📋 View Current Status"
    print_color $CYAN "5) 📖 Show Documentation"
    print_color $CYAN "6) 🧹 Clean Logs"
    print_color $CYAN "7) ❌ Exit"
    echo
    printf "Enter your choice (1-7): "
}

# Function to run background agent
run_background_agent() {
    print_header "RUNNING BACKGROUND AGENT"
    
    print_color $BLUE "Starting automated rebuild process..."
    print_color $YELLOW "This will:"
    echo "  • Check email infrastructure status"
    echo "  • Guide through SendGrid verification if needed"
    echo "  • Automate foundation tasks"
    echo "  • Monitor progress and report blockers"
    echo "  • Provide next action recommendations"
    echo
    
    node .taskmaster/scripts/background-agent.js run
    
    echo
    print_color $GREEN "Background agent completed. Check the logs for details."
    read -p "Press Enter to continue..."
}

# Function to launch monitoring dashboard
launch_dashboard() {
    print_header "LAUNCHING MONITORING DASHBOARD"
    
    print_color $BLUE "Starting real-time monitoring dashboard..."
    print_color $YELLOW "Dashboard features:"
    echo "  • Real-time progress tracking"
    echo "  • System health monitoring"
    echo "  • Interactive commands"
    echo "  • Live log viewing"
    echo
    
    node .taskmaster/scripts/monitoring/dashboard.js
}

# Function to run SendGrid setup
run_sendgrid_setup() {
    print_header "SENDGRID SETUP & TESTING"
    
    echo "Choose SendGrid action:"
    echo
    print_color $CYAN "1) Complete Setup (Check + Deploy + Test)"
    print_color $CYAN "2) Test Email Sending Only"
    print_color $CYAN "3) Deploy Functions Only"
    print_color $CYAN "4) Show Verification Guide"
    print_color $CYAN "5) Back to Main Menu"
    echo
    printf "Enter your choice (1-5): "
    
    read sendgrid_choice
    
    case $sendgrid_choice in
        1)
            print_color $BLUE "Running complete SendGrid setup..."
            node .taskmaster/scripts/automation/sendgrid-setup.js setup
            ;;
        2)
            print_color $BLUE "Testing email sending..."
            node .taskmaster/scripts/automation/sendgrid-setup.js test
            ;;
        3)
            print_color $BLUE "Deploying functions..."
            node .taskmaster/scripts/automation/sendgrid-setup.js deploy
            ;;
        4)
            print_color $BLUE "Showing verification guide..."
            node .taskmaster/scripts/automation/sendgrid-setup.js guide
            ;;
        5)
            return
            ;;
        *)
            print_color $RED "Invalid choice. Please try again."
            ;;
    esac
    
    echo
    read -p "Press Enter to continue..."
}

# Function to view current status
view_status() {
    print_header "CURRENT STATUS"
    
    print_color $BLUE "Generating status report..."
    node .taskmaster/scripts/background-agent.js status
    
    echo
    read -p "Press Enter to continue..."
}

# Function to show documentation
show_documentation() {
    print_header "DOCUMENTATION"
    
    echo "📚 Available Documentation:"
    echo
    
    if [ -f ".taskmaster/docs/prd.txt" ]; then
        print_color $GREEN "✅ Product Requirements Document: .taskmaster/docs/prd.txt"
    fi
    
    if [ -f ".taskmaster/docs/sendgrid-verification-guide.md" ]; then
        print_color $GREEN "✅ SendGrid Verification Guide: .taskmaster/docs/sendgrid-verification-guide.md"
    fi
    
    if [ -f "functions/SENDGRID_SETUP.md" ]; then
        print_color $GREEN "✅ SendGrid Setup Instructions: functions/SENDGRID_SETUP.md"
    fi
    
    echo
    print_color $CYAN "📋 Task Management:"
    echo "  • View tasks: .taskmaster/tasks/tasks.json"
    echo "  • Progress reports: .taskmaster/reports/"
    echo "  • Logs: .taskmaster/logs/"
    echo
    
    print_color $CYAN "🔧 Scripts:"
    echo "  • Background Agent: .taskmaster/scripts/background-agent.js"
    echo "  • SendGrid Setup: .taskmaster/scripts/automation/sendgrid-setup.js"
    echo "  • Monitoring Dashboard: .taskmaster/scripts/monitoring/dashboard.js"
    echo
    
    read -p "Press Enter to continue..."
}

# Function to clean logs
clean_logs() {
    print_header "CLEANING LOGS"
    
    if [ -d ".taskmaster/logs" ]; then
        print_color $YELLOW "Cleaning log files..."
        rm -f .taskmaster/logs/*.log
        print_color $GREEN "✅ Logs cleaned"
    else
        print_color $BLUE "No logs to clean"
    fi
    
    echo
    read -p "Press Enter to continue..."
}

# Main execution
main() {
    # Clear screen
    clear
    
    # Check prerequisites
    check_prerequisites
    
    # Make scripts executable
    make_scripts_executable
    
    # Main menu loop
    while true; do
        clear
        show_menu
        read choice
        
        case $choice in
            1)
                run_background_agent
                ;;
            2)
                launch_dashboard
                ;;
            3)
                run_sendgrid_setup
                ;;
            4)
                view_status
                ;;
            5)
                show_documentation
                ;;
            6)
                clean_logs
                ;;
            7)
                print_color $GREEN "Goodbye!"
                exit 0
                ;;
            *)
                print_color $RED "Invalid choice. Please try again."
                sleep 2
                ;;
        esac
    done
}

# Run main function
main 