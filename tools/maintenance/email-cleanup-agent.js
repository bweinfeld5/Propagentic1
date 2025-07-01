#!/usr/bin/env node

/**
 * InvitationEmailRefiner Cleanup Agent
 * 
 * This script identifies and removes obsolete email templates and helper functions
 * after the unified email system has been implemented.
 */

const fs = require('fs');
const path = require('path');

// Files and patterns to be removed or updated
const CLEANUP_TARGETS = {
  // Obsolete email template files
  filesToDelete: [
    'email-templates/tenant-invitation.html',
    'email-templates/base-template.html',
    'email-templates/README.md',
    'functions/src/emailSequences.js',
    'functions/lib/sendgridEmailService.js',
    'src/scripts/test-invite-process.js',
    'test-email-fix.js',
    'temp-tenant-dashboard.jsx'
  ],
  
  // Functions/services that need updating to use unified service
  filesToUpdate: [
    'functions/src/sendgridEmailService.ts',
    'functions/src/invites.ts', 
    'functions/lib/invites.js',
    'functions/src/index.ts',
    'functions/lib/index.js',
    'src/pages/PreLaunchPage.jsx',
    'src/services/dataService.js'
  ],
  
  // Pattern-based cleanup (functions to remove)
  functionsToRemove: [
    'sendPropertyInviteEmail',
    'getPreLaunchEmailTemplate',
    'getSupporterEmailTemplate',
    'sendInvitationEmail'
  ]
};

class EmailCleanupAgent {
  constructor() {
    this.projectRoot = process.cwd();
    this.deletedFiles = [];
    this.updatedFiles = [];
    this.errors = [];
  }

  /**
   * Main cleanup process
   */
  async run() {
    console.log('🧹 InvitationEmailRefiner Cleanup Agent Starting...\n');
    
    try {
      // Step 1: Backup existing files
      await this.createBackup();
      
      // Step 2: Delete obsolete files
      await this.deleteObsoleteFiles();
      
      // Step 3: Update files to use unified service
      await this.updateFilesToUseUnifiedService();
      
      // Step 4: Validate build still works
      await this.validateBuild();
      
      // Step 5: Generate report
      this.generateReport();
      
    } catch (error) {
      console.error('❌ Cleanup failed:', error);
      this.errors.push(error.message);
    }
  }

  /**
   * Create backup of files before cleanup
   */
  async createBackup() {
    console.log('📦 Creating backup...');
    const backupDir = path.join(this.projectRoot, 'backups', 'email-cleanup-' + Date.now());
    
    if (!fs.existsSync(path.dirname(backupDir))) {
      fs.mkdirSync(path.dirname(backupDir), { recursive: true });
    }
    fs.mkdirSync(backupDir, { recursive: true });

    // Backup files that will be deleted or modified
    const allTargets = [...CLEANUP_TARGETS.filesToDelete, ...CLEANUP_TARGETS.filesToUpdate];
    
    for (const file of allTargets) {
      const sourcePath = path.join(this.projectRoot, file);
      if (fs.existsSync(sourcePath)) {
        const backupPath = path.join(backupDir, file);
        const backupParentDir = path.dirname(backupPath);
        
        if (!fs.existsSync(backupParentDir)) {
          fs.mkdirSync(backupParentDir, { recursive: true });
        }
        
        fs.copyFileSync(sourcePath, backupPath);
        console.log(`  ✅ Backed up: ${file}`);
      }
    }
    
    console.log(`📦 Backup created at: ${backupDir}\n`);
  }

  /**
   * Delete obsolete email template files
   */
  async deleteObsoleteFiles() {
    console.log('🗑️  Deleting obsolete files...');
    
    for (const file of CLEANUP_TARGETS.filesToDelete) {
      const filePath = path.join(this.projectRoot, file);
      
      if (fs.existsSync(filePath)) {
        try {
          fs.unlinkSync(filePath);
          this.deletedFiles.push(file);
          console.log(`  ✅ Deleted: ${file}`);
        } catch (error) {
          console.log(`  ❌ Failed to delete: ${file} - ${error.message}`);
          this.errors.push(`Failed to delete ${file}: ${error.message}`);
        }
      } else {
        console.log(`  ⚠️  File not found: ${file}`);
      }
    }
    
    console.log('');
  }

  /**
   * Update files to use the unified email service
   */
  async updateFilesToUseUnifiedService() {
    console.log('🔄 Updating files to use unified service...');
    
    // Update functions/src/invites.ts to use unified service
    await this.updateInvitesFunction();
    
    // Update sendgridEmailService.ts to remove duplicate logic
    await this.updateSendGridService();
    
    // Remove email template references from other files
    await this.removeEmailTemplateReferences();
    
    console.log('');
  }

  /**
   * Update the invites function to use unified service
   */
  async updateInvitesFunction() {
    const filePath = path.join(this.projectRoot, 'functions/src/invites.ts');
    
    if (!fs.existsSync(filePath)) {
      console.log('  ⚠️  invites.ts not found, skipping...');
      return;
    }

    try {
      let content = fs.readFileSync(filePath, 'utf8');
      
      // Remove old sendPropertyInviteEmail import and usage
      content = content.replace(
        /import.*sendPropertyInviteEmail.*from.*sendgridEmailService.*\n/g, 
        ''
      );
      
      // Remove the email sending logic since it's now in inviteService
      content = content.replace(
        /const emailSent = await sendPropertyInviteEmail\([^}]+\};\s*}/gs,
        '// Email sending now handled by unified service in inviteService'
      );
      
