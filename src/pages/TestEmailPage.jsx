import React, { useState } from 'react';
import { addDoc, collection } from 'firebase/firestore';
import { db } from '../firebase/config';
import { toast } from 'react-hot-toast';

const TestEmailPage = () => {
  const [email, setEmail] = useState('bweinfeld15@gmail.com');
  const [subject, setSubject] = useState('SendGrid Test from PropAgentic');
  const [sending, setSending] = useState(false);

  const sendTestEmail = async () => {
    setSending(true);
    try {
      const emailData = {
        to: email,
        subject: subject,
        text: `This is a test email to verify SendGrid integration is working.
        
        Sent at: ${new Date().toISOString()}
        
        If you receive this email, the SendGrid integration is successful!`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
            <div style="background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
              <h1 style="color: #176B5D; margin-bottom: 20px;">🎉 SendGrid Integration Test</h1>
              <p style="font-size: 16px; line-height: 1.6; color: #333;">
                This is a test email to verify that SendGrid integration is working correctly with the Firebase Extension.
              </p>
              <div style="background-color: #f0f8ff; padding: 15px; border-radius: 4px; margin: 20px 0;">
                <p style="margin: 0; font-weight: bold; color: #176B5D;">✅ Test Details:</p>
                <ul style="margin: 10px 0 0 20px; color: #555;">
                  <li>Provider: SendGrid SMTP</li>
                  <li>Extension: firebase/firestore-send-email</li>
                  <li>Sent: ${new Date().toLocaleString()}</li>
                </ul>
              </div>
              <p style="font-size: 16px; line-height: 1.6; color: #333;">
                If you're seeing this email, the SendGrid integration is <strong>successful</strong>! 🚀
              </p>
              <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
              <p style="font-size: 12px; color: #888; text-align: center;">
                Sent from PropAgentic Email System via SendGrid
              </p>
            </div>
          </div>
        `
      };

      const docRef = await addDoc(collection(db, 'mail'), emailData);
      toast.success(`Test email queued successfully! Document ID: ${docRef.id}`);
      console.log('Test email queued with ID:', docRef.id);
    } catch (error) {
      console.error('Error sending test email:', error);
      toast.error('Failed to send test email: ' + error.message);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">📧 SendGrid Email Test</h1>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Recipient Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="test@example.com"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Subject
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Test email subject"
            />
          </div>
          
          <button
            onClick={sendTestEmail}
            disabled={sending}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {sending ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Sending...
              </>
            ) : (
              'Send Test Email'
            )}
          </button>
        </div>
        
        <div className="mt-6 p-4 bg-gray-50 rounded-md">
          <h3 className="text-sm font-medium text-gray-900 mb-2">Configuration Status:</h3>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>✅ Provider: SendGrid SMTP</li>
            <li>✅ Extension: firebase/firestore-send-email</li>
            <li>✅ API Key: Configured in Secret Manager</li>
            <li>✅ Collection: mail</li>
            <li>✅ From: ben@propagenticai.com</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default TestEmailPage; 