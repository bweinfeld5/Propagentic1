import React from 'react';

const Testimonials = () => {
  const testimonials = [
    {
      quote: "We've cut our maintenance response time by 63% since implementing Propagentic. The AI classification system gets the right contractors on the job faster.",
      author: "Rachel Thompson",
      title: "Regional Property Manager",
      company: "Urban Living Properties",
      image: "https://randomuser.me/api/portraits/women/79.jpg"
    },
    {
      quote: "The contractor matching feature has been a game-changer. Our tenants are happier, and our maintenance costs have decreased by 27%.",
      author: "Michael Rivera",
      title: "Property Owner",
      company: "Rivera Investments",
      image: "https://randomuser.me/api/portraits/men/54.jpg"
    },
    {
      quote: "As a contractor, Propagentic has increased my business by connecting me with jobs that match my skills. The platform is intuitive and saves me hours of paperwork.",
      author: "Jessica Chen",
      title: "HVAC Specialist",
      company: "Chen Mechanical Services",
      image: "https://randomuser.me/api/portraits/women/45.jpg"
    }
  ];

  return (
    <div className="space-y-8 md:space-y-0 md:grid md:grid-cols-3 md:gap-8">
      {testimonials.map((testimonial, index) => (
        <div 
          key={index} 
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden transform transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
        >
          {/* Orange accent bar at top */}
          <div className="h-2 bg-gradient-to-r from-orange-400 to-orange-600"></div>
          
          <div className="p-8 relative">
            {/* Large quote icon */}
            <div className="absolute top-6 right-6 text-4xl opacity-10">
              <svg className="h-16 w-16 text-orange-400" fill="currentColor" viewBox="0 0 32 32" aria-hidden="true">
                <path d="M9.352 4C4.456 7.456 1 13.12 1 19.36c0 5.088 3.072 8.064 6.624 8.064 3.36 0 5.856-2.688 5.856-5.856 0-3.168-2.208-5.472-5.088-5.472-.576 0-1.344.096-1.536.192.48-3.264 3.552-7.104 6.624-9.024L9.352 4zm16.512 0c-4.8 3.456-8.256 9.12-8.256 15.36 0 5.088 3.072 8.064 6.624 8.064 3.264 0 5.856-2.688 5.856-5.856 0-3.168-2.304-5.472-5.184-5.472-.576 0-1.248.096-1.44.192.48-3.264 3.456-7.104 6.528-9.024L25.864 4z" />
              </svg>
            </div>
            
            {/* Quote text */}
            <blockquote className="text-lg font-light text-gray-700 dark:text-gray-300 mb-8 relative z-10">
              "{testimonial.quote}"
            </blockquote>
            
            <div className="flex items-center mt-6 pt-6 border-t border-gray-100 dark:border-gray-700">
              <img 
                src={testimonial.image} 
                alt={testimonial.author} 
                className="w-12 h-12 rounded-full object-cover mr-4 ring-2 ring-orange-100 dark:ring-orange-900"
              />
              <div>
                <div className="font-bold text-gray-900 dark:text-white">
                  {testimonial.author}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  {testimonial.title}, <span className="text-orange-600 dark:text-orange-400">{testimonial.company}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default Testimonials; 