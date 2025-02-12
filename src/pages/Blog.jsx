import React from 'react';

const posts = [
  {
    title: 'The Future of Remote Work',
    description: 'Insights into how remote work is reshaping the global workforce and what it means for businesses and freelancers.',
    date: 'Feb 1, 2025',
    readTime: '5 min read',
    category: 'Trends',
    imageUrl: '/blog/remote-work.jpg'
  },
  {
    title: 'Building a Successful Freelance Career',
    description: 'Expert tips and strategies for establishing yourself as a successful freelancer in today\'s competitive market.',
    date: 'Jan 28, 2025',
    readTime: '7 min read',
    category: 'Career Growth',
    imageUrl: '/blog/freelance-career.jpg'
  },
  {
    title: 'Effective Project Management Tips',
    description: 'Learn the best practices for managing remote teams and delivering successful projects on time.',
    date: 'Jan 25, 2025',
    readTime: '6 min read',
    category: 'Management',
    imageUrl: '/blog/project-management.jpg'
  }
];

const Blog = () => {
  return (
    <div className="bg-white py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900">FreelancePro Blog</h1>
          <p className="mt-4 text-xl text-gray-500">
            Insights, tips, and news from the world of freelancing
          </p>
        </div>

        <div className="mt-12">
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {posts.map((post, index) => (
              <div key={index} className="flex flex-col overflow-hidden rounded-lg shadow-lg">
                <div className="flex-shrink-0">
                  <div className="h-48 w-full bg-gray-200" />
                </div>
                <div className="flex flex-1 flex-col justify-between bg-white p-6">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-blue-600">
                      {post.category}
                    </p>
                    <div className="mt-2">
                      <p className="text-xl font-semibold text-gray-900">
                        {post.title}
                      </p>
                      <p className="mt-3 text-base text-gray-500">
                        {post.description}
                      </p>
                    </div>
                  </div>
                  <div className="mt-6 flex items-center">
                    <div className="flex-shrink-0">
                      <span className="sr-only">Date</span>
                    </div>
                    <div className="ml-3">
                      <div className="flex space-x-1 text-sm text-gray-500">
                        <time dateTime={post.date}>{post.date}</time>
                        <span aria-hidden="true">&middot;</span>
                        <span>{post.readTime}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-12 text-center">
          <button className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700">
            Load More Posts
          </button>
        </div>
      </div>
    </div>
  );
};

export default Blog;
