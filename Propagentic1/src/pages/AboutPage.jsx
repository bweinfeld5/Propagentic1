import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Footer from '../components/layout/Footer';
import { 
  UsersIcon, 
  LightBulbIcon, 
  ChartBarIcon, 
  RocketLaunchIcon, 
  BuildingOfficeIcon, 
  UserGroupIcon,
  CalendarIcon,
  CheckCircleIcon,
  StarIcon,
  AcademicCapIcon,
  BriefcaseIcon
} from '@heroicons/react/24/outline';
import Button from '../components/ui/Button';
import { UserCircleIcon } from '@heroicons/react/24/solid';

// Company milestones and timeline data
const companyMilestones = [
  {
    year: "2023",
    quarter: "Q1",
    title: "Company Founded",
    description: "Ben Weinfeld founded PropAgentic with a vision to modernize property management through AI",
    icon: RocketLaunchIcon,
    color: "text-primary dark:text-primary-light",
    details: "Started development of the core AI-powered maintenance dispatch system"
  },
  {
    year: "2023",
    quarter: "Q2", 
    title: "AI Engine Development",
    description: "Built the first version of our AI classification and contractor matching system",
    icon: LightBulbIcon,
    color: "text-secondary dark:text-secondary-light",
    details: "Achieved 95% accuracy in maintenance request categorization"
  },
  {
    year: "2023",
    quarter: "Q3",
    title: "Beta Platform Launch",
    description: "Launched beta platform with initial property management partners",
    icon: BuildingOfficeIcon,
    color: "text-success dark:text-emerald-300",
    details: "Onboarded first 50 properties and 100+ contractors"
  },
  {
    year: "2023",
    quarter: "Q4",
    title: "Contractor Onboarding System",
    description: "Deployed comprehensive contractor verification and payment system",
    icon: UsersIcon,
    color: "text-warning dark:text-yellow-300",
    details: "Integrated Stripe Connect for seamless contractor payments"
  },
  {
    year: "2024",
    quarter: "Q1",
    title: "Scale & Growth",
    description: "Expanded to 500+ properties with 1000+ maintenance requests processed",
    icon: ChartBarIcon,
    color: "text-info dark:text-blue-300",
    details: "Achieved 4.2 hour average response time and 98% satisfaction rate"
  },
  {
    year: "2024",
    quarter: "Q2",
    title: "Advanced Features",
    description: "Launched predictive maintenance and automated workflow optimization",
    icon: StarIcon,
    color: "text-primary dark:text-primary-light",
    details: "Reduced maintenance costs by 30% through predictive analytics"
  }
];

// Core values data
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
  },
  {
    title: "Reliability",
    icon: CheckCircleIcon,
    color: "text-info dark:text-blue-300", 
    description: "Building systems our users can count on, from infrastructure to contractor matching."
  }
];

// Company metrics and achievements
const achievements = [
  { metric: "500+", label: "Properties Managed", icon: BuildingOfficeIcon },
  { metric: "1000+", label: "Contractors Verified", icon: UsersIcon },
  { metric: "5000+", label: "Requests Processed", icon: CheckCircleIcon },
  { metric: "4.2hrs", label: "Avg Response Time", icon: CalendarIcon },
  { metric: "98%", label: "Satisfaction Rate", icon: StarIcon },
  { metric: "30%", label: "Cost Reduction", icon: ChartBarIcon }
];

