#!/usr/bin/env node

/**
 * PropAgentic Background Agent
 * Automated system for rebuilding property creation and invitation system
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class BackgroundAgent {
  constructor() {
    this.projectRoot = process.cwd();
    this.tasksFile = path.join(this.projectRoot, '.taskmaster/tasks/tasks.json');
    this.logFile = path.join(this.projectRoot, '.taskmaster/logs/agent.log');
    this.configFile = path.join(this.projectRoot, '.taskmaster/config/agent-config.json');
    
    this.ensureDirectories();
    this.loadConfig();
  }

  ensureDirectories() {
    const dirs = [
      '.taskmaster/logs',
      '.taskmaster/config',
      '.taskmaster/scripts/automation',
      '.taskmaster/monitoring'
    ];
    
    dirs.forEach(dir => {
      const fullPath = path.join(this.projectRoot, dir);
      if (!fs.existsSync(fullPath)) {
        fs.mkdirSync(fullPath, { recursive: true });
      }
    });
  }

  loadConfig() {
    const defaultConfig = {
      autoMode: false,
      checkInterval: 30000, // 30 seconds
      emailNotifications: true,
      slackWebhook: null,
      maxRetries: 3,
      phases: {
        foundation: ['1', '2', '3', '4', '5'],
        development: ['6', '7', '8', '9', '10'],
        integration: ['11', '12', '13', '14', '15'],
        testing: ['17', '18', '19', '20'],
        deployment: ['21', '22', '23', '24', '25']
      }
    };

    if (fs.existsSync(this.configFile)) {
      this.config = { ...defaultConfig, ...JSON.parse(fs.readFileSync(this.configFile, 'utf8')) };
    } else {
      this.config = defaultConfig;
      this.saveConfig();
    }
  }

  saveConfig() {
    fs.writeFileSync(this.configFile, JSON.stringify(this.config, null, 2));
  }

  log(message, level = 'INFO') {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] [${level}] ${message}\\n`;
    
    console.log(logEntry.trim());
    
    if (!fs.existsSync(this.logFile)) {
      fs.writeFileSync(this.logFile, '');
    }
    fs.appendFileSync(this.logFile, logEntry);
  }

  loadTasks() {
    if (!fs.existsSync(this.tasksFile)) {
      throw new Error('Tasks file not found. Run task-master init first.');
    }
    return JSON.parse(fs.readFileSync(this.tasksFile, 'utf8'));
  }

  saveTasks(tasks) {
    fs.writeFileSync(this.tasksFile, JSON.stringify(tasks, null, 2));
  }

  async checkEmailInfrastructure() {
    this.log('Checking email infrastructure status...');
    
    try {
      // Check if SendGrid is configured
      const functionsConfig = execSync('cd functions && firebase functions:config:get', { encoding: 'utf8' });
      const config = JSON.parse(functionsConfig);
      
      if (!config.sendgrid || !config.sendgrid.api_key) {
        this.log('SendGrid API key not configured', 'ERROR');
        return false;
      }

      // Test email sending capability
      this.log('Testing email sending capability...');
      const testResult = execSync('cd functions && firebase functions:call testPing', { encoding: 'utf8' });
      
      if (testResult.includes('success')) {
        this.log('Email infrastructure check passed', 'SUCCESS');
        return true;
      } else {
        this.log('Email infrastructure check failed', 'ERROR');
        return false;
      }
    } catch (error) {
      this.log(`Email infrastructure check error: ${error.message}`, 'ERROR');
      return false;
    }
  }

  async runSendGridVerificationGuide() {
    this.log('Starting SendGrid verification guide...');
    
    const guide = `
🔧 SENDGRID VERIFICATION REQUIRED

The background agent has detected that SendGrid sender verification is needed.
Please complete these steps:

1. Log into SendGrid Dashboard: https://app.sendgrid.com
2. Navigate to Settings → Sender Authentication
3. Click "Verify a Single Sender"
4. Add and verify: noreply@propagentic.com
5. Optionally add: support@propagentic.com

Once verification is complete, the background agent will automatically proceed.

Current Status: WAITING FOR MANUAL VERIFICATION
Next Check: ${new Date(Date.now() + this.config.checkInterval).toLocaleTimeString()}
    `;
    
    console.log(guide);
    this.log('SendGrid verification guide displayed');
    
    // Create verification status file
    const statusFile = path.join(this.projectRoot, '.taskmaster/status/sendgrid-verification.json');
    fs.writeFileSync(statusFile, JSON.stringify({
      status: 'pending',
      timestamp: new Date().toISOString(),
      instructions: guide
    }, null, 2));
  }

  async automateFoundationTasks() {
    this.log('Starting foundation tasks automation...');
    
    const tasks = this.loadTasks();
    const foundationTasks = this.config.phases.foundation;
    
    for (const taskId of foundationTasks) {
      const task = tasks.tasks.find(t => t.id === taskId);
      if (!task) continue;
      
      this.log(`Processing task ${taskId}: ${task.title}`);
      
      switch (taskId) {
        case '1': // Email Infrastructure Foundation
          await this.handleEmailInfrastructureTask(task);
          break;
        case '2': // SendGrid Sender Verification
          await this.handleSenderVerificationTask(task);
          break;
        case '3': // Domain Authentication Setup
          await this.handleDomainAuthTask(task);
          break;
        case '4': // Email Service Architecture Cleanup
          await this.handleArchitectureCleanupTask(task);
          break;
        case '5': // Enhanced Email Service Implementation
          await this.handleEmailServiceTask(task);
          break;
      }
    }
  }

  async handleEmailInfrastructureTask(task) {
    this.log('Handling email infrastructure foundation...');
    
    // Check current email infrastructure status
    const isConfigured = await this.checkEmailInfrastructure();
    
    if (!isConfigured) {
      await this.runSendGridVerificationGuide();
      task.status = 'blocked';
      task.notes = 'Waiting for SendGrid sender verification';
    } else {
      task.status = 'done';
      task.completedAt = new Date().toISOString();
      this.log('Email infrastructure foundation completed', 'SUCCESS');
    }
  }

  async handleSenderVerificationTask(task) {
    this.log('Checking SendGrid sender verification...');
    
    // This would typically involve API calls to SendGrid to check verification status
    // For now, we'll check if emails can be sent successfully
    try {
      const testResult = await this.testEmailSending();
      if (testResult) {
        task.status = 'done';
        task.completedAt = new Date().toISOString();
        this.log('SendGrid sender verification confirmed', 'SUCCESS');
      } else {
        task.status = 'blocked';
        task.notes = 'Sender verification still pending';
      }
    } catch (error) {
      this.log(`Sender verification check failed: ${error.message}`, 'ERROR');
      task.status = 'blocked';
    }
  }

  async testEmailSending() {
    try {
      // Test email sending through the deployed function
      const result = execSync('cd functions && firebase functions:call testSendGrid', { encoding: 'utf8' });
      return result.includes('success') && !result.includes('error');
    } catch (error) {
      return false;
    }
  }

  async handleDomainAuthTask(task) {
    this.log('Checking domain authentication setup...');
    
    // For now, we'll mark this as pending since it requires manual DNS configuration
    task.status = 'pending';
    task.notes = 'Requires manual DNS configuration for SPF, DKIM, and DMARC records';
    this.log('Domain authentication setup requires manual configuration', 'WARN');
  }

  async handleArchitectureCleanupTask(task) {
    this.log('Checking email service architecture...');
    
    // Check if the current architecture is clean (no Firebase Mail Extension dependencies)
    try {
      // This is a simplified check - in reality, we'd scan the codebase
      task.status = 'pending';
      task.notes = 'Requires code review to remove Firebase Mail Extension dependencies';
      this.log('Email service architecture cleanup pending', 'INFO');
    } catch (error) {
      this.log(`Architecture cleanup check failed: ${error.message}`, 'ERROR');
      task.status = 'blocked';
    }
  }

  async handleEmailServiceTask(task) {
    this.log('Checking enhanced email service implementation...');
    
    // Check if the enhanced email service is implemented
    try {
      // This would check for retry logic, monitoring, etc.
      task.status = 'pending';
      task.notes = 'Requires implementation of retry logic and monitoring';
      this.log('Enhanced email service implementation pending', 'INFO');
    } catch (error) {
      this.log(`Email service check failed: ${error.message}`, 'ERROR');
      task.status = 'blocked';
    }
  }

  async generateProgressReport() {
    const tasks = this.loadTasks();
    const totalTasks = tasks.tasks.length;
    const completedTasks = tasks.tasks.filter(t => t.status === 'done').length;
    const blockedTasks = tasks.tasks.filter(t => t.status === 'blocked').length;
    const inProgressTasks = tasks.tasks.filter(t => t.status === 'in-progress').length;
    
    const report = {
      timestamp: new Date().toISOString(),
      progress: {
        total: totalTasks,
        completed: completedTasks,
        blocked: blockedTasks,
        inProgress: inProgressTasks,
        percentage: Math.round((completedTasks / totalTasks) * 100)
      },
      phases: {},
      nextActions: [],
      blockers: []
    };

    // Analyze progress by phase
    Object.entries(this.config.phases).forEach(([phase, taskIds]) => {
      const phaseTasks = tasks.tasks.filter(t => taskIds.includes(t.id));
      const phaseCompleted = phaseTasks.filter(t => t.status === 'done').length;
      
      report.phases[phase] = {
        total: phaseTasks.length,
        completed: phaseCompleted,
        percentage: Math.round((phaseCompleted / phaseTasks.length) * 100)
      };
    });

    // Identify next actions
    const readyTasks = tasks.tasks.filter(t => 
      t.status === 'pending' && 
      t.dependencies.every(depId => 
        tasks.tasks.find(dt => dt.id === depId)?.status === 'done'
      )
    );

    report.nextActions = readyTasks.slice(0, 5).map(t => ({
      id: t.id,
      title: t.title,
      priority: t.priority
    }));

    // Identify blockers
    report.blockers = tasks.tasks
      .filter(t => t.status === 'blocked')
      .map(t => ({
        id: t.id,
        title: t.title,
        notes: t.notes || 'No details available'
      }));

    return report;
  }

  async sendNotification(message, type = 'info') {
    if (this.config.emailNotifications) {
      // Email notification logic would go here
      this.log(`Notification: ${message}`, type.toUpperCase());
    }

    if (this.config.slackWebhook) {
      // Slack notification logic would go here
      this.log(`Slack notification: ${message}`, type.toUpperCase());
    }
  }

  async run() {
    this.log('Background Agent starting...');
    
    try {
      // Generate initial progress report
      const report = await this.generateProgressReport();
      this.log(`Initial progress: ${report.progress.percentage}% complete`);
      
      // Check if foundation phase is complete
      if (report.phases.foundation.percentage < 100) {
        this.log('Foundation phase incomplete, starting automation...');
        await this.automateFoundationTasks();
      }
      
      // Save updated tasks
      const tasks = this.loadTasks();
      this.saveTasks(tasks);
      
      // Generate final report
      const finalReport = await this.generateProgressReport();
      
      console.log('\\n📊 PROGRESS REPORT');
      console.log('==================');
      console.log(`Overall Progress: ${finalReport.progress.percentage}%`);
      console.log(`Completed Tasks: ${finalReport.progress.completed}/${finalReport.progress.total}`);
      console.log(`Blocked Tasks: ${finalReport.progress.blocked}`);
      
      if (finalReport.nextActions.length > 0) {
        console.log('\\n🎯 NEXT ACTIONS:');
        finalReport.nextActions.forEach(action => {
          console.log(`  ${action.id}. ${action.title} (${action.priority})`);
        });
      }
      
      if (finalReport.blockers.length > 0) {
        console.log('\\n🚫 BLOCKERS:');
        finalReport.blockers.forEach(blocker => {
          console.log(`  ${blocker.id}. ${blocker.title}: ${blocker.notes}`);
        });
      }
      
      // Save progress report
      const reportFile = path.join(this.projectRoot, '.taskmaster/reports/progress-report.json');
      fs.writeFileSync(reportFile, JSON.stringify(finalReport, null, 2));
      
      this.log('Background Agent completed successfully');
      
    } catch (error) {
      this.log(`Background Agent error: ${error.message}`, 'ERROR');
      throw error;
    }
  }
}

// CLI interface
if (require.main === module) {
  const agent = new BackgroundAgent();
  
  const command = process.argv[2];
  
  switch (command) {
    case 'run':
      agent.run().catch(console.error);
      break;
    case 'status':
      agent.generateProgressReport().then(report => {
        console.log(JSON.stringify(report, null, 2));
      });
      break;
    case 'config':
      console.log(JSON.stringify(agent.config, null, 2));
      break;
    default:
      console.log(`
PropAgentic Background Agent

Usage:
  node background-agent.js run     - Run the background agent
  node background-agent.js status  - Show progress status
  node background-agent.js config  - Show configuration

The background agent will:
1. Check email infrastructure status
2. Guide through SendGrid verification
3. Automate foundation tasks
4. Monitor progress and report blockers
5. Provide next action recommendations
      `);
  }
}

module.exports = BackgroundAgent; 