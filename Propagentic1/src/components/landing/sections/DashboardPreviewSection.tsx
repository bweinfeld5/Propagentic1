import React from 'react';
import { SafeMotion } from '../../shared/SafeMotion';
import { UIComponentErrorBoundary } from '../../shared/ErrorBoundary';

interface DashboardPreviewSectionProps {
  title?: string;
  subtitle?: string;
  imagePath?: string;
  features?: Array<{
    title: string;
    description: string;
    icon: React.ReactNode;
  }>;
}

/**
 * A section showcasing the dashboard interface with highlighted features
 */
const DashboardPreviewSection: React.FC<DashboardPreviewSectionProps> = ({
  title = "Powerful dashboard at your fingertips",
  subtitle = "Get a complete overview of your properties with our intuitive dashboard",
  imagePath = "/images/dashboard-preview.png",
  features = defaultFeatures
}) => {
  return (
    <UIComponentErrorBoundary componentName="DashboardPreviewSection">
      <section className="py-20 bg-neutral-50 dark:bg-neutral-900">
        <div className="container mx-auto px-4 md:px-6">
          <SafeMotion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-3xl md:text-5xl font-bold text-neutral-900 dark:text-white mb-4">
              {title}
            </h2>
            <p className="text-xl text-neutral-600 dark:text-neutral-300 max-w-3xl mx-auto">
              {subtitle}
            </p>
          </SafeMotion.div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Dashboard Preview Image */}
            <SafeMotion.div 
              className="lg:col-span-7 order-2 lg:order-1"
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
            >
              <div className="relative">
                {/* Shadow effect */}
                <div className="absolute -bottom-6 -right-6 w-full h-full bg-gradient-to-br from-primary/30 to-primary/10 rounded-xl"></div>
                
                {/* Dashboard screenshot */}
                <div className="relative z-10 rounded-xl overflow-hidden shadow-2xl border border-neutral-200 dark:border-neutral-700">
                  <img 
                    src={imagePath} 
                    alt="Property management dashboard interface" 
                    className="w-full h-auto"
                  />
                  
                  {/* Overlay gradient */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                  
                  {/* Animated cursor/interaction hint */}
                  <SafeMotion.div
                    className="absolute w-5 h-5 rounded-full bg-primary shadow-lg"
                    animate={{
                      x: [100, 350, 600, 350, 100],
                      y: [150, 250, 150, 250, 150],
                      scale: [1, 1.2, 1, 1.2, 1]
                    }}
                    transition={{
                      duration: 15,
                      repeat: Infinity,
                      repeatType: "loop"
                    }}
                  />
                </div>
              </div>
            </SafeMotion.div>

            {/* Feature list */}
            <div className="lg:col-span-5 order-1 lg:order-2">
              <div className="space-y-8">
                {features.map((feature, index) => (
                  <SafeMotion.div
                    key={index}
                    className="flex gap-4"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                  >
                    <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                      {feature.icon}
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-neutral-900 dark:text-white mb-2">
                        {feature.title}
                      </h3>
                      <p className="text-neutral-600 dark:text-neutral-400">
                        {feature.description}
                      </p>
                    </div>
                  </SafeMotion.div>
                ))}
              </div>

              <SafeMotion.div
                className="mt-10"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.4 }}
              >
                <a 
                  href="/demo" 
                  className="inline-flex items-center gap-2 px-6 py-3 bg-primary hover:bg-primary-dark text-white font-medium rounded-lg transition-colors"
                >
                  Schedule a Live Demo
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </a>
              </SafeMotion.div>
            </div>
          </div>

          {/* Dashboard stats/highlights */}
          <div className="mt-24 grid grid-cols-1 md:grid-cols-4 gap-6">
            {stats.map((stat, index) => (
              <SafeMotion.div
                key={index}
                className="bg-white dark:bg-neutral-800 rounded-xl p-6 shadow-md"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <div className={`text-2xl mb-2 ${stat.textColor}`}>
                  {stat.icon}
                </div>
                <h3 className="text-3xl font-bold text-neutral-900 dark:text-white mb-1">
                  {stat.value}
                </h3>
                <p className="text-neutral-600 dark:text-neutral-400 text-sm">
                  {stat.label}
                </p>
              </SafeMotion.div>
            ))}
          </div>
        </div>
      </section>
    </UIComponentErrorBoundary>
  );
};

// Default dashboard features
const defaultFeatures = [
  {
    title: "All-in-one Overview",
    description: "See everything at a glance with customizable widgets for occupancy, financial performance, maintenance, and more.",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
      </svg>
    )
  },
  {
    title: "Real-time Insights",
    description: "Make data-driven decisions with actionable metrics and real-time analytics about your property portfolio.",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    )
  },
  {
    title: "Task Management",
    description: "Automate and assign tasks to your team members with priority-based workflows and deadline tracking.",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
      </svg>
    )
  },
  {
    title: "Customizable Reporting",
    description: "Generate comprehensive reports with just a few clicks. Export in multiple formats or schedule automatic delivery.",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    )
  }
];

// Dashboard stats
const stats = [
  {
    value: "99.8%",
    label: "System uptime",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
      </svg>
    ),
    textColor: "text-green-500"
  },
  {
    value: "30%",
    label: "Average time saved on tasks",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    textColor: "text-blue-500"
  },
  {
    value: "10k+",
    label: "Properties managed",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
    ),
    textColor: "text-purple-500"
  },
  {
    value: "93%",
    label: "Customer satisfaction",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    textColor: "text-yellow-500"
  }
];

export default DashboardPreviewSection; 