/**
 * Analytics Dashboard Component Tests
 * Comprehensive tests for the React analytics dashboard component
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';

// Mock Heroicons before any imports
vi.mock('@heroicons/react/24/outline', () => ({
  ChartBarIcon: 'svg',
  FunnelIcon: 'svg',
  BeakerIcon: 'svg',
  UsersIcon: 'svg',
  CurrencyDollarIcon: 'svg',
  TrendingUpIcon: 'svg',
  TrendingDownIcon: 'svg',
  EyeIcon: 'svg',
  CalendarIcon: 'svg',
  AdjustmentsHorizontalIcon: 'svg',
  DocumentChartBarIcon: 'svg'
}));

// Mock analytics services before any imports
vi.mock('../../src/services/analytics/conversionTracking', () => ({
  conversionTracking: {
    getFunnelAnalytics: vi.fn(),
    getConversionRates: vi.fn(),
    calculateARPU: vi.fn()
  }
}));

vi.mock('../../src/services/analytics/abTesting', () => ({
  abTesting: {
    getStatus: vi.fn()
  }
}));

// Mock Button component with proper forwardRef
vi.mock('../../src/components/ui/Button', () => ({
  default: vi.fn(({ children, onClick, variant = '', size = '', className = '', ...props }) => (
    React.createElement('button', {
      onClick,
      className: `btn ${variant} ${size} ${className}`,
      ...props
    }, children)
  ))
}));

// Import after mocks are set up
import { conversionTracking } from '../../src/services/analytics/conversionTracking';
import { abTesting } from '../../src/services/analytics/abTesting';
import AnalyticsDashboard from '../../src/components/analytics/AnalyticsDashboard.jsx';

describe('Analytics Dashboard Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Loading State', () => {
    it('should show loading skeleton while loading data', () => {
      // Mock pending promises
      conversionTracking.getFunnelAnalytics.mockReturnValue(new Promise(() => {}));
      conversionTracking.getConversionRates.mockReturnValue(new Promise(() => {}));
      conversionTracking.calculateARPU.mockReturnValue(new Promise(() => {}));

      render(<AnalyticsDashboard />);

      expect(screen.getByText('Analytics Dashboard')).toBeInTheDocument();
      expect(screen.getByText('User behavior insights and conversion analytics for product decisions')).toBeInTheDocument();
    });
  });

  describe('Error State', () => {
    it('should show error state when data loading fails', async () => {
      conversionTracking.getFunnelAnalytics.mockRejectedValue(new Error('Failed to load data'));
      conversionTracking.getConversionRates.mockRejectedValue(new Error('Failed to load data'));
      conversionTracking.calculateARPU.mockRejectedValue(new Error('Failed to load data'));

      render(<AnalyticsDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Analytics Error')).toBeInTheDocument();
        expect(screen.getByText('Failed to load analytics data. Please try again.')).toBeInTheDocument();
        expect(screen.getByText('Try Again')).toBeInTheDocument();
      });
    });

    it('should retry loading data when try again button is clicked', async () => {
      conversionTracking.getFunnelAnalytics.mockRejectedValueOnce(new Error('Failed to load data'));
      conversionTracking.getConversionRates.mockRejectedValueOnce(new Error('Failed to load data'));
      conversionTracking.calculateARPU.mockRejectedValueOnce(new Error('Failed to load data'));

      // Mock successful retry
      conversionTracking.getFunnelAnalytics.mockResolvedValue({ totalUsers: 100, stageCounts: {}, averageStepsPerUser: 2.5 });
      conversionTracking.getConversionRates.mockResolvedValue({ overall_conversion: 5.2 });
      conversionTracking.calculateARPU.mockResolvedValue(125.50);

      render(<AnalyticsDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Try Again')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Try Again'));

      await waitFor(() => {
        expect(screen.getByText('Total Funnel Users')).toBeInTheDocument();
      });
    });
  });

  describe('Data Display', () => {
    beforeEach(() => {
      // Mock successful data loading
      conversionTracking.getFunnelAnalytics.mockResolvedValue({
        totalUsers: 1250,
        stageCounts: {
          signup_completed: 1000,
          onboarding_completed: 800,
          first_property_added: 600
        },
        averageStepsPerUser: 2.5,
        dropOffRates: {
          'signup_completed_to_onboarding_completed': 0.2,
          'onboarding_completed_to_first_property_added': 0.25
        }
      });

      conversionTracking.getConversionRates.mockResolvedValue({
        signup_to_onboarding: 80,
        onboarding_to_activation: 75,
        activation_to_subscription: 50,
        overall_conversion: 5.2
      });

      conversionTracking.calculateARPU.mockResolvedValue(125.50);
    });

    it('should display key metrics correctly', async () => {
      render(<AnalyticsDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Total Funnel Users')).toBeInTheDocument();
        expect(screen.getByText('1250')).toBeInTheDocument();
        
        expect(screen.getByText('Overall Conversion Rate')).toBeInTheDocument();
        expect(screen.getByText('5.2%')).toBeInTheDocument();
        
        expect(screen.getByText('Average Revenue Per User')).toBeInTheDocument();
        expect(screen.getByText('$125.5')).toBeInTheDocument();
        
        expect(screen.getByText('Avg Steps Per User')).toBeInTheDocument();
        expect(screen.getByText('3')).toBeInTheDocument(); // Math.round(2.5) = 3
      });
    });

    it('should display conversion rates by stage', async () => {
      render(<AnalyticsDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Conversion Rates by Stage')).toBeInTheDocument();
        expect(screen.getByText('Signup → Onboarding')).toBeInTheDocument();
        expect(screen.getByText('80%')).toBeInTheDocument();
        
        expect(screen.getByText('Onboarding → Activation')).toBeInTheDocument();
        expect(screen.getByText('75%')).toBeInTheDocument();
        
        expect(screen.getByText('Activation → Subscription')).toBeInTheDocument();
        expect(screen.getByText('50%')).toBeInTheDocument();
      });
    });

    it('should display recent activity section', async () => {
      render(<AnalyticsDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Recent Analytics Activity')).toBeInTheDocument();
        expect(screen.getByText('New user signed up (Landlord)')).toBeInTheDocument();
        expect(screen.getByText('Subscription conversion completed')).toBeInTheDocument();
        expect(screen.getByText('A/B test reached significance')).toBeInTheDocument();
      });
    });
  });

  describe('Tab Navigation', () => {
    beforeEach(() => {
      // Mock data for tab tests
      conversionTracking.getFunnelAnalytics.mockResolvedValue({
        totalUsers: 100,
        stageCounts: {
          signup_completed: 80,
          onboarding_completed: 60
        },
        averageStepsPerUser: 2.0
      });
      conversionTracking.getConversionRates.mockResolvedValue({});
      conversionTracking.calculateARPU.mockResolvedValue(0);
    });

    it('should switch between tabs correctly', async () => {
      render(<AnalyticsDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Total Funnel Users')).toBeInTheDocument();
      });

      // Click on Funnel tab
      fireEvent.click(screen.getByText('Conversion Funnel'));
      
      await waitFor(() => {
        expect(screen.getByText('Conversion Funnel Visualization')).toBeInTheDocument();
      });

      // Click on Experiments tab
      fireEvent.click(screen.getByText('A/B Tests'));
      
      await waitFor(() => {
        expect(screen.getByText('Active A/B Tests')).toBeInTheDocument();
        expect(screen.getByText('Pricing Strategy Test')).toBeInTheDocument();
      });

      // Click on Users tab
      fireEvent.click(screen.getByText('User Behavior'));
      
      await waitFor(() => {
        expect(screen.getByText('User Behavior Analytics')).toBeInTheDocument();
        expect(screen.getByText('Detailed user behavior analytics and engagement metrics will be available here.')).toBeInTheDocument();
      });

      // Click on Revenue tab
      fireEvent.click(screen.getByText('Revenue Analytics'));
      
      await waitFor(() => {
        expect(screen.getByText('Revenue Trends')).toBeInTheDocument();
        expect(screen.getByText('ARPU')).toBeInTheDocument();
        expect(screen.getByText('MRR')).toBeInTheDocument();
        expect(screen.getByText('LTV')).toBeInTheDocument();
      });
    });
  });

  describe('Funnel Visualization', () => {
    it('should show funnel data when available', async () => {
      conversionTracking.getFunnelAnalytics.mockResolvedValue({
        totalUsers: 100,
        stageCounts: {
          signup_completed: 80,
          onboarding_completed: 60,
          first_property_added: 40
        },
        averageStepsPerUser: 2.0
      });
      conversionTracking.getConversionRates.mockResolvedValue({});
      conversionTracking.calculateARPU.mockResolvedValue(0);

      render(<AnalyticsDashboard />);

      await waitFor(() => {
        fireEvent.click(screen.getByText('Conversion Funnel'));
      });

      await waitFor(() => {
        expect(screen.getByText('signup completed')).toBeInTheDocument();
        expect(screen.getByText('80 users')).toBeInTheDocument();
        expect(screen.getByText('onboarding completed')).toBeInTheDocument();
        expect(screen.getByText('60 users')).toBeInTheDocument();
      });
    });

    it('should show no data message when funnel data is empty', async () => {
      conversionTracking.getFunnelAnalytics.mockResolvedValue({
        totalUsers: 0,
        stageCounts: {},
        averageStepsPerUser: 0
      });
      conversionTracking.getConversionRates.mockResolvedValue({});
      conversionTracking.calculateARPU.mockResolvedValue(0);

      render(<AnalyticsDashboard />);

      await waitFor(() => {
        fireEvent.click(screen.getByText('Conversion Funnel'));
      });

      await waitFor(() => {
        expect(screen.getByText('No Funnel Data')).toBeInTheDocument();
        expect(screen.getByText('Funnel data will appear here as users progress through the system.')).toBeInTheDocument();
      });
    });
  });

  describe('Date Range Selection', () => {
    beforeEach(() => {
      conversionTracking.getFunnelAnalytics.mockResolvedValue({
        totalUsers: 100,
        stageCounts: {},
        averageStepsPerUser: 2.0
      });
      conversionTracking.getConversionRates.mockResolvedValue({});
      conversionTracking.calculateARPU.mockResolvedValue(0);
    });

    it('should update data when date range changes', async () => {
      render(<AnalyticsDashboard />);

      await waitFor(() => {
        expect(screen.getByDisplayValue('Last 30 days')).toBeInTheDocument();
      });

      // Change date range
      fireEvent.change(screen.getByDisplayValue('Last 30 days'), {
        target: { value: '7' }
      });

      await waitFor(() => {
        // Should call analytics functions with new date range
        expect(conversionTracking.getFunnelAnalytics).toHaveBeenCalledWith({ dateRange: 7 });
        expect(conversionTracking.getConversionRates).toHaveBeenCalledWith(null, 7);
        expect(conversionTracking.calculateARPU).toHaveBeenCalledWith(null, 7);
      });
    });

    it('should have all date range options available', async () => {
      render(<AnalyticsDashboard />);

      await waitFor(() => {
        const select = screen.getByDisplayValue('Last 30 days');
        expect(select).toBeInTheDocument();
        
        const options = select.querySelectorAll('option');
        expect(options).toHaveLength(4);
        expect(options[0]).toHaveTextContent('Last 7 days');
        expect(options[1]).toHaveTextContent('Last 30 days');
        expect(options[2]).toHaveTextContent('Last 3 months');
        expect(options[3]).toHaveTextContent('Last year');
      });
    });
  });

  describe('Refresh Functionality', () => {
    beforeEach(() => {
      conversionTracking.getFunnelAnalytics.mockResolvedValue({
        totalUsers: 100,
        stageCounts: {},
        averageStepsPerUser: 2.0
      });
      conversionTracking.getConversionRates.mockResolvedValue({});
      conversionTracking.calculateARPU.mockResolvedValue(0);
    });

    it('should refresh data when refresh button is clicked', async () => {
      render(<AnalyticsDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Refresh')).toBeInTheDocument();
      });

      // Clear mock call history
      vi.clearAllMocks();

      fireEvent.click(screen.getByText('Refresh'));

      await waitFor(() => {
        expect(conversionTracking.getFunnelAnalytics).toHaveBeenCalled();
        expect(conversionTracking.getConversionRates).toHaveBeenCalled();
        expect(conversionTracking.calculateARPU).toHaveBeenCalled();
      });
    });
  });

  describe('Experiments Tab', () => {
    beforeEach(() => {
      conversionTracking.getFunnelAnalytics.mockResolvedValue({
        totalUsers: 100,
        stageCounts: {},
        averageStepsPerUser: 2.0
      });
      conversionTracking.getConversionRates.mockResolvedValue({});
      conversionTracking.calculateARPU.mockResolvedValue(0);
    });

    it('should display experiment information correctly', async () => {
      render(<AnalyticsDashboard />);

      await waitFor(() => {
        fireEvent.click(screen.getByText('A/B Tests'));
      });

      await waitFor(() => {
        expect(screen.getByText('Pricing Strategy Test')).toBeInTheDocument();
        expect(screen.getByText('active')).toBeInTheDocument();
        expect(screen.getByText('Testing different pricing tiers for conversion optimization')).toBeInTheDocument();
        
        expect(screen.getByText('Control:')).toBeInTheDocument();
        expect(screen.getByText('Current Pricing')).toBeInTheDocument();
        expect(screen.getByText('8.2% conversion')).toBeInTheDocument();
        
        expect(screen.getByText('Variant A:')).toBeInTheDocument();
        expect(screen.getByText('Lower Price')).toBeInTheDocument();
        expect(screen.getByText('12.1% conversion')).toBeInTheDocument();
        
        expect(screen.getByText('Statistical Significance:')).toBeInTheDocument();
        expect(screen.getByText('Significant')).toBeInTheDocument();
        expect(screen.getByText('96.2% confidence')).toBeInTheDocument();
      });
    });

    it('should display completed experiment', async () => {
      render(<AnalyticsDashboard />);

      await waitFor(() => {
        fireEvent.click(screen.getByText('A/B Tests'));
      });

      await waitFor(() => {
        expect(screen.getByText('Onboarding Flow Optimization')).toBeInTheDocument();
        expect(screen.getByText('completed')).toBeInTheDocument();
        expect(screen.getByText('Testing simplified vs. detailed onboarding flow')).toBeInTheDocument();
        expect(screen.getByText('Not Significant')).toBeInTheDocument();
        expect(screen.getByText('82.1% confidence')).toBeInTheDocument();
      });
    });
  });

  describe('Revenue Tab', () => {
    beforeEach(() => {
      conversionTracking.getFunnelAnalytics.mockResolvedValue({
        totalUsers: 100,
        stageCounts: {},
        averageStepsPerUser: 2.0
      });
      conversionTracking.getConversionRates.mockResolvedValue({});
      conversionTracking.calculateARPU.mockResolvedValue(125.50);
    });

    it('should display revenue metrics correctly', async () => {
      render(<AnalyticsDashboard />);

      await waitFor(() => {
        fireEvent.click(screen.getByText('Revenue Analytics'));
      });

      await waitFor(() => {
        expect(screen.getByText('$125.5')).toBeInTheDocument();
        expect(screen.getByText('$12,450')).toBeInTheDocument();
        expect(screen.getByText('$1,240')).toBeInTheDocument();
        expect(screen.getByText('Revenue chart visualization would go here')).toBeInTheDocument();
      });
    });
  });

  describe('Component Props', () => {
    it('should handle different user roles', async () => {
      conversionTracking.getFunnelAnalytics.mockResolvedValue({
        totalUsers: 100,
        stageCounts: {},
        averageStepsPerUser: 2.0
      });
      conversionTracking.getConversionRates.mockResolvedValue({});
      conversionTracking.calculateARPU.mockResolvedValue(0);

      render(<AnalyticsDashboard userRole="manager" />);

      await waitFor(() => {
        expect(screen.getByText('Analytics Dashboard')).toBeInTheDocument();
      });
    });
  });
}); 