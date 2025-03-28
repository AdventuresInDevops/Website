import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faSpinner } from '@fortawesome/free-solid-svg-icons';

export default function Spinner(props) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', height: '100%', alignItems: 'center', minHeight: '300px' }}>
        <FontAwesomeIcon icon={faSpinner} size="5x" spin />
      </div>
    );
}