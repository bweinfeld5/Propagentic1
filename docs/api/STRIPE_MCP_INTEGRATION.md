# Stripe MCP Integration Guide for PropAgentic

## Overview

This guide walks you through integrating Stripe's Model Context Protocol (MCP) server with PropAgentic, enabling AI-powered payment processing, subscription management, and financial operations directly within your development environment.

## What is Stripe MCP?

Stripe MCP provides AI agents (like Cursor's Composer) with direct access to Stripe API functionality through function calling. This allows you to:

- Create and manage customers, subscriptions, and payment methods
- Process payments and refunds
- Handle disputes and billing operations
- Analyze financial data and generate reports
- Test payment flows and webhooks

## Installation & Setup

### 1. Install Stripe MCP Server

The Stripe MCP server is already configured in your `.cursor/mcp.json` file. The installation was completed using:

```bash
npm install -g @stripe/mcp
```

### 2. Configure Environment Variables

Add your Stripe API keys to your `.env` file:

```env
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_YOUR_ACTUAL_SECRET_KEY
REACT_APP_STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_ACTUAL_PUBLISHABLE_KEY
STRIPE_WEBHOOK_SECRET=whsec_YOUR_ACTUAL_WEBHOOK_SECRET
```

**Important:** Replace the placeholder values with your actual Stripe keys from your [Stripe Dashboard](https://dashboard.stripe.com/test/apikeys).

### 3. Update MCP Configuration

Your `.cursor/mcp.json` file now includes the Stripe MCP server:

```json
{
    "mcpServers": {
        "task-master-ai": {
            "command": "npx",
            "args": ["-y", "--package=task-master-ai", "task-master-ai"],
            "env": {
                "ANTHROPIC_API_KEY": "ANTHROPIC_API_KEY_HERE",
                "PERPLEXITY_API_KEY": "PERPLEXITY_API_KEY_HERE",
                "OPENAI_API_KEY": "OPENAI_API_KEY_HERE",
                "GOOGLE_API_KEY": "GOOGLE_API_KEY_HERE",
                "XAI_API_KEY": "XAI_API_KEY_HERE",
                "OPENROUTER_API_KEY": "OPENROUTER_API_KEY_HERE",
                "MISTRAL_API_KEY": "MISTRAL_API_KEY_HERE",
                "AZURE_OPENAI_API_KEY": "AZURE_OPENAI_API_KEY_HERE",
                "OLLAMA_API_KEY": "OLLAMA_API_KEY_HERE"
            }
        },
        "stripe": {
            "command": "npx",
            "args": ["-y", "@stripe/mcp", "--tools=all"],
            "env": {
                "STRIPE_SECRET_KEY": "STRIPE_SECRET_KEY_HERE"
            }
        }
    }
}
```

### 4. Restart Cursor

After updating the MCP configuration, restart Cursor to load the new Stripe MCP server.

## Available Stripe MCP Tools

The Stripe MCP server provides the following tools that you can use directly in Cursor's Composer:

### Customer Management
- **Create Customer**: Create new Stripe customers
- **List Customers**: Retrieve and filter customer lists
- **Update Customer**: Modify customer information

### Product & Pricing
- **Create Product**: Add new products to your catalog
- **List Products**: View all products
- **Create Price**: Set up pricing for products
- **List Prices**: View all price configurations

### Payment Processing
- **Create Payment Link**: Generate payment links for customers
- **Create Invoice**: Generate invoices for services
- **Create Invoice Item**: Add line items to invoices
- **Finalize Invoice**: Complete and send invoices
- **Create Refund**: Process refunds for payments

### Subscription Management
- **List Subscriptions**: View all customer subscriptions
- **Update Subscription**: Modify subscription details
- **Cancel Subscription**: Cancel customer subscriptions

### Financial Operations
- **Retrieve Balance**: Check account balance
- **List Disputes**: View payment disputes
- **Update Dispute**: Respond to disputes

### Discounts & Promotions
- **Create Coupon**: Set up discount coupons
- **List Coupons**: View all available coupons

## PropAgentic Integration Workflows

### 1. Landlord Subscription Setup

Use Stripe MCP to create subscription products for PropAgentic SaaS pricing:

```
Ask Composer: "Create a Stripe product called 'PropAgentic Pro' with a monthly price of $29.99 for landlord subscriptions"
```

### 2. Contractor Payment Processing

Set up payment processing for contractor payments:

```
Ask Composer: "Create a payment link for a maintenance job worth $150 with contractor ID acct_contractor123"
```

### 3. Commission Fee Management

Create products for platform commission fees:

```
Ask Composer: "Create a product for PropAgentic platform fees with a 5% commission structure"
```

### 4. Customer Onboarding

Automate customer creation during user registration:

```
Ask Composer: "Create a Stripe customer for landlord with email john@example.com and name John Smith"
```

## Development Workflows

### Testing Payment Flows

1. **Create Test Customers**: Use MCP to quickly create test customers for different scenarios
2. **Set Up Subscriptions**: Test subscription flows with various pricing models
3. **Process Test Payments**: Simulate payment processing for maintenance jobs
4. **Handle Refunds**: Test refund workflows for different scenarios

### Webhook Development

1. **Create Test Events**: Use MCP to trigger webhook events during development
2. **Validate Responses**: Test your webhook handlers with real Stripe events
3. **Debug Issues**: Use MCP to inspect payment and subscription states

### Financial Reporting

1. **Analyze Revenue**: Use MCP to retrieve financial data for reporting
2. **Track Disputes**: Monitor and respond to payment disputes
3. **Monitor Subscriptions**: Track subscription metrics and churn

## Usage Examples

### Example 1: Setting Up PropAgentic Subscription Tiers

```
// In Cursor Composer, you can say:
"Create three Stripe products for PropAgentic:
1. Basic Plan: $19/month for up to 5 properties
2. Pro Plan: $39/month for up to 20 properties  
3. Enterprise Plan: $99/month for unlimited properties

Then create monthly prices for each tier."
```

### Example 2: Processing Contractor Payment

```
// In Cursor Composer:
"Create a payment intent for $250 to pay contractor acct_contractor456 for maintenance job #1234, with a $12.50 platform fee"
```

### Example 3: Managing Customer Issues

```
// In Cursor Composer:
"List all disputes from the last 30 days and show me details for any that need response"
```

## Security Best Practices

1. **Use Test Keys**: Always use test keys (`sk_test_` and `pk_test_`) during development
2. **Environment Variables**: Never commit API keys to version control
3. **Webhook Secrets**: Verify webhook signatures using `STRIPE_WEBHOOK_SECRET`
4. **Access Control**: Limit MCP access to authorized team members only

## Troubleshooting

### MCP Server Not Starting

1. Check that Stripe secret key is valid and not expired
2. Ensure the key has proper permissions for the operations you're trying to perform
3. Verify the MCP configuration syntax in `.cursor/mcp.json`

### Tool Not Available

1. Restart Cursor after configuration changes
2. Check that the Stripe MCP server appears in Cursor's MCP servers list
3. Verify that `--tools=all` is specified in the MCP configuration

### Permission Errors

1. Ensure your Stripe API key has the necessary permissions
2. Check if your account has the required Stripe features enabled
3. Verify you're using the correct API version

## Advanced Configuration

### Custom Tool Selection

Instead of `--tools=all`, you can specify specific tools:

```json
{
    "args": ["-y", "@stripe/mcp", "--tools=customers,subscriptions,payments"]
}
```

### Multi-Account Support

For Connect applications, specify the Stripe account:

```json
{
    "args": ["-y", "@stripe/mcp", "--tools=all", "--stripe-account=acct_123"]
}
```

## Integration with Existing Code

The Stripe MCP server complements your existing Stripe integration in PropAgentic:

- **Firebase Functions**: Use MCP for development and testing, keep production logic in functions
- **Frontend Components**: Use MCP to quickly test payment flows before implementing in React
- **Webhook Handlers**: Use MCP to simulate webhook events during development

## Next Steps

1. **Set up your Stripe account** with real API keys
2. **Configure webhook endpoints** for your development environment
3. **Test payment flows** using the MCP tools
4. **Integrate with your existing PropAgentic codebase**
5. **Set up monitoring and alerting** for production payments

## Resources

- [Stripe MCP Documentation](https://docs.stripe.com/agents)
- [Stripe Agent Toolkit](https://github.com/stripe/agent-toolkit)
- [PropAgentic Stripe Configuration](./src/config/stripe.ts)
- [Stripe Dashboard](https://dashboard.stripe.com/)

## Support

For issues with:
- **Stripe MCP**: Check the [Stripe Agent Toolkit repository](https://github.com/stripe/agent-toolkit)
- **PropAgentic Integration**: See existing Stripe configuration files in `/src/config/` and `/functions/src/stripe/`
- **General Stripe API**: Consult [Stripe Documentation](https://docs.stripe.com/) 