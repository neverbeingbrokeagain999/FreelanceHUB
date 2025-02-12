import React from 'react';

const About = () => {
  return (
    <div className="bg-white py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 sm:text-5xl sm:tracking-tight lg:text-6xl">
            About FreelancePro
          </h1>
          <p className="mt-5 text-xl text-gray-500">
            Connecting top talent with innovative companies worldwide
          </p>
        </div>
        
        <div className="mt-16">
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-3">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Our Mission</h2>
              <p className="mt-4 text-lg text-gray-500">
                To create opportunities for anyone in the world to build their career on their own terms.
              </p>
            </div>
            
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Our Vision</h2>
              <p className="mt-4 text-lg text-gray-500">
                A world where talented professionals can work flexibly and companies can access the best global talent.
              </p>
            </div>
            
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Our Values</h2>
              <p className="mt-4 text-lg text-gray-500">
                Trust, transparency, and commitment to excellence in everything we do.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default About;
