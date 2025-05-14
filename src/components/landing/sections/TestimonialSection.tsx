import React, { useState } from 'react';
import { UIComponentErrorBoundary } from '../../shared/ErrorBoundary';
import { SafeMotion } from '../../shared/SafeMotion';

interface Testimonial {
  id: string;
  quote: string;
  author: string;
  position: string;
  company: string;
  avatarUrl?: string;
  rating?: number;
}

interface TestimonialSectionProps {
  title?: string;
  subtitle?: string;
  testimonials?: Testimonial[];
  backgroundClass?: string;
}

const TestimonialSection: React.FC<TestimonialSectionProps> = ({
  title = "What our customers are saying",
  subtitle = "Discover how Propagentic is helping property managers streamline their operations",
  testimonials = defaultTestimonials,
  backgroundClass = "bg-white dark:bg-gray-900",
}) => {
  const [activeIndex, setActiveIndex] = useState(0);

  const nextTestimonial = () => {
    setActiveIndex((current) => 
      current === testimonials.length - 1 ? 0 : current + 1
    );
  };

  const prevTestimonial = () => {
    setActiveIndex((current) => 
      current === 0 ? testimonials.length - 1 : current - 1
    );
  };

  const goToTestimonial = (index: number) => {
    setActiveIndex(index);
  };

  return (
    <UIComponentErrorBoundary componentName="TestimonialSection">
      <section className={`py-20 ${backgroundClass}`}>
        <div className="container mx-auto px-4 md:px-6">
          <SafeMotion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center max-w-3xl mx-auto mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-gray-900 dark:text-white">
              {title}
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300">
              {subtitle}
            </p>
          </SafeMotion.div>

          <div className="max-w-5xl mx-auto">
            <SafeMotion.div
              key={testimonials[activeIndex].id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
              className="relative"
            >
              <div className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-8 md:p-12 shadow-sm">
                <div className="flex flex-col items-center">
                  {testimonials[activeIndex].rating && (
                    <div className="flex mb-6">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <svg
                          key={i}
                          className={`w-6 h-6 ${
                            i < testimonials[activeIndex].rating!
                              ? 'text-yellow-400'
                              : 'text-gray-300 dark:text-gray-600'
                          }`}
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      ))}
                    </div>
                  )}
                  
                  <div className="text-xl md:text-2xl font-medium text-gray-900 dark:text-white mb-8 text-center leading-relaxed">
                    <svg
                      className="w-8 h-8 text-primary/40 mb-4 mx-auto"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
                    </svg>
                    {testimonials[activeIndex].quote}
                  </div>
                  
                  <div className="flex items-center">
                    {testimonials[activeIndex].avatarUrl ? (
                      <img
                        src={testimonials[activeIndex].avatarUrl}
                        alt={testimonials[activeIndex].author}
                        className="w-14 h-14 rounded-full object-cover mr-4"
                      />
                    ) : (
                      <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xl mr-4">
                        {testimonials[activeIndex].author.charAt(0)}
                      </div>
                    )}
                    
                    <div className="text-left">
                      <div className="font-bold text-gray-900 dark:text-white">
                        {testimonials[activeIndex].author}
                      </div>
                      <div className="text-gray-600 dark:text-gray-300 text-sm">
                        {testimonials[activeIndex].position}, {testimonials[activeIndex].company}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-between items-center mt-8">
                <button
                  onClick={prevTestimonial}
                  className="p-2 rounded-full bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:text-primary dark:hover:text-primary border border-gray-200 dark:border-gray-700 hover:border-primary dark:hover:border-primary transition-colors"
                  aria-label="Previous testimonial"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                
                <div className="flex space-x-2">
                  {testimonials.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => goToTestimonial(index)}
                      className={`w-3 h-3 rounded-full transition-colors ${
                        index === activeIndex
                          ? 'bg-primary'
                          : 'bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500'
                      }`}
                      aria-label={`Go to testimonial ${index + 1}`}
                    />
                  ))}
                </div>
                
                <button
                  onClick={nextTestimonial}
                  className="p-2 rounded-full bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:text-primary dark:hover:text-primary border border-gray-200 dark:border-gray-700 hover:border-primary dark:hover:border-primary transition-colors"
                  aria-label="Next testimonial"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </SafeMotion.div>
          </div>
        </div>
      </section>
    </UIComponentErrorBoundary>
  );
};

const defaultTestimonials: Testimonial[] = [
  {
    id: 'testimonial-1',
    quote: "Propagentic has transformed how we manage our properties. The automated maintenance tracking alone has saved us countless hours every month. It's been a game-changer for our business.",
    author: "Sarah Johnson",
    position: "Operations Director",
    company: "Urban Property Management",
    rating: 5
  },
  {
    id: 'testimonial-2',
    quote: "As a small landlord, I needed something simple yet powerful. Propagentic gives me professional-level tools without the enterprise complexity. My tenants love the portal, and I love the organization it brings.",
    author: "Michael Chen",
    position: "Owner",
    company: "Chen Properties",
    avatarUrl: "/images/testimonials/michael-chen.jpg",
    rating: 5
  },
  {
    id: 'testimonial-3',
    quote: "We've tried several property management platforms, but none compared to Propagentic's combination of power and ease of use. The reporting features give us insights we never had before.",
    author: "Jessica Williams",
    position: "CEO",
    company: "Coastline Properties",
    rating: 4
  },
  {
    id: 'testimonial-4',
    quote: "The customer support at Propagentic is exceptional. Any time we've had questions or needed help, their team has been responsive and knowledgeable. It's rare to find this level of service.",
    author: "Robert Martinez",
    position: "Property Manager",
    company: "Parkview Residentials",
    avatarUrl: "/images/testimonials/robert-martinez.jpg",
    rating: 5
  }
];

export default TestimonialSection; 