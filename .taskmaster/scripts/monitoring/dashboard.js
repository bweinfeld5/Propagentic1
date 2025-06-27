#!/usr/bin/env node

/**
 * PropAgentic Background Agent Monitoring Dashboard
 * Real-time monitoring and status dashboard
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class MonitoringDashboard {
  constructor() {
    this.projectRoot = process.cwd();
    this.tasksFile = path.join(this.projectRoot, '.taskmaster/tasks/tasks.json');
    this.logFile = path.join(this.projectRoot, '.taskmaster/logs/agent.log');
    this.reportFile = path.join(this.projectRoot, '.taskmaster/reports/progress-report.json');
  }

  clearScreen() {
    process.stdout.write('\\x1Bc');
  }

  colorize(text, color) {
    const colors = {
      red: '\\x1b[31m',
      green: '\\x1b[32m',
      yellow: '\\x1b[33m',
      blue: '\\x1b[34m',
      magenta: '\\x1b[35m',
      cyan: '\\x1b[36m',
      white: '\\x1b[37m',
      reset: '\\x1b[0m',
      bold: '\\x1b[1m',
      dim: '\\x1b[2m'
    };
    return `${colors[color] || ''}${text}${colors.reset}`;
  }

  formatPercentage(value) {
    if (value >= 80) return this.colorize(`${value}%`, 'green');
    if (value >= 50) return this.colorize(`${value}%`, 'yellow');
    return this.colorize(`${value}%`, 'red');
  }

  formatStatus(status) {
    const statusColors = {
      'done': 'green',
      'in-progress': 'blue',
      'pending': 'yellow',
      'blocked': 'red',
      'cancelled': 'dim'
    };
    return this.colorize(status.toUpperCase(), statusColors[status] || 'white');
  }

  formatPriority(priority) {
    const priorityColors = {
      'high': 'red',
      'medium': 'yellow',
      'low': 'green'
    };
    return this.colorize(priority.toUpperCase(), priorityColors[priority] || 'white');
  }

  loadTasks() {
    if (!fs.existsSync(this.tasksFile)) {
      return { tasks: [] };
    }
    return JSON.parse(fs.readFileSync(this.tasksFile, 'utf8'));
  }

  loadProgressReport() {
    if (!fs.existsSync(this.reportFile)) {
      return null;
    }
    return JSON.parse(fs.readFileSync(this.reportFile, 'utf8'));
  }

  getRecentLogs(lines = 10) {
    if (!fs.existsSync(this.logFile)) {
      return [];
    }
    
    try {
      const logs = fs.readFileSync(this.logFile, 'utf8').split('\\n').filter(Boolean);
      return logs.slice(-lines);
    } catch (error) {
      return [];
    }
  }

  checkSystemHealth() {
    const health = {
      firebase: false,
      sendgrid: false,
      functions: false,
      database: false
    };

    try {
      // Check Firebase connection
      execSync('firebase projects:list', { stdio: 'ignore' });
      health.firebase = true;
    } catch (error) {
      // Firebase CLI not available or not logged in
    }

    try {
      // Check SendGrid configuration
      const config = execSync('cd functions && firebase functions:config:get', { encoding: 'utf8' });
      const parsedConfig = JSON.parse(config);
      health.sendgrid = !!(parsedConfig.sendgrid && parsedConfig.sendgrid.api_key);
    } catch (error) {
      // Config check failed
    }

    try {
      // Check if functions are deployed
      const functions = execSync('firebase functions:list', { encoding: 'utf8' });
      health.functions = functions.includes('sendInviteEmail');
    } catch (error) {
      // Functions check failed
    }

    // Database health is assumed true if tasks file exists
    health.database = fs.existsSync(this.tasksFile);

    return health;
  }

  renderHeader() {
    const now = new Date().toLocaleString();
    console.log(this.colorize('╔══════════════════════════════════════════════════════════════════════════════╗', 'cyan'));
    console.log(this.colorize('║', 'cyan') + this.colorize('                    PropAgentic Background Agent Dashboard                    ', 'bold') + this.colorize('║', 'cyan'));
    console.log(this.colorize('║', 'cyan') + `                              ${now}                              ` + this.colorize('║', 'cyan'));
    console.log(this.colorize('╚══════════════════════════════════════════════════════════════════════════════╝', 'cyan'));
    console.log();
  }

  renderSystemHealth() {
    const health = this.checkSystemHealth();
    
    console.log(this.colorize('🔧 SYSTEM HEALTH', 'bold'));
    console.log('━'.repeat(50));
    
    Object.entries(health).forEach(([service, status]) => {
      const icon = status ? '✅' : '❌';
      const statusText = status ? this.colorize('HEALTHY', 'green') : this.colorize('ISSUE', 'red');
      console.log(`${icon} ${service.toUpperCase().padEnd(12)} ${statusText}`);
    });
    console.log();
  }

  renderProgressOverview() {
    const report = this.loadProgressReport();
    if (!report) {
      console.log(this.colorize('📊 PROGRESS OVERVIEW', 'bold'));
      console.log('━'.repeat(50));
      console.log('No progress report available. Run the background agent first.');
      console.log();
      return;
    }

    console.log(this.colorize('📊 PROGRESS OVERVIEW', 'bold'));
    console.log('━'.repeat(50));
    
    const { progress } = report;
    console.log(`Total Tasks:     ${progress.total}`);
    console.log(`Completed:       ${this.colorize(progress.completed, 'green')} (${this.formatPercentage(progress.percentage)})`);
    console.log(`In Progress:     ${this.colorize(progress.inProgress, 'blue')}`);
    console.log(`Blocked:         ${this.colorize(progress.blocked, 'red')}`);
    console.log(`Pending:         ${progress.total - progress.completed - progress.inProgress - progress.blocked}`);
    
    // Progress bar
    const barLength = 40;
    const filledLength = Math.round((progress.percentage / 100) * barLength);
    const bar = '█'.repeat(filledLength) + '░'.repeat(barLength - filledLength);
    console.log(`Progress:        [${this.colorize(bar, 'green')}] ${this.formatPercentage(progress.percentage)}`);
    console.log();
  }

  renderPhaseProgress() {
    const report = this.loadProgressReport();
    if (!report || !report.phases) {
      return;
    }

    console.log(this.colorize('🎯 PHASE PROGRESS', 'bold'));
    console.log('━'.repeat(50));
    
    Object.entries(report.phases).forEach(([phase, data]) => {
      const percentage = data.percentage || 0;
      const status = percentage === 100 ? '✅' : percentage > 0 ? '🔄' : '⏳';
      console.log(`${status} ${phase.toUpperCase().padEnd(12)} ${data.completed}/${data.total} (${this.formatPercentage(percentage)})`);
    });
    console.log();
  }

  renderNextActions() {
    const report = this.loadProgressReport();
    if (!report || !report.nextActions || report.nextActions.length === 0) {
      return;
    }

    console.log(this.colorize('🚀 NEXT ACTIONS', 'bold'));
    console.log('━'.repeat(50));
    
    report.nextActions.slice(0, 5).forEach(action => {
      console.log(`${this.formatPriority(action.priority)} ${action.id}. ${action.title}`);
    });
    console.log();
  }

  renderBlockers() {
    const report = this.loadProgressReport();
    if (!report || !report.blockers || report.blockers.length === 0) {
      return;
    }

    console.log(this.colorize('🚫 BLOCKERS', 'bold'));
    console.log('━'.repeat(50));
    
    report.blockers.forEach(blocker => {
      console.log(`${this.colorize('❌', 'red')} ${blocker.id}. ${blocker.title}`);
      console.log(`   ${this.colorize(blocker.notes, 'dim')}`);
    });
    console.log();
  }

  renderRecentActivity() {
    const logs = this.getRecentLogs(8);
    if (logs.length === 0) {
      return;
    }

    console.log(this.colorize('📝 RECENT ACTIVITY', 'bold'));
    console.log('━'.repeat(50));
    
    logs.forEach(log => {
      // Parse log entry
      const match = log.match(/\\[(.*?)\\] \\[(.*?)\\] (.*)/);
      if (match) {
        const [, timestamp, level, message] = match;
        const time = new Date(timestamp).toLocaleTimeString();
        const levelColor = {
          'INFO': 'white',
          'SUCCESS': 'green',
          'WARN': 'yellow',
          'ERROR': 'red'
        }[level] || 'white';
        
        console.log(`${this.colorize(time, 'dim')} ${this.colorize(level, levelColor)} ${message}`);
      }
    });
    console.log();
  }

  renderCommands() {
    console.log(this.colorize('⌨️  COMMANDS', 'bold'));
    console.log('━'.repeat(50));
    console.log('r - Refresh dashboard');
    console.log('s - Run SendGrid setup');
    console.log('t - Test email sending');
    console.log('a - Run background agent');
    console.log('l - View full logs');
    console.log('q - Quit');
    console.log();
  }

  async handleCommand(command) {
    switch (command.toLowerCase()) {
      case 'r':
        // Refresh is handled by the main loop
        break;
      case 's':
        console.log('Running SendGrid setup...');
        try {
          execSync('node .taskmaster/scripts/automation/sendgrid-setup.js setup', { stdio: 'inherit' });
        } catch (error) {
          console.log(this.colorize('SendGrid setup failed', 'red'));
        }
        break;
      case 't':
        console.log('Testing email sending...');
        try {
          execSync('node .taskmaster/scripts/automation/sendgrid-setup.js test', { stdio: 'inherit' });
        } catch (error) {
          console.log(this.colorize('Email test failed', 'red'));
        }
        break;
      case 'a':
        console.log('Running background agent...');
        try {
          execSync('node .taskmaster/scripts/background-agent.js run', { stdio: 'inherit' });
        } catch (error) {
          console.log(this.colorize('Background agent failed', 'red'));
        }
        break;
      case 'l':
        console.log('\\n' + this.colorize('📋 FULL LOGS', 'bold'));
        console.log('━'.repeat(50));
        const allLogs = this.getRecentLogs(50);
        allLogs.forEach(log => console.log(log));
        console.log('\\nPress any key to continue...');
        await this.waitForKey();
        break;
      case 'q':
        console.log('Goodbye!');
        process.exit(0);
        break;
      default:
        console.log(this.colorize('Unknown command', 'red'));
    }
  }

  waitForKey() {
    return new Promise(resolve => {
      process.stdin.setRawMode(true);
      process.stdin.resume();
      process.stdin.once('data', () => {
        process.stdin.setRawMode(false);
        process.stdin.pause();
        resolve();
      });
    });
  }

  async render() {
    this.clearScreen();
    this.renderHeader();
    this.renderSystemHealth();
    this.renderProgressOverview();
    this.renderPhaseProgress();
    this.renderNextActions();
    this.renderBlockers();
    this.renderRecentActivity();
    this.renderCommands();
    
    process.stdout.write(this.colorize('Enter command: ', 'cyan'));
  }

  async run() {
    console.log(this.colorize('Starting PropAgentic Background Agent Dashboard...', 'green'));
    console.log('Press Ctrl+C to exit\\n');

    // Set up input handling
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', async (data) => {
      const command = data.toString().trim();
      if (command) {
        await this.handleCommand(command);
        setTimeout(() => this.render(), 1000);
      } else {
        this.render();
      }
    });

    // Initial render
    await this.render();
  }
}

// CLI interface
if (require.main === module) {
  const dashboard = new MonitoringDashboard();
  
  // Handle Ctrl+C gracefully
  process.on('SIGINT', () => {
    console.log('\\n\\nDashboard stopped.');
    process.exit(0);
  });
  
  dashboard.run().catch(console.error);
}

module.exports = MonitoringDashboard; 