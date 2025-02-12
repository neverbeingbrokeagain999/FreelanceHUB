import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaPlus, FaSearch, FaFilter, FaSort } from 'react-icons/fa';
import useCodeSnippets from '../hooks/useCodeSnippets';
import LoadingSpinner from '../components/LoadingSpinner';

const CodeSnippets = () => {
  const navigate = useNavigate();
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [filterModalOpen, setFilterModalOpen] = useState(false);
  const {
    loading,
    error,
    filteredSnippets,
    filters,
    setFilters,
    sortBy,
    setSortBy,
    sortDirection,
    setSortDirection,
    searchQuery,
    setSearchQuery,
    createSnippet,
    refresh
  } = useCodeSnippets();

  const handleCreate = async (data) => {
    try {
      const snippet = await createSnippet(data);
      setCreateModalOpen(false);
      navigate(`/code-snippets/${snippet._id}`);
    } catch (error) {
      // Error is handled by the hook
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Code Snippets</h1>
        <button
          onClick={() => setCreateModalOpen(true)}
          className="btn btn-primary"
        >
          <FaPlus className="mr-2" />
          New Snippet
        </button>
      </div>

      {/* Search and Filters */}
      <div className="flex items-center space-x-4 mb-6">
        <div className="flex-1 relative">
          <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search snippets..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="pl-10 pr-4 py-2 w-full border rounded-lg"
          />
        </div>

        <button
          onClick={() => setFilterModalOpen(true)}
          className="btn btn-secondary"
        >
          <FaFilter className="mr-2" />
          Filter
        </button>

        <select
          value={sortBy}
          onChange={e => setSortBy(e.target.value)}
          className="select"
        >
          <option value="updatedAt">Last Updated</option>
          <option value="title">Title</option>
          <option value="language">Language</option>
        </select>

        <button
          onClick={() => setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc')}
          className="btn btn-icon"
        >
          <FaSort className={sortDirection === 'desc' ? 'transform rotate-180' : ''} />
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      {/* Snippets Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredSnippets.map(snippet => (
          <Link
            key={snippet._id}
            to={`/code-snippets/${snippet._id}`}
            className="block bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
          >
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">
                    {snippet.title}
                  </h3>
                  <p className="text-sm text-gray-500">
                    Created by {snippet.creator.name}
                  </p>
                </div>
                <span className={`badge ${snippet.visibility === 'private' ? 'badge-secondary' : 'badge-primary'}`}>
                  {snippet.visibility}
                </span>
              </div>

              <div className="mb-4">
                <pre className="text-sm bg-gray-50 p-3 rounded-lg line-clamp-3">
                  {snippet.content}
                </pre>
              </div>

              <div className="flex items-center justify-between text-sm text-gray-500">
                <span className="badge badge-outline">{snippet.language}</span>
                <span>
                  Last updated {new Date(snippet.updatedAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Empty State */}
      {filteredSnippets.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 mb-4">No snippets found</p>
          <button
            onClick={() => setCreateModalOpen(true)}
            className="btn btn-primary"
          >
            Create your first snippet
          </button>
        </div>
      )}

      {/* Create Modal */}
      {createModalOpen && (
        <CreateSnippetModal
          onClose={() => setCreateModalOpen(false)}
          onCreate={handleCreate}
        />
      )}

      {/* Filter Modal */}
      {filterModalOpen && (
        <FilterModal
          filters={filters}
          onApply={newFilters => {
            setFilters(newFilters);
            setFilterModalOpen(false);
          }}
          onClose={() => setFilterModalOpen(false)}
        />
      )}
    </div>
  );
};

const CreateSnippetModal = ({ onClose, onCreate }) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [language, setLanguage] = useState('javascript');
  const [visibility, setVisibility] = useState('private');

  const handleSubmit = (e) => {
    e.preventDefault();
    onCreate({
      title,
      content,
      language,
      visibility
    });
  };

  return (
    <div className="modal">
      <div className="modal-content">
        <h2 className="text-xl font-semibold mb-4">Create New Snippet</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="title" className="block text-sm font-medium mb-1">
              Title
            </label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="input w-full"
              required
            />
          </div>

          <div>
            <label htmlFor="content" className="block text-sm font-medium mb-1">
              Code
            </label>
            <textarea
              id="content"
              value={content}
              onChange={e => setContent(e.target.value)}
              className="textarea h-40"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="language" className="block text-sm font-medium mb-1">
                Language
              </label>
              <select
                id="language"
                value={language}
                onChange={e => setLanguage(e.target.value)}
                className="select w-full"
              >
                <option value="javascript">JavaScript</option>
                <option value="python">Python</option>
                <option value="java">Java</option>
                <option value="cpp">C++</option>
                {/* Add more language options */}
              </select>
            </div>

            <div>
              <label htmlFor="visibility" className="block text-sm font-medium mb-1">
                Visibility
              </label>
              <select
                id="visibility"
                value={visibility}
                onChange={e => setVisibility(e.target.value)}
                className="select w-full"
              >
                <option value="private">Private</option>
                <option value="public">Public</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={!title || !content}
            >
              Create
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const FilterModal = ({ filters, onApply, onClose }) => {
  const [localFilters, setLocalFilters] = useState(filters);

  const handleApply = () => {
    onApply(localFilters);
  };

  return (
    <div className="modal">
      <div className="modal-content">
        <h2 className="text-xl font-semibold mb-4">Filter Snippets</h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              Visibility
            </label>
            <select
              value={localFilters.visibility}
              onChange={e => setLocalFilters(prev => ({
                ...prev,
                visibility: e.target.value
              }))}
              className="select w-full"
            >
              <option value="all">All</option>
              <option value="public">Public</option>
              <option value="private">Private</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Language
            </label>
            <select
              value={localFilters.language}
              onChange={e => setLocalFilters(prev => ({
                ...prev,
                language: e.target.value
              }))}
              className="select w-full"
            >
              <option value="all">All</option>
              <option value="javascript">JavaScript</option>
              <option value="python">Python</option>
              <option value="java">Java</option>
              <option value="cpp">C++</option>
              {/* Add more language options */}
            </select>
          </div>

          <div className="flex justify-end space-x-2">
            <button
              onClick={onClose}
              className="btn btn-secondary"
            >
              Cancel
            </button>
            <button
              onClick={handleApply}
              className="btn btn-primary"
            >
              Apply Filters
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CodeSnippets;
