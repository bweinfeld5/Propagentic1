import React from 'react';
import { UIComponentErrorBoundary } from '../../shared/ErrorBoundary';
import { SafeMotion } from '../../shared/SafeMotion';

interface DashboardPreviewProps {
  title?: string;
  subtitle?: string;
  mainImage?: string;
  secondaryImages?: string[];
  backgroundClass?: string;
}

const DashboardPreview: React.FC<DashboardPreviewProps> = ({
  title = "Powerful Dashboard for Full Control",
  subtitle = "Get a complete overview of your property portfolio with intuitive reporting and management tools",
  mainImage = "/images/dashboard-main.png",
  secondaryImages = [
    "/images/dashboard-analytics.png",
    "/images/dashboard-maintenance.png",
    "/images/dashboard-tenants.png"
  ],
  backgroundClass = "bg-white dark:bg-gray-900"
}) => {
  return (
    <UIComponentErrorBoundary componentName="DashboardPreview">
      <section id="dashboard" className={`py-24 ${backgroundClass}`}>
        <div className="container mx-auto px-4 md:px-6">
          <SafeMotion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center max-w-3xl mx-auto mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-gray-900 dark:text-white">
              {title}
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300">
              {subtitle}
            </p>
          </SafeMotion.div>

          <div className="grid md:grid-cols-3 gap-8 max-w-7xl mx-auto">
            <SafeMotion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="md:col-span-3 rounded-xl overflow-hidden shadow-2xl bg-gray-100 dark:bg-gray-800"
            >
              <img 
                src={mainImage} 
                alt="Property Management Dashboard" 
                className="w-full h-auto object-cover" 
              />
              <div className="p-6 bg-white dark:bg-gray-700">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  Main Dashboard
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Get a complete overview of your properties, rental income, expenses, and occupancy rates in real-time.
                </p>
              </div>
            </SafeMotion.div>

            {secondaryImages.map((image, index) => (
              <SafeMotion.div
                key={`dashboard-img-${index}`}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.2 * (index + 1) }}
                className="rounded-xl overflow-hidden shadow-xl bg-gray-100 dark:bg-gray-800"
              >
                <img 
                  src={image} 
                  alt={`Dashboard Feature ${index + 1}`} 
                  className="w-full h-48 md:h-52 lg:h-64 object-cover object-top" 
                />
                <div className="p-6 bg-white dark:bg-gray-700">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    {index === 0 && "Analytics & Reporting"}
                    {index === 1 && "Maintenance Tracking"}
                    {index === 2 && "Tenant Management"}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300">
                    {index === 0 && "Track key performance metrics with customizable reports and data visualizations."}
                    {index === 1 && "Manage maintenance requests, assign vendors, and track repair status."}
                    {index === 2 && "Keep tenant information organized and streamline communications."}
                  </p>
                </div>
              </SafeMotion.div>
            ))}
          </div>

          <SafeMotion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.8 }}
            className="text-center mt-16"
          >
            <a 
              href="#demo" 
              className="inline-flex items-center bg-primary hover:bg-primary-dark text-white font-medium py-3 px-6 rounded-lg transition-colors"
            >
              Request Demo
              <svg
                className="ml-2 h-5 w-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M14 5l7 7m0 0l-7 7m7-7H3"
                />
              </svg>
            </a>
          </SafeMotion.div>
        </div>
      </section>
    </UIComponentErrorBoundary>
  );
};

export default DashboardPreview; 