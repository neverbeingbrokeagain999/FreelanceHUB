import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Users, Shield, MessageSquare, ChevronRight, Star, Briefcase, Code, Palette, PenTool, Camera, BarChart, Globe } from '../components/icons';

function Home() {
  const [animatedStats, setAnimatedStats] = useState({
    freelancers: 0,
    projects: 0,
    satisfaction: 0,
    earnings: 0
  });

  useEffect(() => {
    // Animate stats when component mounts
    const animateStats = () => {
      const duration = 2000; // 2 seconds
      const steps = 50;
      const interval = duration / steps;
      
      let currentStep = 0;
      
      const timer = setInterval(() => {
        if (currentStep === steps) {
          clearInterval(timer);
          return;
        }
        
        setAnimatedStats(prev => ({
          freelancers: Math.min(Math.floor((1000000 * currentStep) / steps), 1000000),
          projects: Math.min(Math.floor((50000 * currentStep) / steps), 50000),
          satisfaction: Math.min(Math.floor((95 * currentStep) / steps), 95),
          earnings: Math.min(Math.floor((500 * currentStep) / steps), 500)
        }));
        
        currentStep++;
      }, interval);
    };

    // Start animation when in viewport
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          animateStats();
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(document.querySelector('.stats-section'));

    return () => observer.disconnect();
  }, []);

  const categories = [
    { icon: <Code className="w-8 h-8" />, name: 'Development & IT', count: '100K+ jobs' },
    { icon: <Palette className="w-8 h-8" />, name: 'Design & Creative', count: '50K+ jobs' },
    { icon: <PenTool className="w-8 h-8" />, name: 'Writing', count: '30K+ jobs' },
    { icon: <Camera className="w-8 h-8" />, name: 'Video & Audio', count: '20K+ jobs' },
    { icon: <BarChart className="w-8 h-8" />, name: 'Marketing', count: '40K+ jobs' },
    { icon: <Globe className="w-8 h-8" />, name: 'Translation', count: '15K+ jobs' }
  ];

  const testimonials = [
    {
      name: 'John Smith',
      role: 'CEO at TechStart',
      image: '/default-avatar.png',
      content: 'Found amazing developers for our startup. The talent pool here is exceptional.',
      rating: 5
    },
    {
      name: 'Sarah Johnson',
      role: 'Freelance Designer',
      image: '/default-avatar.png',
      content: 'This platform helped me build my freelance career from scratch. Great clients and support!',
      rating: 5
    },
    {
      name: 'Michael Brown',
      role: 'Project Manager',
      image: '/default-avatar.png',
      content: 'The quality of freelancers and the secure payment system make this platform stand out.',
      rating: 5
    }
  ];

  const latestJobs = [
    {
      title: 'Senior Full Stack Developer',
      budget: '$5000-$8000',
      skills: ['React', 'Node.js', 'MongoDB'],
      postedBy: 'TechCorp Inc.',
      timeAgo: '2 hours ago'
    },
    {
      title: 'UI/UX Designer',
      budget: '$3000-$4500',
      skills: ['Figma', 'Adobe XD', 'UI Design'],
      postedBy: 'DesignHub',
      timeAgo: '3 hours ago'
    },
    {
      title: 'Content Writer',
      budget: '$1000-$2000',
      skills: ['Copywriting', 'SEO', 'Research'],
      postedBy: 'ContentKing',
      timeAgo: '5 hours ago'
    }
  ];

  return (
    <div className="bg-gray-50">
      {/* Hero Section */}
      <div className="bg-primary text-white py-32 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-blue-800 opacity-90"></div>
        <div className="absolute inset-0 bg-grid-pattern opacity-10"></div>
        <div className="container mx-auto px-6 relative">
          <div className="max-w-3xl">
            <h1 className="text-6xl font-bold mb-6 font-serif leading-tight animate-fade-in">
              Connect with Top Freelancers for Your Next Big Project
            </h1>
            <p className="text-xl mb-8 text-blue-100 leading-relaxed animate-fade-in-delay">
              The most trusted marketplace for freelancers and businesses. Find the perfect match for your project needs.
            </p>
            <div className="flex space-x-4 animate-fade-in-delay-2">
              <Link to="/post-job" 
                className="px-8 py-4 bg-white text-primary rounded-lg font-semibold hover:bg-gray-100 transition-all duration-300 transform hover:scale-105 flex items-center shadow-lg">
                Post a Job
                <ChevronRight className="ml-2" />
              </Link>
              <Link to="/browse-jobs" 
                className="px-8 py-4 border-2 border-white rounded-lg font-semibold hover:bg-blue-700 transition-all duration-300 transform hover:scale-105">
                Find Work
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Latest Jobs Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-6">
          <div className="flex justify-between items-center mb-12">
            <h2 className="text-3xl font-bold font-serif">Latest Opportunities</h2>
            <Link to="/browse-jobs" className="text-primary hover:text-blue-700 font-semibold flex items-center">
              View All Jobs <ChevronRight className="ml-1" />
            </Link>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {latestJobs.map((job, index) => (
              <div key={index} className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-300 border border-gray-100 p-6">
                <h3 className="font-semibold text-xl mb-2">{job.title}</h3>
                <p className="text-primary font-bold mb-3">{job.budget}</p>
                <div className="flex flex-wrap gap-2 mb-4">
                  {job.skills.map((skill, idx) => (
                    <span key={idx} className="bg-blue-50 text-primary px-3 py-1 rounded-full text-sm">
                      {skill}
                    </span>
                  ))}
                </div>
                <div className="flex justify-between items-center text-sm text-gray-600">
                  <span>{job.postedBy}</span>
                  <span>{job.timeAgo}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-6">
          <h2 className="text-3xl font-bold text-center mb-16 font-serif">Popular Categories</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {categories.map((category, index) => (
              <Link key={index} to="/browse-jobs" className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 flex items-center space-x-4 border border-gray-100">
                <div className="p-3 bg-blue-50 rounded-lg text-primary">
                  {category.icon}
                </div>
                <div>
                  <h3 className="font-semibold text-lg">{category.name}</h3>
                  <p className="text-gray-600">{category.count}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-6">
          <h2 className="text-3xl font-bold text-center mb-16 font-serif">Why Choose Us</h2>
          <div className="grid md:grid-cols-3 gap-12">
            {[
              {
                title: "Expert Freelancers",
                description: "Access a global pool of verified professionals across multiple disciplines.",
                icon: <Users className="w-8 h-8 text-primary" />,
              },
              {
                title: "Secure Payments",
                description: "Protected transactions with escrow system and multiple payment options.",
                icon: <Shield className="w-8 h-8 text-primary" />,
              },
              {
                title: "Real-time Chat",
                description: "Seamless communication between clients and freelancers.",
                icon: <MessageSquare className="w-8 h-8 text-primary" />,
              }
            ].map((feature, index) => (
              <div key={index} className="bg-white p-8 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 border border-gray-100">
                <div className="mb-4 p-3 bg-blue-50 rounded-lg w-fit">{feature.icon}</div>
                <h3 className="text-xl font-semibold mt-4 mb-2 font-serif">{feature.title}</h3>
                <p className="text-gray-600 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-gray-50 stats-section">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-8">
            {[
              { number: animatedStats.freelancers.toLocaleString(), label: "Freelancers", prefix: "" },
              { number: animatedStats.projects.toLocaleString(), label: "Active Projects", prefix: "" },
              { number: animatedStats.satisfaction, label: "Client Satisfaction", prefix: "", suffix: "%" },
              { number: animatedStats.earnings, label: "Paid to Freelancers", prefix: "$", suffix: "M+" }
            ].map((stat, index) => (
              <div key={index} className="bg-white p-8 rounded-xl shadow-sm text-center border border-gray-100">
                <div className="text-4xl font-bold text-primary mb-2 font-serif">
                  {stat.prefix}{stat.number}{stat.suffix}
                </div>
                <div className="text-gray-600">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-6">
          <h2 className="text-3xl font-bold text-center mb-16 font-serif">What Our Users Say</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="bg-white p-8 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 border border-gray-100">
                <div className="flex items-center mb-6">
                  <img src={testimonial.image} alt={testimonial.name} className="w-12 h-12 rounded-full mr-4" />
                  <div>
                    <h4 className="font-semibold">{testimonial.name}</h4>
                    <p className="text-gray-600 text-sm">{testimonial.role}</p>
                  </div>
                </div>
                <p className="text-gray-600 mb-4 leading-relaxed">"{testimonial.content}"</p>
                <div className="flex text-yellow-400">
                  {Array(testimonial.rating).fill().map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-current" />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary text-white">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-4xl font-bold mb-8 font-serif">Ready to Get Started?</h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Join thousands of freelancers and businesses who trust our platform for their project needs.
          </p>
          <div className="flex justify-center space-x-4">
            <Link to="/signup" 
              className="px-8 py-4 bg-white text-primary rounded-lg font-semibold hover:bg-gray-100 transition-all duration-300 transform hover:scale-105 shadow-lg">
              Sign Up Now
            </Link>
            <Link to="/how-it-works" 
              className="px-8 py-4 border-2 border-white rounded-lg font-semibold hover:bg-blue-700 transition-all duration-300 transform hover:scale-105">
              Learn More
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

export default Home;
