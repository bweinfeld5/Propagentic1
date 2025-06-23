import React from 'react';
import Button from '../../ui/Button'; // Assuming Button component exists

// Placeholder icon, replace with actual Mailbox icon later
const MailboxIcon = () => (
  <svg className="h-16 w-16 text-primary dark:text-primary-light mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
  </svg>
);

const WaitingCard = ({ onResendEmail, onContactLandlord }) => {
  return (
    <div className="bg-background dark:bg-background-dark shadow-xl rounded-xl p-8 md:p-12 max-w-2xl mx-auto text-center">
      <MailboxIcon />
      <h1 className="text-3xl font-bold text-content dark:text-content-dark mt-6 mb-4">
        Waiting on your invite?
      </h1>
      <p className="text-content-secondary dark:text-content-darkSecondary mb-8 max-w-md mx-auto">
        Your landlord has started the invitation process. Once you receive the email, you can set up your tenant profile and access your dashboard.
      </p>
      <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
        <Button variant="primary" onClick={onResendEmail} className="w-full sm:w-auto bg-accent hover:bg-accent-hover text-white">
          Resend invitation email
        </Button>
        <Button variant="link" onClick={onContactLandlord} className="w-full sm:w-auto text-primary dark:text-primary-light">
          Contact your landlord
        </Button>
      </div>
    </div>
  );
};

export default WaitingCard; 