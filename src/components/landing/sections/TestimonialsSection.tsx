import React from 'react';
import { UIComponentErrorBoundary } from '../../shared/ErrorBoundary';
import { SafeMotion } from '../../shared/SafeMotion';
import AnimatedBlueprintBackground from '../../branding/AnimatedBlueprintBackground';

interface Testimonial {
  id: string;
  quote: string;
  author: string;
  position: string;
  company: string;
  rating: number;
  avatarSrc?: string;
}

interface TestimonialsSectionProps {
  title?: string;
  subtitle?: string;
  testimonials?: Testimonial[];
  backgroundClass?: string;
}

/**
 * Testimonials section component that showcases customer feedback with quotes, names, and company information
 */
const TestimonialsSection: React.FC<TestimonialsSectionProps> = ({
  title = "Trusted by Property Managers Nationwide",
  subtitle = "Hear what our customers have to say about how our platform has transformed their property management experience",
  testimonials = defaultTestimonials,
  backgroundClass = "bg-gray-50 dark:bg-gray-800"
}) => {
  return (
    <UIComponentErrorBoundary componentName="TestimonialsSection">
      <section id="testimonials" className={`py-24 relative overflow-hidden ${backgroundClass.replace('bg-gray-50', 'bg-gray-50/90').replace('dark:bg-gray-800', 'dark:bg-gray-800/90')}`}>
        {/* Blueprint Background - positioned with absolute */}
        <div className="absolute inset-0 z-1 overflow-hidden">
          <AnimatedBlueprintBackground density="sparse" section="testimonials" useInlineSvg={true} />
        </div>
        
        <div className="container mx-auto px-4 md:px-6 relative z-10">
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

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
            {testimonials.map((testimonial, index) => (
              <SafeMotion.div
                key={testimonial.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.1 * index }}
                className="bg-white dark:bg-gray-700 rounded-xl p-8 shadow-md hover:shadow-lg transition-shadow"
              >
                <div className="flex items-center mb-6">
                  <div className="mr-4">
                    <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-600">
                      {testimonial.avatarSrc ? (
                        <img 
                          src={testimonial.avatarSrc} 
                          alt={testimonial.author} 
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-primary text-white text-xl font-semibold">
                          {testimonial.author.charAt(0)}
                        </div>
                      )}
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {testimonial.author}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300 text-sm">
                      {testimonial.position}, {testimonial.company}
                    </p>
                    <div className="flex mt-1">
                      {[...Array(5)].map((_, i) => (
                        <svg
                          key={`star-${testimonial.id}-${i}`}
                          className={`w-4 h-4 ${
                            i < testimonial.rating 
                              ? 'text-yellow-400' 
                              : 'text-gray-300 dark:text-gray-600'
                          }`}
                          fill="currentColor"
                          viewBox="0 0 20 20"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      ))}
                    </div>
                  </div>
                </div>
                <div>
                  <svg 
                    className="w-8 h-8 text-primary opacity-40 mb-4" 
                    fill="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path d="M9.983 3V12C9.983 16.4183 6.40131 20 2.00098 20H1.98098C2.52798 16.4183 6.11498 12 9.98198 12H10.983V3H9.983ZM21.983 3V12C21.983 16.4183 18.4013 20 14.001 20H13.981C14.528 16.4183 18.115 12 21.982 12H22.983V3H21.983Z" />
                  </svg>
                  <p className="text-gray-700 dark:text-gray-200 mb-4 italic">
                    "{testimonial.quote}"
                  </p>
                </div>
              </SafeMotion.div>
            ))}
          </div>
          
          <SafeMotion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="text-center mt-16"
          >
            <a 
              href="#contact" 
              className="inline-flex items-center bg-primary hover:bg-primary-dark text-white font-medium py-3 px-6 rounded-lg transition-colors"
            >
              Become Our Next Success Story
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

const defaultTestimonials: Testimonial[] = [
  {
    id: 'testimonial-1',
    quote: "This platform has completely transformed how we manage our 120+ residential units. The automation for rent collection alone has saved us countless hours every month.",
    author: "Michael Thornton",
    position: "Property Manager",
    company: "Urban Living Properties",
    rating: 5,
    avatarSrc: "/images/testimonials/michael-t.jpg"
  },
  {
    id: 'testimonial-2',
    quote: "As a small property management company, we needed an affordable solution that could scale with us. This platform provided exactly that, and the tenant portal has dramatically improved our communication efficiency.",
    author: "Sarah Jenkins",
    position: "Owner",
    company: "Jenkins Property Group",
    rating: 5,
    avatarSrc: "/images/testimonials/sarah-j.jpg"
  },
  {
    id: 'testimonial-3',
    quote: "The maintenance request system has cut our response time in half. Our tenants are happier and we're saving money by addressing issues before they become major problems.",
    author: "David Rodriguez",
    position: "Maintenance Director",
    company: "Coastal Properties",
    rating: 4,
    avatarSrc: "/images/testimonials/david-r.jpg"
  },
  {
    id: 'testimonial-4',
    quote: "The financial reporting tools are exceptional. I can now generate detailed reports for our investors in minutes rather than days. The ROI on this platform has been tremendous.",
    author: "Jennifer Patel",
    position: "Financial Director",
    company: "Summit Investment Properties",
    rating: 5,
    avatarSrc: "/images/testimonials/jennifer-p.jpg"
  },
  {
    id: 'testimonial-5',
    quote: "We've tried several property management platforms, but this is the first one that truly understands what property managers need. The interface is intuitive and the customer support is outstanding.",
    author: "Robert Chen",
    position: "CEO",
    company: "Metropolitan Property Management",
    rating: 5,
    avatarSrc: "/images/testimonials/robert-c.jpg"
  },
  {
    id: 'testimonial-6',
    quote: "The lease management feature has been a game-changer for us. We can now handle renewals efficiently and keep all documentation organized in one place.",
    author: "Lisa Montgomery",
    position: "Leasing Manager",
    company: "Riverside Apartments",
    rating: 4,
    avatarSrc: "/images/testimonials/lisa-m.jpg"
  }
];

export default TestimonialsSection; 