import { stripeConfig } from '../config/stripe';

// Types for MCP integration
export interface StripeMcpCustomer {
  id: string;
  email: string;
  name?: string;
  metadata?: Record<string, string>;
  created: number;
}

export interface StripeMcpProduct {
  id: string;
  name: string;
  description?: string;
  active: boolean;
  metadata?: Record<string, string>;
}

export interface StripeMcpPrice {
  id: string;
  product: string;
  unit_amount: number;
  currency: string;
  recurring?: {
    interval: string;
    interval_count: number;
  };
}

export interface StripeMcpPaymentLink {
  id: string;
  url: string;
  active: boolean;
  metadata?: Record<string, string>;
}

/**
 * Stripe MCP Service
 * 
 * This service provides helper functions for working with Stripe MCP tools
 * in Cursor Composer. It bridges our existing Stripe integration with MCP capabilities.
 */
export class StripeMcpService {
  private static instance: StripeMcpService;

  private constructor() {}

  public static getInstance(): StripeMcpService {
    if (!StripeMcpService.instance) {
      StripeMcpService.instance = new StripeMcpService();
    }
    return StripeMcpService.instance;
  }

  /**
   * Helper to format customer data for MCP operations
   */
  public formatCustomerForMcp(
    email: string,
    name?: string,
    metadata?: Record<string, string>
  ): Partial<StripeMcpCustomer> {
    return {
      email,
      name,
      metadata: {
        source: 'propagentic',
        created_via: 'mcp_integration',
        ...metadata,
      },
    };
  }

  /**
   * Helper to format product data for MCP operations
   */
  public formatProductForMcp(
    name: string,
    description?: string,
    metadata?: Record<string, string>
  ): Partial<StripeMcpProduct> {
    return {
      name,
      description,
      active: true,
      metadata: {
        source: 'propagentic',
        created_via: 'mcp_integration',
        ...metadata,
      },
    };
  }

  /**
   * Helper to format price data for MCP operations
   */
  public formatPriceForMcp(
    productId: string,
    unitAmount: number,
    currency: string = 'usd',
    recurring?: { interval: 'month' | 'year'; interval_count?: number }
  ): Partial<StripeMcpPrice> {
    return {
      product: productId,
      unit_amount: unitAmount,
      currency,
      recurring,
    };
  }

  /**
   * PropAgentic-specific product configurations
   */
  public getSubscriptionProducts() {
    return {
      basic: this.formatProductForMcp(
        'PropAgentic Basic',
        'Basic property management for up to 5 properties',
        { tier: 'basic', property_limit: '5' }
      ),
      pro: this.formatProductForMcp(
        'PropAgentic Pro',
        'Professional property management for up to 20 properties',
        { tier: 'pro', property_limit: '20' }
      ),
      enterprise: this.formatProductForMcp(
        'PropAgentic Enterprise',
        'Enterprise property management with unlimited properties',
        { tier: 'enterprise', property_limit: 'unlimited' }
      ),
    };
  }

  /**
   * PropAgentic-specific pricing configurations
   */
  public getSubscriptionPrices() {
    return {
      basic_monthly: {
        unit_amount: 1999, // $19.99
        currency: 'usd',
        recurring: { interval: 'month' as const },
      },
      pro_monthly: {
        unit_amount: 3999, // $39.99
        currency: 'usd',
        recurring: { interval: 'month' as const },
      },
      enterprise_monthly: {
        unit_amount: 9999, // $99.99
        currency: 'usd',
        recurring: { interval: 'month' as const },
      },
    };
  }

  /**
   * Generate payment link metadata for contractor payments
   */
  public formatContractorPaymentMetadata(
    contractorId: string,
    maintenanceRequestId: string,
    amount: number,
    platformFee: number
  ): Record<string, string> {
    return {
      type: 'contractor_payment',
      contractor_id: contractorId,
      maintenance_request_id: maintenanceRequestId,
      amount: amount.toString(),
      platform_fee: platformFee.toString(),
      source: 'propagentic',
    };
  }

  /**
   * Generate subscription metadata for landlords
   */
  public formatLandlordSubscriptionMetadata(
    landlordId: string,
    propertyCount: number,
    tier: 'basic' | 'pro' | 'enterprise'
  ): Record<string, string> {
    return {
      type: 'landlord_subscription',
      landlord_id: landlordId,
      property_count: propertyCount.toString(),
      tier,
      source: 'propagentic',
    };
  }

