import * as functions from 'firebase-functions';
import * as logger from 'firebase-functions/logger';

/**
 * Simple test function to verify Cloud Functions v2 deployment
 */
export const simpleTest = functions.https.onCall(async () => {
  logger.info('Simple test function called');
  return {
    success: true,
    message: 'Simple test function working!',
    timestamp: new Date().toISOString(),
    nodeVersion: process.version
  };
}); 