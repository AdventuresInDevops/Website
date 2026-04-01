import React, { useEffect, useState } from 'react';
import StylizedButton from '@site/src/components/stylizedButton';

function randomHash(): string {
  return Math.random().toString(36).substring(2, 8);
}

function ContactButton({ encodedEmail, displayName, subject, children }: {
  encodedEmail: string;
  displayName: string;
  subject: string;
  children: React.ReactNode;
}) {
  const [href, setHref] = useState('');

  useEffect(() => {
    const email = atob(encodedEmail);
    const [local, domain] = email.split('@');
    const taggedEmail = `${local}+${randomHash()}@${domain}`;
    const encodedDisplayName = encodeURIComponent(`"${displayName}"`);
    const encodedSubject = encodeURIComponent(subject);
    setHref(`mailto:${encodedDisplayName}<${taggedEmail}>?subject=${encodedSubject}`);
  }, [encodedEmail, displayName, subject]);

  if (!href) {
    return null;
  }

  return (
    <StylizedButton href={href}>
      {children}
    </StylizedButton>
  );
}

export function SchedulingContactButton() {
  return (
    <ContactButton
      encodedEmail="c2NoZWR1bGluZ0BhZHZlbnR1cmVzaW5kZXZvcHMuY29t"
      displayName="Adventures In DevOps Scheduling"
      subject="Podcast Guest Request"
    >
      ✉ Contact us
    </ContactButton>
  );
}

export function SponsorshipContactButton({ children }: { children?: React.ReactNode }) {
  return (
    <ContactButton
      encodedEmail="c3BvbnNvcnNoaXBzQGFkdmVudHVyZXNpbmRldm9wcy5jb20="
      displayName="Adventures In DevOps Sponsorships"
      subject="Podcast Sponsorship Inquiry"
    >
      {children || '✉ Contact us'}
    </ContactButton>
  );
}
