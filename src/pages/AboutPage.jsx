import React from 'react';
import { Link } from 'react-router-dom';
import Footer from '../components/layout/Footer'; // Assuming a generic footer exists
import { UsersIcon, LightBulbIcon, ChartBarIcon, RocketLaunchIcon, BuildingOfficeIcon, UserGroupIcon } from '@heroicons/react/24/outline';
import Button from '../components/ui/Button';
import { UserCircleIcon } from '@heroicons/react/24/solid';

// --- Define Data Arrays ---
const coreValues = [
  {
    title: "Innovation",
    icon: RocketLaunchIcon,
    color: "text-primary dark:text-primary-light",
    description: "Continuously leveraging AI and technology to solve real-world property management challenges."
  },
  {
    title: "Efficiency",
    icon: ChartBarIcon,
    color: "text-secondary dark:text-secondary-light",
    description: "Streamlining workflows and automating tasks to save time and resources for everyone."
  },
  {
    title: "Transparency",
    icon: UsersIcon,
    color: "text-success dark:text-emerald-300",
    description: "Fostering clear communication and open access to information for landlords, tenants, and contractors."
  }
];

const teamMembers = [
  { name: "Alex Thompson", title: "CEO & Founder", imageUrl: null }, // Add actual image URLs if available
  { name: "Sarah Chen", title: "Head of Product", imageUrl: null },
  { name: "David Lee", title: "Lead AI Engineer", imageUrl: null },
  { name: "Maria Garcia", title: "UX Lead", imageUrl: null }
];
// --- End Data Arrays ---

const AboutPage = () => {
  return (
    <div className="min-h-screen bg-background dark:bg-background-dark">
      {/* Hero Section - Use theme colors */}
      <div className="relative bg-gradient-to-br from-primary to-primary-light dark:from-primary-dark dark:to-primary text-white py-20">
        <div className="absolute inset-0 bg-black/10 dark:bg-black/30"></div>
        <div className="relative container mx-auto px-6 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">About Propagentic</h1>
          <p className="text-xl max-w-3xl mx-auto text-primary-light/90 dark:text-primary-light/80">
            Modernizing property management with intelligent automation and seamless communication.
          </p>
        </div>
      </div>

      {/* Main Content - Use theme colors */}
      <main className="container mx-auto px-6 py-16 md:py-24">
        {/* Mission Section */}
        <section className="mb-16 md:mb-24 text-center">
          <div className="max-w-3xl mx-auto">
            <BuildingOfficeIcon className="w-16 h-16 mx-auto mb-6 text-primary dark:text-primary-light" />
            <h2 className="text-3xl font-bold text-content dark:text-content-dark mb-6">Our Mission</h2>
            <p className="text-lg text-content-secondary dark:text-content-darkSecondary">
              To empower landlords, tenants, and contractors with a unified, intelligent platform that simplifies property management, enhances communication, and optimizes maintenance workflows through the power of AI.
            </p>
          </div>
        </section>

        {/* Vision Section */}
        <section className="mb-16 md:mb-24 text-center">
          <div className="max-w-3xl mx-auto">
            <RocketLaunchIcon className="w-16 h-16 mx-auto mb-6 text-secondary dark:text-secondary-light" />
            <h2 className="text-3xl font-bold text-content dark:text-content-dark mb-6">Our Vision</h2>
            <p className="text-lg text-content-secondary dark:text-content-darkSecondary">
              To be the leading AI-driven property management ecosystem, fostering transparent and efficient relationships within the rental housing market globally.
            </p>
          </div>
        </section>

        {/* Core Values Section - Use theme colors */}
        <section className="bg-background-subtle dark:bg-background-darkSubtle py-16 md:py-24 rounded-lg border border-border dark:border-border-dark mb-16 md:mb-24">
          <div className="container mx-auto px-6">
            <div className="text-center mb-12">
              <LightBulbIcon className="w-16 h-16 mx-auto mb-6 text-primary dark:text-primary-light" />
              <h2 className="text-3xl font-bold text-content dark:text-content-dark mb-4">Our Core Values</h2>
              <p className="text-lg text-content-secondary dark:text-content-darkSecondary max-w-2xl mx-auto">
                The principles that guide our development and interactions.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Map over coreValues data */}
              {coreValues.map((value) => (
                 <ValueCard key={value.title} title={value.title} icon={value.icon} color={value.color}>
                    {value.description}
                 </ValueCard>
               ))}
            </div>
          </div>
        </section>

        {/* Team Section - Use theme colors */}
        <section className="text-center mb-16 md:mb-24">
          <UserGroupIcon className="w-16 h-16 mx-auto mb-6 text-primary dark:text-primary-light" />
          <h2 className="text-3xl font-bold text-content dark:text-content-dark mb-12">Our Team</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
             {/* Map over teamMembers data */}
             {teamMembers.map((member) => (
                <TeamMemberCard key={member.name} name={member.name} title={member.title} imageUrl={member.imageUrl} />
              ))}
          </div>
        </section>

        {/* Call to Action - Use theme colors */}
        <section className="bg-gradient-to-r from-primary to-secondary text-white py-16 rounded-lg text-center">
          <div className="container mx-auto px-6">
            <h2 className="text-3xl font-bold mb-4">Ready to Modernize Your Property Management?</h2>
            <p className="text-lg mb-8 max-w-2xl mx-auto text-primary-light/90 dark:text-secondary-light/90">
              Join Propagentic today and experience the future of efficient, AI-powered property management.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button to="/auth?tab=signup" variant="light" size="lg">Get Started Free</Button>
              <Button to="/demo" variant="outline-inverse" size="lg">Watch Demo</Button>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

// Sub-component for Value Card - Use theme colors
const ValueCard = ({ title, icon: Icon, color, children }) => (
  <div className="bg-background dark:bg-background-darkSubtle rounded-xl p-6 shadow-md border border-border dark:border-border-dark text-center">
    <div className={`w-12 h-12 rounded-full mx-auto bg-primary/10 dark:bg-primary/20 flex items-center justify-center ${color} mb-4`}>
      <Icon className="w-6 h-6" />
    </div>
    <h3 className="text-xl font-semibold text-content dark:text-content-dark mb-2">{title}</h3>
    <p className="text-content-secondary dark:text-content-darkSecondary">{children}</p>
  </div>
);

// Sub-component for Team Member Card - Use theme colors
const TeamMemberCard = ({ name, title, imageUrl = null }) => (
  <div className="bg-background dark:bg-background-darkSubtle rounded-xl p-6 shadow-md border border-border dark:border-border-dark">
    <div className={`w-24 h-24 mx-auto bg-neutral-100 dark:bg-neutral-700 rounded-full mb-4 flex items-center justify-center text-neutral-400 dark:text-neutral-500 overflow-hidden`}>
      {imageUrl ? 
        <img src={imageUrl} alt={name} className="w-full h-full object-cover"/> : 
        <UserCircleIcon className="w-16 h-16"/>
      }
    </div>
    <h3 className="text-xl font-semibold text-content dark:text-content-dark mb-1 text-center">{name}</h3>
    <p className="text-primary dark:text-primary-light text-sm mb-3 text-center">{title}</p>
    {/* Add social links or short bio if needed */}
  </div>
);

export default AboutPage; 