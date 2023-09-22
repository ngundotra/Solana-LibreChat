import React from 'react';
// import { useGetStartupConfig } from '@librechat/data-provider';

export default function Footer() {
  // const { data: config } = useGetStartupConfig();
  return (
    <div className="hidden px-3 pb-1 pt-2 text-center text-xs text-black/50 dark:text-white/50 md:block md:px-4 md:pb-4 md:pt-3">
      <a
        href="https://chatgpt.solanalabs.com"
        target="_blank"
        rel="noreferrer"
        className="underline"
      >
        {'See more information'}
      </a>
      {'. By using this website you agree to the following '}
      {/* . Serves and searches all conversations reliably. All AI convos under one house. Pay per call
      and not per month (cents compared to dollars). */}
      <a
        href="https://solanatechservices.com/tos.pdf"
        target="_blank"
        rel="noreferrer"
        className="underline"
      >
        {'Terms of Service'}
      </a>
      {' and '}
      <a
        href="https://solanatechservices.com/privacy.pdf"
        target="_blank"
        rel="noreferrer"
        className="underline"
      >
        {'Privacy Policy.'}
      </a>
    </div>
  );
}
