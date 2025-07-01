import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import Button from '../ui/Button';
import { stripeMcpService, mcpExamples, integrationHelpers, developmentTips } from '../../services/stripeMcpService';
import { 
  CreditCardIcon, 
  UsersIcon, 
  CogIcon, 
  DocumentTextIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';

interface ConfigValidation {
  isValid: boolean;
  errors: string[];
}

const StripeMcpDashboard: React.FC = () => {
  const [configValidation, setConfigValidation] = useState<ConfigValidation | null>(null);
  const [copiedPrompt, setCopiedPrompt] = useState<string | null>(null);

  useEffect(() => {
    // Validate configuration on component mount
    const validation = stripeMcpService.validateConfiguration();
    setConfigValidation(validation);
  }, []);

  const copyToClipboard = async (text: string, promptType: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedPrompt(promptType);
      setTimeout(() => setCopiedPrompt(null), 2000);
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
    }
  };

  const PromptCard: React.FC<{ 
    title: string; 
    description: string; 
    prompt: string; 
    type: string;
    icon: React.ReactNode;
  }> = ({ title, description, prompt, type, icon }) => (
    <Card className="border border-gray-200 dark:border-gray-700">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center text-sm font-medium text-gray-900 dark:text-gray-100">
          {icon}
          <span className="ml-2">{title}</span>
        </CardTitle>
        <p className="text-xs text-gray-600 dark:text-gray-400">{description}</p>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="bg-gray-50 dark:bg-gray-800 rounded-md p-3 mb-3">
          <code className="text-xs text-gray-800 dark:text-gray-200 whitespace-pre-wrap">
            {prompt}
          </code>
        </div>
        <Button
          onClick={() => copyToClipboard(prompt, type)}
          size="sm"
          variant={copiedPrompt === type ? "success" : "outline"}
          className="w-full"
        >
          {copiedPrompt === type ? (
            <>
              <CheckCircleIcon className="w-4 h-4 mr-1" />
              Copied!
            </>
          ) : (
            'Copy Prompt'
          )}
        </Button>
      </CardContent>
    </Card>
  );

  const ConfigurationSection: React.FC = () => (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center text-lg font-semibold">
          <CogIcon className="w-5 h-5 mr-2" />
          Configuration Status
        </CardTitle>
      </CardHeader>
      <CardContent>
        {configValidation ? (
          <>
            {configValidation.isValid ? (
              <div className="flex items-center text-green-600 dark:text-green-400 mb-4">
                <CheckCircleIcon className="w-5 h-5 mr-2" />
                <span className="font-medium">Stripe MCP is properly configured</span>
              </div>
            ) : (
              <div className="mb-4">
                <div className="flex items-center text-red-600 dark:text-red-400 mb-2">
                  <ExclamationTriangleIcon className="w-5 h-5 mr-2" />
                  <span className="font-medium">Configuration Issues Found</span>
                </div>
                <ul className="list-disc list-inside text-sm text-red-600 dark:text-red-400 ml-7">
                  {configValidation.errors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-md p-4">
              <div className="flex items-start">
                <InformationCircleIcon className="w-5 h-5 text-blue-500 mr-2 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">
                    Setup Instructions
                  </h4>
                  <ol className="text-sm text-blue-700 dark:text-blue-300 list-decimal list-inside space-y-1">
                    <li>Get your Stripe API keys from the <a href="https://dashboard.stripe.com/test/apikeys" target="_blank" rel="noopener noreferrer" className="underline">Stripe Dashboard</a></li>
                    <li>Add them to your <code className="bg-blue-100 dark:bg-blue-800 px-1 rounded">.env</code> file</li>
                    <li>Restart Cursor to load the new configuration</li>
                    <li>Verify the Stripe MCP server appears in Cursor's MCP servers list</li>
                  </ol>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="p-6 space-y-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          Stripe MCP Integration Dashboard
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Use these prompts with Cursor Composer to interact with Stripe via MCP tools.
          Copy any prompt and paste it into Composer to perform Stripe operations.
        </p>
      </div>

      <ConfigurationSection />

      {/* Customer Management Section */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center">
          <UsersIcon className="w-5 h-5 mr-2" />
          Customer Management
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <PromptCard
            title="Create Landlord Customer"
            description="Create a new Stripe customer for a landlord user"
            prompt={mcpExamples.createLandlordCustomer('landlord@example.com', 'John Smith')}
            type="create-landlord"
            icon={<UsersIcon className="w-4 h-4" />}
          />
          <PromptCard
            title="Create Contractor Customer"
            description="Create a new Stripe customer for a contractor user"
            prompt={mcpExamples.createContractorCustomer('contractor@example.com', 'Jane Doe')}
            type="create-contractor"
            icon={<UsersIcon className="w-4 h-4" />}
          />
        </div>
      </section>

      {/* Product & Pricing Section */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center">
          <CreditCardIcon className="w-5 h-5 mr-2" />
          Products & Pricing
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <PromptCard
            title="Create Subscription Products"
            description="Set up all PropAgentic subscription tier products"
            prompt={mcpExamples.createSubscriptionProducts()}
            type="create-products"
            icon={<CreditCardIcon className="w-4 h-4" />}
          />
          <PromptCard
            title="Create Commission Product"
            description="Set up platform commission fee product"
            prompt={mcpExamples.createCommissionProduct()}
            type="create-commission"
            icon={<CreditCardIcon className="w-4 h-4" />}
          />
        </div>
      </section>

      {/* Payment Processing Section */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center">
          <CreditCardIcon className="w-5 h-5 mr-2" />
          Payment Processing
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <PromptCard
            title="Contractor Payment"
            description="Create payment for a maintenance job"
            prompt={mcpExamples.createContractorPayment('acct_contractor123', 250, 'maint_req_456')}
            type="contractor-payment"
            icon={<CreditCardIcon className="w-4 h-4" />}
          />
          <PromptCard
            title="List Recent Customers"
            description="Get customers created in the last 30 days"
            prompt={mcpExamples.listRecentCustomers()}
            type="recent-customers"
            icon={<UsersIcon className="w-4 h-4" />}
          />
        </div>
      </section>

      {/* Reporting & Analysis Section */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center">
          <DocumentTextIcon className="w-5 h-5 mr-2" />
          Reporting & Analysis
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <PromptCard
            title="Revenue Report"
            description="Generate a comprehensive revenue report"
            prompt={mcpExamples.getRevenueReport()}
            type="revenue-report"
            icon={<DocumentTextIcon className="w-4 h-4" />}
          />
          <PromptCard
            title="List Subscriptions"
            description="View all active landlord subscriptions"
            prompt={mcpExamples.listSubscriptions()}
            type="list-subscriptions"
            icon={<DocumentTextIcon className="w-4 h-4" />}
          />
        </div>
      </section>

      {/* Integration Helpers Section */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center">
          <CogIcon className="w-5 h-5 mr-2" />
          Integration Helpers
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <PromptCard
            title="Validate Customer"
            description="Check if a Stripe customer exists and is active"
            prompt={integrationHelpers.validateStripeCustomer('cus_example123')}
            type="validate-customer"
            icon={<CheckCircleIcon className="w-4 h-4" />}
          />
          <PromptCard
            title="Check Payment Status"
            description="Get the status of a payment intent"
            prompt={integrationHelpers.checkPaymentStatus('pi_example123')}
            type="payment-status"
            icon={<CreditCardIcon className="w-4 h-4" />}
          />
        </div>
      </section>

      {/* Development Tips */}
      <section className="mb-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-lg font-semibold">
              <InformationCircleIcon className="w-5 h-5 mr-2" />
              Development Tips
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {developmentTips.map((tip, index) => (
                <li key={index} className="flex items-start">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                  <span className="text-sm text-gray-700 dark:text-gray-300">{tip}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </section>

      {/* Quick Links */}
      <section>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Quick Links</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <a
                href="https://dashboard.stripe.com/test/apikeys"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
              >
                Stripe Dashboard
              </a>
              <a
                href="https://docs.stripe.com/agents"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
              >
                Stripe MCP Docs
              </a>
              <a
                href="https://github.com/stripe/agent-toolkit"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
              >
                Agent Toolkit
              </a>
              <a
                href="/docs/STRIPE_MCP_INTEGRATION.md"
                className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
              >
                Integration Guide
              </a>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
};

export default StripeMcpDashboard; 