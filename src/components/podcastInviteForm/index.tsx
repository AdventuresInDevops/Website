import React, { useState, useCallback, useRef } from 'react';

// Custom API endpoint for signup
const API_ENDPOINT = 'https://api.adventuresindevops.com/signup';
const openEmailForPrivateInviteUrl = 'mailto:"Adventures%20In%20DevOps"<scheduling@adventuresindevops.com>?subject=Podcast%20Guest%20Appearance%20Request';
/**
 * Custom Docusaurus Button component.
 */
const DocusaurusButton = ({ 
  children, 
  onClick, 
  disabled, 
  type = 'button' 
}) => {
  // Use Infima button classes
  let classNames = 'button button--block button--primary';
  if (disabled) {
    classNames += ' button--disabled';
  }
  
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={classNames}
      style={{
        // Custom button style for visual appeal (shadow, rounded corners)
        borderRadius: '8px', 
        boxShadow: disabled ? 'none' : '0 4px 6px rgba(0, 0, 0, 0.1)',
        fontWeight: '600',
        transition: 'background-color 0.2s, box-shadow 0.2s',
      }}
    >
      {children}
    </button>
  );
};

/**
 * Signup form component for Docusaurus MDX pages.
 */
export default function EmailSignupForm() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('idle'); // idle, loading, success, error
  const [message, setMessage] = useState('');
  
  const emailInputRef = useRef(null); 

  // Simple email validation regex
  const isValidEmail = (input) => /\S+@\S+\.\S+/.test(input);

  // Use FormEvent for the form submission
  const handleSubmit = useCallback(async (event) => {
    event.preventDefault();

    if (!isValidEmail(email)) {
      setStatus('error');
      setMessage('Please enter a valid email address.');
      return;
    }

    setStatus('loading');
    setMessage('Sending nudge...');

    try {
      const response = await fetch(API_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: email }), 
      });

      if (response.ok) {
        setStatus('success');
        setMessage('Success! Nudging Warren & Will.');
        setEmail(''); 
      } else {
        // Attempt to read a specific error message from the backend
        let errorData = {};
        try {
            errorData = await response.json();
        } catch (e) {
            // If response body is not JSON, use default error message
        }

        const errorMessage = errorData.message || `API Error: ${response.statusText}`;
        setStatus('error');
        setMessage(errorMessage);
      }
    } catch (error) {
      console.error('Network or API call failed:', error);
      setStatus('error');
      window.location.assign(openEmailForPrivateInviteUrl);
    }
  }, [email]);

  // Use ChangeEvent for input value changes
  const handleEmailChange = useCallback((e) => {
    setEmail(e.target.value);
    if (status !== 'idle') {
      setStatus('idle');
      setMessage('');
    }
  }, [status]);
  
  const handleContainerClick = useCallback((e) => {
    // Check if the input element exists and if the click wasn't already directly on the input or button
    if (emailInputRef.current && e.target !== emailInputRef.current) {
        // Programmatically focus the input field
        setTimeout(() => {
            emailInputRef.current.focus();
        }, 0);
    }
  }, []);


  const buttonText = status === 'loading' ? 'Nudging...' : "Let's do it!";
  const isButtonDisabled = status === 'loading' || !isValidEmail(email);

  // Status-based message styling (using Infima color variables)
  const statusColors = {
    success: 'var(--ifm-color-success)',
    error: 'var(--ifm-color-danger)',
    idle: 'var(--ifm-color-secondary)',
    loading: 'var(--ifm-color-primary)',
  };

  return (
    <div 
      className="card"
      onClick={handleContainerClick}
      style={{
        maxWidth: '448px', // max-w-md equivalent
        margin: '0 auto', // mx-auto equivalent
        padding: '2rem', // p-6 equivalent
        borderRadius: '12px', // rounded-xl equivalent
        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)', // shadow-2xl equivalent
        border: '1px solid var(--ifm-color-emphasis-300)', // border-gray-200 equivalent
        cursor: 'pointer', // Indicate the entire area is clickable
      }}
    >
      <h3 
        style={{
          fontSize: '1.25rem', // text-xl equivalent
          fontWeight: 'bold',
          marginBottom: '1rem', // mb-4 equivalent
          color: 'var(--ifm-font-color-base)',
        }}
      >
        Contact Warren & Will!
      </h3>
      <p 
        style={{
          marginBottom: '1rem', // mb-4 equivalent
          color: 'var(--ifm-font-color-secondary)',
        }}
      >
        Enter your email and we'll follow up with you in the next week, and we certainly won't forget!
      </p>
      
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' /* space-y-4 */ }}>
        {/* Email Field */}
        <div style={{ position: 'relative' }}>
          <label htmlFor="email" className="sr-only" style={{ position: 'absolute', width: '1px', height: '1px', padding: '0', margin: '-1px', overflow: 'hidden', clip: 'rect(0, 0, 0, 0)', whiteSpace: 'nowrap', border: '0' }}>Email Address</label>
          <input
            id="email"
            type="email"
            placeholder="Your Email Address"
            ref={emailInputRef} 
            value={email}
            onChange={handleEmailChange}
            required
            style={{
              width: '100%',
              padding: '0.5rem 1rem', // px-4 py-2 equivalent
              border: '1px solid var(--ifm-color-emphasis-400)',
              borderRadius: '6px',
              backgroundColor: 'var(--ifm-background-color)',
              color: 'var(--ifm-font-color-base)',
            }}
            disabled={status === 'loading'}
          />
        </div>
        
        <DocusaurusButton 
          type="submit" 
          disabled={isButtonDisabled}>
          {buttonText}
        </DocusaurusButton>

        {message && (
          <p 
            style={{ 
              fontSize: '0.875rem', // text-sm equivalent
              marginTop: '0.5rem', // mt-2 equivalent
              fontWeight: '500', 
              color: statusColors[status],
            }}
          >
            {message}
          </p>
        )}
      </form>
    </div>
  );
}