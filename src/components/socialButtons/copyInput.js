import React, { useState, useRef, useCallback } from 'react';
import clsx from 'clsx';

import styles from './styles.module.css';

const CopyToClipboardInput = ({ copyText, displayText }) => {
  // 1. State for the "Copied!" tooltip visibility
  const [isCopied, setIsCopied] = useState(false);
  
  // 2. Reference to the input element
  const inputRef = useRef(null);
  
  // The text content is fixed, but we keep it here for clarity.
  // If you wanted the text to be mutable, you'd use useState.
  const value = copyText; 

  // Function to handle the copy action
  const handleCopy = useCallback(() => {
    // 🛑 SOLUTION: Check if we are running in the browser and the Clipboard API is available
    if (typeof window === 'undefined' || !navigator.clipboard) {
        console.warn('Clipboard API is not available.');
        return; // Exit the function if not in the browser
    }

    if (inputRef.current) {
      // 1. Copy the text to the clipboard
      // (Using the modern Clipboard API if available, otherwise fallback)
      navigator.clipboard.writeText(value)
        .then(() => {
          // 2. Show the "Copied!" tooltip
          setIsCopied(true);

          // 3. Hide the tooltip after a short delay (e.g., 2 seconds)
          const timer = setTimeout(() => {
            setIsCopied(false);
          }, 2000); 

          // Cleanup the timeout if the component unmounts
          return () => clearTimeout(timer);
        })
        .catch(err => {
          console.error('Could not copy text: ', err);
          // Optional: Add a visual indicator for error
        });
    }
  }, [value]); // Recalculate if 'value' changes

  return (
    // Outer container for positioning the tooltip and the input/button
    <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', }}>
      
      {/* Tooltip Element (Conditional Rendering) */}
      {isCopied && (
        <div
          style={{
            position: 'absolute',
            top: '-30px', /* Position above the input */
            left: '50%',
            transform: 'translateX(-50%)',
            background: '#333',
            color: 'white',
            padding: '4px 8px',
            borderRadius: '4px',
            zIndex: 10,
            whiteSpace: 'nowrap'
          }}
        >
          Copied!
        </div>
      )}

      {/* The Input Box */}
      <input
        ref={inputRef} // Attach the ref
        type="text"
        value={displayText}
        readOnly // Text is predefined, so it shouldn't be edited by the user
        // Basic inline styles for visualization
        style={{ padding: '10px', border: '1px solid #ccc', borderRadius: '4px 0 0 4px', width: '18rem', cursor: 'pointer', fontSize: '1rem' }}
        className={clsx('', styles.desktop)}
        onClick={handleCopy} // Copy when the input itself is clicked
      />

      {/* The Copy Button/Icon */}
      <button 
        onClick={handleCopy}
        // Basic inline styles for visualization
        style={{ 
          padding: '10px', 
          border: '1px solid #ccc', 
          borderLeft: 'none', 
          borderRadius: '0 4px 4px 0',
          cursor: 'pointer',
          backgroundColor: '#f1f1f1',
          fontSize: '1rem'
        }}
        aria-label="Copy to clipboard"
      >
        {/* Replace this with a proper icon component (e.g., from an icon library) */}
        <span>📋</span> 
      </button>
    </div>
  );
};

export default CopyToClipboardInput;