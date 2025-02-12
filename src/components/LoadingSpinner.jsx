import { memo } from 'react';
import PropTypes from 'prop-types';

/**
 * Loading spinner component with customizable size and variant
 * @param {Object} props - Component props
 * @param {string} [props.size='md'] - Size of spinner (sm, md, lg)
 * @param {string} [props.variant='primary'] - Visual variant (primary, white)
 * @param {string} [props.className] - Additional CSS classes
 * @returns {JSX.Element} Loading spinner component
 */
const LoadingSpinner = ({ size = 'md', variant = 'primary', className = '' }) => {
  const sizeClasses = {
    sm: 'h-4 w-4 border-2',
    md: 'h-8 w-8 border-3',
    lg: 'h-12 w-12 border-4'
  };

  const variantClasses = {
    primary: 'border-blue-600',
    white: 'border-white'
  };

  const baseClasses = 'inline-block animate-spin rounded-full border-solid border-t-transparent';
  const sizeClass = sizeClasses[size] || sizeClasses.md;
  const variantClass = variantClasses[variant] || variantClasses.primary;

  return (
    <div 
      role="status" 
      aria-label="Loading"
      className={`${baseClasses} ${sizeClass} ${variantClass} ${className}`}
    >
      <span className="sr-only">Loading...</span>
    </div>
  );
};

LoadingSpinner.propTypes = {
  size: PropTypes.oneOf(['sm', 'md', 'lg']),
  variant: PropTypes.oneOf(['primary', 'white']),
  className: PropTypes.string
};

export { LoadingSpinner };
export default memo(LoadingSpinner);