  /**
   * MCP Tool Usage Examples for PropAgentic
   * 
   * These methods provide example prompts you can use with Cursor Composer
   * to interact with Stripe MCP tools for common PropAgentic workflows.
   */
  public getMcpExamples() {
    return {
      // Customer Management
      createLandlordCustomer: (email: string, name: string) => 
        `Create a Stripe customer with email "${email}" and name "${name}" with metadata: ${JSON.stringify(this.formatCustomerForMcp(email, name, { role: 'landlord' }))}`,

      createContractorCustomer: (email: string, name: string) => 
        `Create a Stripe customer with email "${email}" and name "${name}" with metadata: ${JSON.stringify(this.formatCustomerForMcp(email, name, { role: 'contractor' }))}`,

      // Product Setup
      createSubscriptionProducts: () => 
        `Create three Stripe products for PropAgentic subscription tiers:
        1. ${JSON.stringify(this.getSubscriptionProducts().basic)}
        2. ${JSON.stringify(this.getSubscriptionProducts().pro)}  
        3. ${JSON.stringify(this.getSubscriptionProducts().enterprise)}`,

      // Pricing Setup
      createSubscriptionPrices: (productIds: Record<string, string>) => 
        `Create monthly prices for PropAgentic products:
        1. Basic plan (${productIds.basic}): ${JSON.stringify(this.getSubscriptionPrices().basic_monthly)}
        2. Pro plan (${productIds.pro}): ${JSON.stringify(this.getSubscriptionPrices().pro_monthly)}
        3. Enterprise plan (${productIds.enterprise}): ${JSON.stringify(this.getSubscriptionPrices().enterprise_monthly)}`,

      // Payment Processing
      createContractorPayment: (contractorId: string, amount: number, requestId: string) => {
        const platformFee = Math.round(amount * 0.05); // 5% platform fee
        return `Create a payment link for contractor payment with amount $${amount}, platform fee $${platformFee}, and metadata: ${JSON.stringify(this.formatContractorPaymentMetadata(contractorId, requestId, amount, platformFee))}`;
      },

      // Commission Products
      createCommissionProduct: () => 
        `Create a Stripe product for PropAgentic platform commission fees with metadata: ${JSON.stringify({ type: 'platform_commission', rate: '5%' })}`,

      // Reporting
      listRecentCustomers: () => 
        `List Stripe customers created in the last 30 days with metadata containing "source: propagentic"`,

      listSubscriptions: () => 
        `List all active Stripe subscriptions with metadata containing "type: landlord_subscription"`,

      getRevenueReport: () => 
        `Retrieve account balance and list all charges from the last 30 days to generate a revenue report`,
    };
  }

  /**
   * Integration helpers for existing PropAgentic code
   */
  public getIntegrationHelpers() {
    return {
      // Use with existing Firebase Functions
      validateStripeCustomer: (customerId: string) => 
        `Retrieve Stripe customer ${customerId} and verify it exists and is active`,

      syncSubscriptionStatus: (subscriptionId: string) => 
        `Get Stripe subscription ${subscriptionId} status and details for Firestore sync`,

      checkPaymentStatus: (paymentIntentId: string) => 
        `Check the status of Stripe payment intent ${paymentIntentId}`,

      // Webhook testing
      simulateWebhookEvent: (eventType: string) => 
        `Create a test webhook event of type "${eventType}" for development testing`,
    };
  }

  /**
   * Configuration validation
   */
  public validateConfiguration(): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!process.env.STRIPE_SECRET_KEY) {
      errors.push('STRIPE_SECRET_KEY environment variable is required');
    }

    if (!process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY) {
      errors.push('REACT_APP_STRIPE_PUBLISHABLE_KEY environment variable is required');
    }

    if (!stripeConfig.publishableKey) {
      errors.push('Stripe publishable key is not configured');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Get development tips for using Stripe MCP
   */
  public getDevelopmentTips() {
    return [
      'Use test mode API keys (sk_test_ and pk_test_) during development',
      'Restart Cursor after updating MCP configuration to load new tools',
      'Use specific, descriptive metadata to identify PropAgentic-created resources',
      'Test webhook handlers using MCP-created test events',
      'Monitor Stripe Dashboard to verify MCP operations are working correctly',
      'Use the Stripe CLI for additional webhook testing and event simulation',
      'Keep your existing Firebase Functions for production; use MCP for development and testing',
    ];
  }
}

// Export singleton instance
export const stripeMcpService = StripeMcpService.getInstance();

// Export convenience functions
export const mcpExamples = stripeMcpService.getMcpExamples();
export const integrationHelpers = stripeMcpService.getIntegrationHelpers();
export const developmentTips = stripeMcpService.getDevelopmentTips();

// Example usage:
// import { stripeMcpService, mcpExamples } from '../services/stripeMcpService';
// 
// // In your component:
// const createCustomerPrompt = mcpExamples.createLandlordCustomer('john@example.com', 'John Smith');
// // Then use this prompt with Cursor Composer 