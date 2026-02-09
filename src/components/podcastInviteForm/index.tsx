import React, { useState, useCallback, useRef } from 'react';

// ⬅️ ADDED: Mailto URL for fallback
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
    setMessage('Summoning the follow-up daemon...'); // Cheeky loading message

    try {
      // Check if PostHog object is globally available
      if (typeof posthog === 'undefined' || !posthog.capture) {
        throw Error('posthog global has not been loaded.');
      }
      
      // 1. Capture the PostHog event
      posthog.capture('PrivateInvitePodcastFollowupRequested', { 
          email_address: email,
          location: window.location.href // Add context
      });

      // 2. Flush the event immediately (ensures sending)
      if (posthog.flush) {
          // posthog.flush() returns a Promise which resolves when the queue is sent
          await posthog.flush(); 
      }

      setStatus('success');
      setMessage("Success! Consider it done. Warren & Will will reach out this week.");

      // 3. Simulate the 2-second network delay
      await new Promise(r => setTimeout(r, 2000));
      
      setEmail(''); 
      window.open('/docs/guests', '_self');
      return;
    } catch (error) {
      await new Promise(r => setTimeout(r, 2000));

      console.error('PostHog operation failed:', error);
      setStatus('error');
      setMessage('Uh oh, the carrier pigeon ran off! Opening your email client instead.'); 
      window.open(openEmailForPrivateInviteUrl, '_blank');
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