// Founder profile data
const founderProfile = {
  name: "Ben Weinfeld",
  title: "Founder & CEO",
  education: "Wake Forest University",
  previousWork: ["Techstars", "EcoMap Technologies", "410 Haulers"],
  bio: [
    "Ben founded PropAgentic out of a lifelong proximity to real estate and a deep curiosity for the power of automation. Growing up in a family deeply embedded in the industry—his father leading Kittredge Properties and his brother working in asset management at AXA Investment Managers—Ben witnessed firsthand the behind-the-scenes strain of managing buildings and tenants.",
    "Even on family vacations, it wasn't uncommon to see his dad stepping away to answer urgent calls about leaking pipes or malfunctioning HVAC units. The stress of coordinating contractors on short notice and keeping tenants happy was a recurring burden. Those moments stuck with Ben.",
    "Now a business student at Wake Forest University with experience at Techstars and EcoMap Technologies, Ben is blending his entrepreneurial drive with his passion for AI to modernize the property management experience. PropAgentic is his answer to the chaos he grew up watching—streamlining maintenance communication between landlords, tenants, and contractors through smart, AI-powered workflows.",
    "From hauling junk in high school to scaling SaaS, Ben's mission remains constant: solve real problems with practical, human-centered technology."
  ],
  achievements: [
    "Built and scaled 410 Haulers, a profitable junk removal business",
    "Worked with Techstars on fundraising and growth strategies", 
    "Revenue operations at EcoMap Technologies",
    "Studying Business at Wake Forest University"
  ]
};

