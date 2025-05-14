import React, { useState } from 'react';
import { SafeMotion } from '../../shared/SafeMotion';
import Button from '../../ui/Button';
import ProblemSolutionCard from '../newComponents/ProblemSolutionCard';
import { UIComponentErrorBoundary } from '../../shared/ErrorBoundary';
import AnimatedBlueprintBackground from '../../branding/AnimatedBlueprintBackground';

import landlordIcon from '../../../assets/icons/landlord-icon.svg';
import tenantIcon from '../../../assets/icons/tenant-icon.svg';
import contractorIcon from '../../../assets/icons/contractor-icon.svg';

// Data for each role tab
const roleContent = {
  landlord: {
    title: "For Landlords & Property Managers",
    description: "Take control of your properties with automation, insights, and streamlined maintenance.",
    problems: [
      "Manual, paper-based processes waste time",
      "Slow responses to tenant requests cause frustration",
      "Difficult to track maintenance history & costs",
      "No easy way to coordinate with contractors",
      "Scattered communications across email, text & calls",
    ],
    solutions: [
      "Streamline all property operations in one platform",
      "Automated maintenance request processing",
      "Complete maintenance history with analytics",
      "Integrated contractor coordination",
      "Centralized communication with tenants & contractors",
    ],
  },
  tenant: {
    title: "For Tenants",
    description: "Enjoy a stress-free rental experience with fast maintenance responses and transparent communication.",
    problems: [
      "Maintenance requests disappear into a black hole",
      "Slow response times to urgent issues",
      "No visibility into request status or timeline",
      "Difficulty coordinating repairs with busy schedules",
      "Keeping track of payment history is challenging",
    ],
    solutions: [
      "Submit maintenance requests in seconds",
      "AI-powered prioritization for urgent issues",
      "Real-time status updates on all requests",
      "Self-schedule contractor visits at your convenience",
      "Automatic payment records & receipts",
    ],
  },
  contractor: {
    title: "For Service Providers & Contractors",
    description: "Grow your business with steady work, simplified scheduling, and automated payments.",
    problems: [
      "Unpredictable workflow and sporadic jobs",
      "Time wasted on phone calls and scheduling",
      "Delayed payments and manual invoicing hassles",
      "Limited access to property details before visits",
      "Difficult to showcase quality work to gain more clients",
    ],
    solutions: [
      "Steady stream of local job opportunities",
      "Automated scheduling with calendar integration",
      "Fast, reliable payments and streamlined invoicing",
      "Detailed property information before every visit",
      "Ratings and reviews to build your reputation",
    ],
  },
};

// Fallback component in case SafeMotion fails
const SafeContent = ({ children, ...props }) => {
  // Simplified version that doesn't use animations but keeps layout
  return (
    <div className={props.className || ""}>
      {children}
    </div>
  );
};

