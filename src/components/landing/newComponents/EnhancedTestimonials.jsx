import React, { useState, useEffect } from 'react';
import { SafeMotion, AnimatePresence } from "../../shared/SafeMotion";

const testimonials = [
  {
    quote: "Propagentic has completely transformed how we manage our properties. Maintenance requests are handled 3x faster, and our tenants are much happier.",
    name: "Michael Johnson",
    role: "Property Manager",
    company: "Urban Living Properties",
    avatar: "https://randomuser.me/api/portraits/men/32.jpg",
    rating: 5
  },
  {
    quote: "As a tenant, I love how easy it is to report issues and communicate with my landlord. The app notifications keep me updated on everything.",
    name: "Sarah Williams",
    role: "Tenant",
    company: "Resident since 2022",
    avatar: "https://randomuser.me/api/portraits/women/44.jpg",
    rating: 5
  },
  {
    quote: "I've increased my business by 40% since joining Propagentic's contractor network. The job requests are consistent and payments are always on time.",
    name: "David Rodriguez",
    role: "Contractor",
    company: "Rodriguez Repairs",
    avatar: "https://randomuser.me/api/portraits/men/67.jpg",
    rating: 4
  }
];

const EnhancedTestimonials = () => {
  const [current, setCurrent] = useState(0);
  
  // Auto-rotate testimonials
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrent((prevCurrent) => (prevCurrent + 1) % testimonials.length);
    }, 8000);
    
    return () => clearInterval(interval);
  }, []);
  
  // Handle manual navigation
  const goToTestimonial = (index) => {
    setCurrent(index);
  };
  
  // Handle next and previous buttons
  const goToNext = () => {
    setCurrent((prevCurrent) => (prevCurrent + 1) % testimonials.length);
  };
  
  const goToPrevious = () => {
    setCurrent((prevCurrent) => (prevCurrent - 1 + testimonials.length) % testimonials.length);
  };
  
  // Render rating stars
  const renderStars = (rating) => {
    return Array.from({ length: 5 }).map((_, index) => (
      <svg 
        key={index}
        className={`w-5 h-5 ${index < rating ? 'text-propagentic-warning' : 'text-propagentic-neutral'}`}
        fill="currentColor"
        viewBox="0 0 20 20"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
      </svg>
    ));
  };
  
  return (
    <section className="py-16 md:py-24 bg-propagentic-neutral-light dark:bg-propagentic-slate-dark relative overflow-hidden">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-propagentic-slate-dark dark:text-propagentic-neutral-lightest mb-4">
            What Our Users Are Saying
          </h2>
          <p className="text-xl text-propagentic-slate dark:text-propagentic-neutral-light max-w-3xl mx-auto">
            Join thousands of satisfied users who have transformed their property management experience.
          </p>
        </div>
        
        <div className="relative max-w-4xl mx-auto">
          {/* Testimonial cards */}
          <div className="relative h-[380px] md:h-[320px]">
            <AnimatePresence mode="wait">
              <SafeMotion.div
                key={current}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.5 }}
                className="absolute inset-0"
              >
                <div className="bg-propagentic-neutral-lightest dark:bg-propagentic-neutral-dark shadow-card rounded-xl p-8 md:p-10 h-full flex flex-col justify-between">
                  <div>
                    <div className="flex items-center mb-6">
                      <img 
                        src={testimonials[current].avatar} 
                        alt={testimonials[current].name} 
                        className="w-14 h-14 rounded-full object-cover mr-4 border-2 border-propagentic-neutral dark:border-propagentic-neutral-medium"
                      />
                      <div>
                        <h4 className="text-lg font-semibold text-propagentic-slate-dark dark:text-propagentic-neutral-lightest">
                          {testimonials[current].name}
                        </h4>
                        <p className="text-propagentic-slate dark:text-propagentic-neutral-light">
                          {testimonials[current].role}, {testimonials[current].company}
                        </p>
                        <div className="flex mt-1">
                          {renderStars(testimonials[current].rating)}
                        </div>
                      </div>
                    </div>
                    
                    <blockquote className="text-xl text-propagentic-slate-dark dark:text-propagentic-neutral-lightest italic">
                      "{testimonials[current].quote}"
                    </blockquote>
                  </div>
                </div>
              </SafeMotion.div>
            </AnimatePresence>
          </div>
          
          {/* Navigation buttons */}
          <button 
            onClick={goToPrevious}
            className="absolute left-2 md:-left-10 top-1/2 transform -translate-y-1/2 bg-propagentic-neutral-lightest dark:bg-propagentic-neutral-dark text-propagentic-slate dark:text-propagentic-neutral-light p-3 rounded-full shadow-md hover:bg-propagentic-teal hover:text-white dark:hover:text-propagentic-neutral-lightest transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-propagentic-teal focus:ring-opacity-50"
            aria-label="Previous testimonial"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          
          <button 
            onClick={goToNext}
            className="absolute right-2 md:-right-10 top-1/2 transform -translate-y-1/2 bg-propagentic-neutral-lightest dark:bg-propagentic-neutral-dark text-propagentic-slate dark:text-propagentic-neutral-light p-3 rounded-full shadow-md hover:bg-propagentic-teal hover:text-white dark:hover:text-propagentic-neutral-lightest transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-propagentic-teal focus:ring-opacity-50"
            aria-label="Next testimonial"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
          
          {/* Dots navigation */}
          <div className="flex justify-center space-x-2 mt-8">
            {testimonials.map((_, index) => (
              <button
                key={index}
                onClick={() => goToTestimonial(index)}
                className={`w-3 h-3 rounded-full focus:outline-none transition-colors duration-200 ${
                  index === current 
                  ? 'bg-propagentic-teal' 
                  : 'bg-propagentic-neutral dark:bg-propagentic-neutral-medium hover:bg-propagentic-teal-light'
                }`}
                aria-label={`Go to testimonial ${index + 1}`}
              />
            ))}
          </div>
        </div>
        
        {/* Company logos */}
        <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-8 items-center">
          <div className="flex justify-center">
            <img 
              src="https://via.placeholder.com/120x40?text=COMPANY" 
              alt="Company logo" 
              className="h-8 opacity-70 hover:opacity-100 transition-opacity duration-200"
            />
          </div>
          <div className="flex justify-center">
            <img 
              src="https://via.placeholder.com/120x40?text=COMPANY" 
              alt="Company logo" 
              className="h-8 opacity-70 hover:opacity-100 transition-opacity duration-200"
            />
          </div>
          <div className="flex justify-center">
            <img 
              src="https://via.placeholder.com/120x40?text=COMPANY" 
              alt="Company logo" 
              className="h-8 opacity-70 hover:opacity-100 transition-opacity duration-200"
            />
          </div>
          <div className="flex justify-center">
            <img 
              src="https://via.placeholder.com/120x40?text=COMPANY" 
              alt="Company logo" 
              className="h-8 opacity-70 hover:opacity-100 transition-opacity duration-200"
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export default EnhancedTestimonials; 