const AboutPage = () => {
  const [selectedMilestone, setSelectedMilestone] = useState(null);
  const [activeTab, setActiveTab] = useState('story');

  return (
    <div className="min-h-screen bg-background dark:bg-background-dark">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-br from-primary to-primary-light dark:from-primary-dark dark:to-primary text-white py-20">
        <div className="absolute inset-0 bg-black/10 dark:bg-black/30"></div>
        <div className="relative container mx-auto px-6 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">About PropAgentic</h1>
          <p className="text-xl max-w-3xl mx-auto text-primary-light/90 dark:text-primary-light/80">
            Modernizing property management with intelligent automation and seamless communication since 2023.
          </p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="container mx-auto px-6 py-8">
        <div className="flex flex-wrap justify-center gap-4 mb-8">
          {[
            { id: 'story', label: 'Our Story', icon: RocketLaunchIcon },
            { id: 'timeline', label: 'Company Timeline', icon: CalendarIcon },
            { id: 'founder', label: 'Meet the Founder', icon: UserCircleIcon },
            { id: 'values', label: 'Our Values', icon: LightBulbIcon }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
                activeTab === tab.id
                  ? 'bg-primary text-white shadow-lg'
                  : 'bg-background-subtle dark:bg-background-darkSubtle text-content dark:text-content-dark hover:bg-primary/10'
              }`}
            >
              <tab.icon className="w-5 h-5" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <main className="container mx-auto px-6 pb-16">
        {/* Our Story Tab */}
        {activeTab === 'story' && (
          <div className="space-y-16">
            {/* Mission & Vision */}
            <div className="grid md:grid-cols-2 gap-12">
              <section className="text-center">
                <BuildingOfficeIcon className="w-16 h-16 mx-auto mb-6 text-primary dark:text-primary-light" />
                <h2 className="text-3xl font-bold text-content dark:text-content-dark mb-6">Our Mission</h2>
                <p className="text-lg text-content-secondary dark:text-content-darkSecondary">
                  To empower landlords, tenants, and contractors with a unified, intelligent platform that simplifies property management, enhances communication, and optimizes maintenance workflows through the power of AI.
                </p>
              </section>

              <section className="text-center">
                <RocketLaunchIcon className="w-16 h-16 mx-auto mb-6 text-secondary dark:text-secondary-light" />
                <h2 className="text-3xl font-bold text-content dark:text-content-dark mb-6">Our Vision</h2>
                <p className="text-lg text-content-secondary dark:text-content-darkSecondary">
                  To be the leading AI-driven property management ecosystem, fostering transparent and efficient relationships within the rental housing market globally.
                </p>
              </section>
            </div>

            {/* Achievements Grid */}
            <section className="bg-background-subtle dark:bg-background-darkSubtle py-16 rounded-xl border border-border dark:border-border-dark">
              <div className="text-center mb-12">
                <h2 className="text-3xl font-bold text-content dark:text-content-dark mb-4">Our Impact</h2>
                <p className="text-lg text-content-secondary dark:text-content-darkSecondary max-w-2xl mx-auto">
                  Real results from real property management challenges.
                </p>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8">
                {achievements.map((achievement, index) => (
                  <div key={index} className="text-center">
                    <div className="bg-primary/10 dark:bg-primary/20 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                      <achievement.icon className="w-8 h-8 text-primary dark:text-primary-light" />
                    </div>
                    <div className="text-2xl font-bold text-content dark:text-content-dark mb-1">
                      {achievement.metric}
                    </div>
                    <div className="text-sm text-content-secondary dark:text-content-darkSecondary">
                      {achievement.label}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}

        {/* Company Timeline Tab */}
        {activeTab === 'timeline' && (
          <div className="space-y-12">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-content dark:text-content-dark mb-4">Company Timeline</h2>
              <p className="text-lg text-content-secondary dark:text-content-darkSecondary max-w-2xl mx-auto">
                Our journey from idea to industry-leading AI property management platform.
              </p>
            </div>

            {/* Timeline */}
            <div className="relative">
              {/* Timeline Line */}
              <div className="absolute left-8 top-0 bottom-0 w-px bg-border dark:bg-border-dark"></div>
              
              <div className="space-y-12">
                {companyMilestones.map((milestone, index) => (
                  <div key={index} className="relative flex items-start gap-8">
                    {/* Timeline Node */}
                    <div className={`relative z-10 w-16 h-16 rounded-full bg-background dark:bg-background-dark border-4 border-border dark:border-border-dark flex items-center justify-center ${milestone.color}`}>
                      <milestone.icon className="w-8 h-8" />
                    </div>
                    
                    {/* Content */}
                    <div 
                      className="flex-1 bg-background-subtle dark:bg-background-darkSubtle rounded-lg p-6 border border-border dark:border-border-dark cursor-pointer hover:shadow-lg transition-all duration-200"
                      onClick={() => setSelectedMilestone(selectedMilestone === index ? null : index)}
                    >
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <span className="text-sm font-medium text-content-secondary dark:text-content-darkSecondary">
                            {milestone.year} {milestone.quarter}
                          </span>
                          <h3 className="text-xl font-bold text-content dark:text-content-dark">
                            {milestone.title}
                          </h3>
                        </div>
                        <ChartBarIcon className={`w-5 h-5 transition-transform duration-200 ${selectedMilestone === index ? 'rotate-180' : ''} text-content-secondary dark:text-content-darkSecondary`} />
                      </div>
                      
                      <p className="text-content-secondary dark:text-content-darkSecondary mb-4">
                        {milestone.description}
                      </p>
                      
                      {selectedMilestone === index && (
                        <div className="pt-4 border-t border-border dark:border-border-dark">
                          <p className="text-sm text-content-secondary dark:text-content-darkSecondary">
                            {milestone.details}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Founder Tab */}
        {activeTab === 'founder' && (
          <div className="space-y-12">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-content dark:text-content-dark mb-4">Meet the Founder</h2>
              <p className="text-lg text-content-secondary dark:text-content-darkSecondary max-w-2xl mx-auto">
                The vision and drive behind PropAgentic's mission to transform property management.
              </p>
            </div>

            {/* Founder Profile */}
            <div className="bg-background-subtle dark:bg-background-darkSubtle rounded-xl border border-border dark:border-border-dark overflow-hidden">
              <div className="md:flex">
                {/* Photo Section */}
                <div className="md:flex-shrink-0 md:w-1/3">
                  <div className="h-full md:h-96 bg-gradient-to-br from-primary/20 to-secondary/20 relative">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-48 h-48 md:w-56 md:h-56 rounded-full overflow-hidden border-4 border-background dark:border-background-dark shadow-lg">
                        <img
                          src="/ben-weinfeld.jpg"
                          alt={founderProfile.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(founderProfile.name)}&background=1E6F68&color=fff&size=256`;
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Bio Section */}
                <div className="p-8 md:p-10 md:w-2/3">
                  <div className="uppercase tracking-wide text-sm text-primary font-semibold">{founderProfile.title}</div>
                  <h3 className="mt-1 text-2xl font-bold text-content dark:text-content-dark">{founderProfile.name}</h3>
                  
                  <div className="flex items-center gap-4 mt-4 mb-6">
                    <div className="flex items-center gap-2">
                      <AcademicCapIcon className="w-5 h-5 text-content-secondary dark:text-content-darkSecondary" />
                      <span className="text-sm text-content-secondary dark:text-content-darkSecondary">{founderProfile.education}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <BriefcaseIcon className="w-5 h-5 text-content-secondary dark:text-content-darkSecondary" />
                      <span className="text-sm text-content-secondary dark:text-content-darkSecondary">{founderProfile.previousWork.join(', ')}</span>
                    </div>
                  </div>
                  
                  <div className="space-y-4 text-content-secondary dark:text-content-darkSecondary">
                    {founderProfile.bio.map((paragraph, index) => (
                      <p key={index}>{paragraph}</p>
                    ))}
                  </div>
                  
                  {/* Achievements */}
                  <div className="mt-8">
                    <h4 className="text-lg font-semibold text-content dark:text-content-dark mb-4">Key Achievements</h4>
                    <ul className="space-y-2">
                      {founderProfile.achievements.map((achievement, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <CheckCircleIcon className="w-5 h-5 text-success dark:text-emerald-300 mt-0.5" />
                          <span className="text-content-secondary dark:text-content-darkSecondary">{achievement}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  {/* Social Links */}
                  <div className="mt-8 flex gap-4">
                    <a href="https://www.linkedin.com/in/benweinfeld/" target="_blank" rel="noopener noreferrer" className="text-content-secondary hover:text-primary dark:text-content-darkSecondary dark:hover:text-primary-light transition-colors duration-150">
                      <span className="sr-only">LinkedIn</span>
                      <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                      </svg>
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Values Tab */}
        {activeTab === 'values' && (
          <div className="space-y-12">
            <div className="text-center mb-12">
              <LightBulbIcon className="w-16 h-16 mx-auto mb-6 text-primary dark:text-primary-light" />
              <h2 className="text-3xl font-bold text-content dark:text-content-dark mb-4">Our Core Values</h2>
              <p className="text-lg text-content-secondary dark:text-content-darkSecondary max-w-2xl mx-auto">
                The principles that guide our development and interactions with our community.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {coreValues.map((value, index) => (
                <ValueCard key={value.title} title={value.title} icon={value.icon} color={value.color}>
                  {value.description}
                </ValueCard>
              ))}
            </div>
          </div>
        )}

        {/* Call to Action */}
        <section className="mt-16 bg-gradient-to-r from-primary to-secondary text-white py-16 rounded-lg text-center">
          <div className="container mx-auto px-6">
            <h2 className="text-3xl font-bold mb-4">Ready to Modernize Your Property Management?</h2>
            <p className="text-lg mb-8 max-w-2xl mx-auto text-primary-light/90">
              Join PropAgentic today and experience the future of efficient, AI-powered property management.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button to="/signup" variant="light" size="lg">Get Started Free</Button>
              <Button to="/demo/pitchdeck" variant="outline-inverse" size="lg">Schedule Demo</Button>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

// Value Card Component
const ValueCard = ({ title, icon: Icon, color, children }) => (
  <div className="bg-background dark:bg-background-darkSubtle rounded-xl p-8 shadow-md border border-border dark:border-border-dark text-center hover:shadow-lg transition-shadow duration-200">
    <div className={`w-16 h-16 rounded-full mx-auto bg-primary/10 dark:bg-primary/20 flex items-center justify-center ${color} mb-6`}>
      <Icon className="w-8 h-8" />
    </div>
    <h3 className="text-xl font-semibold text-content dark:text-content-dark mb-4">{title}</h3>
    <p className="text-content-secondary dark:text-content-darkSecondary">{children}</p>
  </div>
);

export default AboutPage; 