const RoleProblemSolutionSection = ({ useAnimations = true }) => {
  const [activeTab, setActiveTab] = useState('landlord');
  const [enableAnimations, setEnableAnimations] = useState(useAnimations);
  
  // Disable animations if there's an error
  const handleAnimationError = () => {
    console.warn("Animation error detected, disabling animations");
    setEnableAnimations(false);
  };

  // Choose between animated and static content
  const MotionContainer = enableAnimations ? SafeMotion.div : SafeContent;

  return (
    <section className="py-20 relative bg-background/95 dark:bg-background-dark/95 overflow-hidden">
      {/* Blueprint Background - positioned with absolute */}
      <div className="absolute inset-0 z-1 overflow-hidden">
        <AnimatedBlueprintBackground density="sparse" section="roles" useInlineSvg={true} />
      </div>
      
      {/* Background decoration - large circle */}
      <div className="absolute -top-60 -right-60 w-[600px] h-[600px] rounded-full bg-gradient-to-br from-primary/5 to-primary/10 dark:from-primary/10 dark:to-primary/20 blur-3xl -z-10"></div>
      <div className="absolute -bottom-80 -left-80 w-[700px] h-[700px] rounded-full bg-gradient-to-tr from-propagentic-teal/5 to-propagentic-teal/10 dark:from-propagentic-teal/10 dark:to-propagentic-teal/20 blur-3xl -z-10"></div>
      
      <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-4xl font-bold text-content dark:text-content-dark mb-6">
            Solutions For Every Role
          </h2>
          <p className="text-xl text-content-secondary dark:text-content-darkSecondary">
            Propagentic addresses unique pain points for everyone involved in the property maintenance ecosystem.
          </p>
        </div>
        
        {/* Role selector tabs */}
        <div className="flex justify-center mb-16">
          <div 
            className="inline-flex border border-neutral-200 dark:border-neutral-700 p-1.5 rounded-full bg-background-subtle dark:bg-neutral-800 shadow-sm"
            role="tablist"
            aria-label="Role selector"
          >
            <Button
              variant={activeTab === 'landlord' ? 'tab-active' : 'tab-inactive'}
              size="md"
              onClick={() => setActiveTab('landlord')}
              role="tab"
              aria-selected={activeTab === 'landlord'}
              aria-controls="landlord-content"
              id="landlord-tab"
              className="!rounded-full gap-2 min-w-[140px]"
            >
              <img src={landlordIcon} alt="" className="w-6 h-6" />
              Landlords
            </Button>
            <Button
              variant={activeTab === 'tenant' ? 'tab-active' : 'tab-inactive'}
              size="md"
              onClick={() => setActiveTab('tenant')}
              role="tab"
              aria-selected={activeTab === 'tenant'}
              aria-controls="tenant-content"
              id="tenant-tab"
              className="!rounded-full gap-2 min-w-[140px]"
            >
              <img src={tenantIcon} alt="" className="w-6 h-6" />
              Tenants
            </Button>
            <Button
              variant={activeTab === 'contractor' ? 'tab-active' : 'tab-inactive'}
              size="md"
              onClick={() => setActiveTab('contractor')}
              role="tab"
              aria-selected={activeTab === 'contractor'}
              aria-controls="contractor-content"
              id="contractor-tab"
              className="!rounded-full gap-2 min-w-[140px]"
            >
              <img src={contractorIcon} alt="" className="w-6 h-6" />
              Contractors
            </Button>
          </div>
        </div>
        
        {/* Content area */}
        <div className="role-content-wrapper" role="tabpanel">
          <UIComponentErrorBoundary 
            componentName="RoleContent" 
            onError={handleAnimationError}
            fallback={
              <div className="max-w-5xl mx-auto">
                <div className="text-center mb-16">
                  <h3 className="text-3xl font-bold text-content dark:text-content-dark mb-4">
                    {roleContent[activeTab].title}
                  </h3>
                  <p className="text-xl text-content-secondary dark:text-content-darkSecondary max-w-3xl mx-auto">
                    {roleContent[activeTab].description}
                  </p>
                </div>
                
                <div className="grid md:grid-cols-2 gap-8 lg:gap-16">
                  <ProblemSolutionCard
                    title="Common Problems"
                    items={roleContent[activeTab].problems}
                    type="problem"
                    useAnimations={false}
                  />
                  
                  <ProblemSolutionCard
                    title="Propagentic Solutions"
                    items={roleContent[activeTab].solutions}
                    type="solution"
                    useAnimations={false}
                  />
                </div>
              </div>
            }
          >
            <MotionContainer
              key={activeTab}
              initial={enableAnimations ? { opacity: 0, y: 20 } : {}}
              animate={enableAnimations ? { opacity: 1, y: 0 } : {}}
              exit={enableAnimations ? { opacity: 0, y: -20 } : {}}
              transition={enableAnimations ? { duration: 0.5, ease: "easeInOut" } : {}}
              className="max-w-5xl mx-auto"
            >
              <div className="text-center mb-16">
                <h3 className="text-3xl font-bold text-content dark:text-content-dark mb-4">
                  {roleContent[activeTab].title}
                </h3>
                <p className="text-xl text-content-secondary dark:text-content-darkSecondary max-w-3xl mx-auto">
                  {roleContent[activeTab].description}
                </p>
              </div>
              
              <div className="grid md:grid-cols-2 gap-8 lg:gap-16">
                <ProblemSolutionCard
                  title="Common Problems"
                  items={roleContent[activeTab].problems}
                  type="problem"
                  useAnimations={enableAnimations}
                />
                
                <ProblemSolutionCard
                  title="Propagentic Solutions"
                  items={roleContent[activeTab].solutions}
                  type="solution"
                  useAnimations={enableAnimations}
                />
              </div>
            </MotionContainer>
          </UIComponentErrorBoundary>
        </div>
      </div>
    </section>
  );
};

export default RoleProblemSolutionSection; 