      // Add comment about the migration
      if (!content.includes('// NOTE: Email sending migrated to unified service')) {
        content = `// NOTE: Email sending migrated to unified service in src/services/unifiedEmailService.ts\n${content}`;
      }
      
      fs.writeFileSync(filePath, content);
      this.updatedFiles.push('functions/src/invites.ts');
      console.log('  ✅ Updated: functions/src/invites.ts');
      
    } catch (error) {
      console.log(`  ❌ Failed to update invites.ts: ${error.message}`);
      this.errors.push(`Failed to update invites.ts: ${error.message}`);
    }
  }

  /**
   * Update sendgridEmailService.ts to remove duplicate invitation logic
   */
  async updateSendGridService() {
    const filePath = path.join(this.projectRoot, 'functions/src/sendgridEmailService.ts');
    
    if (!fs.existsSync(filePath)) {
      console.log('  ⚠️  sendgridEmailService.ts not found, skipping...');
      return;
    }

    try {
      let content = fs.readFileSync(filePath, 'utf8');
      
      // Remove the sendPropertyInviteEmail function
      content = content.replace(
        /export const sendPropertyInviteEmail[\s\S]*?^};$/gm,
        '// REMOVED: sendPropertyInviteEmail function migrated to unified service'
      );
      
      // Add migration note
      if (!content.includes('// NOTE: Invitation email logic migrated')) {
        content = `// NOTE: Invitation email logic migrated to src/services/unifiedEmailService.ts\n${content}`;
      }
      
      fs.writeFileSync(filePath, content);
      this.updatedFiles.push('functions/src/sendgridEmailService.ts');
      console.log('  ✅ Updated: functions/src/sendgridEmailService.ts');
      
    } catch (error) {
      console.log(`  ❌ Failed to update sendgridEmailService.ts: ${error.message}`);
      this.errors.push(`Failed to update sendgridEmailService.ts: ${error.message}`);
    }
  }

  /**
   * Remove email template references from other files
   */
  async removeEmailTemplateReferences() {
    const files = [
      'src/pages/PreLaunchPage.jsx',
      'src/services/dataService.js'
    ];

    for (const file of files) {
      const filePath = path.join(this.projectRoot, file);
      
      if (!fs.existsSync(filePath)) {
        console.log(`  ⚠️  ${file} not found, skipping...`);
        continue;
      }

      try {
        let content = fs.readFileSync(filePath, 'utf8');
        let modified = false;
        
        // Remove email template functions
        for (const funcName of CLEANUP_TARGETS.functionsToRemove) {
          const funcRegex = new RegExp(`const ${funcName}[\\s\\S]*?^};$`, 'gm');
          if (content.match(funcRegex)) {
            content = content.replace(funcRegex, `// REMOVED: ${funcName} function - migrated to unified service`);
            modified = true;
          }
        }
        
        if (modified) {
          fs.writeFileSync(filePath, content);
          this.updatedFiles.push(file);
          console.log(`  ✅ Updated: ${file}`);
        }
        
      } catch (error) {
        console.log(`  ❌ Failed to update ${file}: ${error.message}`);
        this.errors.push(`Failed to update ${file}: ${error.message}`);
      }
    }
  }

  /**
   * Validate that the build still works after cleanup
   */
  async validateBuild() {
    console.log('🔍 Validating build...');
    
    try {
      const { execSync } = require('child_process');
      
      // Run TypeScript check
      console.log('  🔍 Running TypeScript check...');
      execSync('npm run build', { 
        cwd: this.projectRoot, 
        stdio: 'pipe' 
      });
      
      console.log('  ✅ Build validation passed');
      
    } catch (error) {
      console.log('  ❌ Build validation failed');
      this.errors.push('Build validation failed: ' + error.message);
    }
    
    console.log('');
  }

  /**
   * Generate cleanup report
   */
  generateReport() {
    console.log('📊 Cleanup Report');
    console.log('==================');
    
    console.log(`\n✅ Files Deleted (${this.deletedFiles.length}):`);
    this.deletedFiles.forEach(file => console.log(`  - ${file}`));
    
    console.log(`\n🔄 Files Updated (${this.updatedFiles.length}):`);
    this.updatedFiles.forEach(file => console.log(`  - ${file}`));
    
    if (this.errors.length > 0) {
      console.log(`\n❌ Errors (${this.errors.length}):`);
      this.errors.forEach(error => console.log(`  - ${error}`));
    }
    
    console.log('\n🎉 New Unified System:');
    console.log('  - UnifiedInviteEmail component: src/components/emails/UnifiedInviteEmail.tsx');
    console.log('  - Unified email service: src/services/unifiedEmailService.ts');
    console.log('  - Updated invite service: src/services/firestore/inviteService.ts');
    
    console.log('\n✨ Benefits:');
    console.log('  - Single source of truth for invitation emails');
    console.log('  - Consistent branding and styling');
    console.log('  - Better maintainability');
    console.log('  - Enhanced mobile responsiveness');
    console.log('  - Improved accessibility');
    
    // Write report to file
    const reportPath = path.join(this.projectRoot, 'email-cleanup-report.json');
    const report = {
      timestamp: new Date().toISOString(),
      deletedFiles: this.deletedFiles,
      updatedFiles: this.updatedFiles,
      errors: this.errors,
      unifiedComponents: [
        'src/components/emails/UnifiedInviteEmail.tsx',
        'src/services/unifiedEmailService.ts',
        'src/services/firestore/inviteService.ts'
      ]
    };
    
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`\n📄 Full report saved to: ${reportPath}`);
  }
}

// Run the cleanup agent
if (require.main === module) {
  const agent = new EmailCleanupAgent();
  agent.run().catch(console.error);
}

module.exports = EmailCleanupAgent; 