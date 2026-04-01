import React, { useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSpinner, faCopy, faCheck } from '@fortawesome/free-solid-svg-icons';
import { SchedulingContactButton } from '@site/src/components/contactButton';

const SALT = 'adv-devops-sched-2026';
const EXPIRY_DAYS = 30;
const SCHEDULE_URL = 'https://oncehub.com/adventures-in-devops';

// Simple sync hash: djb2 variant with salt mixing
function hashCode(input: string): number {
  let hash = 5381;
  const salted = `${SALT}:${input}`;
  for (let i = 0; i < salted.length; i++) {
    hash = ((hash << 5) + hash + salted.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

function daysSinceEpoch(): number {
  return Math.floor(Date.now() / (1000 * 60 * 60 * 24));
}

function generateId(): string {
  const days = daysSinceEpoch();
  const timestamp = days.toString(36);
  const random = Math.random().toString(36).substring(2, 5);
  const checksum = hashCode(`${timestamp}-${random}`).toString(36).substring(0, 4);
  return `${timestamp}-${random}-${checksum}`;
}

function validateId(id: string): { valid: boolean; expired?: boolean } {
  const parts = id.split('-');
  if (parts.length !== 3) {
    return { valid: false };
  }

  const [timestamp, random, checksum] = parts;

  const expected = hashCode(`${timestamp}-${random}`).toString(36).substring(0, 4);
  if (checksum !== expected) {
    return { valid: false };
  }

  const days = parseInt(timestamp, 36);
  const now = daysSinceEpoch();
  if (isNaN(days) || days > now || now - days > EXPIRY_DAYS) {
    return { valid: false, expired: true };
  }

  return { valid: true };
}

export default function ScheduleRedirect() {
  const [mode, setMode] = useState<'loading' | 'generate' | 'invalid' | 'expired'>('loading');
  const [generatedUrl, setGeneratedUrl] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);

    if (params.has('generate')) {
      const id = generateId();
      const base = `${window.location.origin}/schedule?id=${id}`;
      setGeneratedUrl(base);
      setMode('generate');
      return;
    }

    const id = params.get('id');
    if (id) {
      const result = validateId(id);
      if (result.valid) {
        window.location.replace(SCHEDULE_URL);
        return;
      }
      setMode(result.expired ? 'expired' : 'invalid');
      return;
    }

    setMode('invalid');
  }, []);

  function copyUrl() {
    navigator.clipboard.writeText(generatedUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (mode === 'generate') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '300px', gap: '20px' }}>
        <h2>Schedule Link Generated</h2>
        <p style={{ color: 'var(--ifm-color-secondary-darkest)', fontSize: '14px' }}>
          This link expires in {EXPIRY_DAYS} days.
        </p>
        <div style={{
          display: 'flex', alignItems: 'center', gap: '10px',
          background: 'var(--ifm-background-surface-color)', padding: '12px 16px',
          borderRadius: '8px', border: '1px solid var(--ifm-color-emphasis-300)',
          maxWidth: '100%', overflow: 'hidden'
        }}>
          <code style={{ fontSize: '14px', wordBreak: 'break-all' }}>{generatedUrl}</code>
          <button
            onClick={copyUrl}
            type="button"
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'var(--ifm-link-color)', fontSize: '18px', flexShrink: 0
            }}
            title="Copy to clipboard"
          >
            <FontAwesomeIcon icon={copied ? faCheck : faCopy} />
          </button>
        </div>
      </div>
    );
  }

  if (mode === 'invalid' || mode === 'expired') {
    const message = mode === 'expired'
      ? 'This scheduling link has expired.'
      : 'This scheduling link is not valid.';

    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '300px', gap: '20px', textAlign: 'center' }}>
        <h2>{message}</h2>
        <p>
          If you&apos;d like to schedule an appearance on the podcast, please reach out to us directly.
        </p>
        <SchedulingContactButton />
      </div>
    );
  }

  // Loading/redirecting state
  return (
    <div style={{ display: 'flex', justifyContent: 'center', height: '100%', alignItems: 'center', minHeight: '300px' }}>
      <FontAwesomeIcon icon={faSpinner} size="5x" spin />
    </div>
  );
}
