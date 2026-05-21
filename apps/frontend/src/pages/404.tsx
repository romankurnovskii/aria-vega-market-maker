/**
 * @file 404.tsx
 * @description Next.js Pages Router 404 page — fallback when no route matches.
 *              Provides a centered "Page Not Found" message with a home link.
 *
 * @features
 * - Renders a 404 title and "Page Not Found" subtitle
 * - Links back to the home page
 */

import React from 'react';

export default function Custom404() {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        backgroundColor: '#F4F4F0',
        color: '#0D0D0D',
        fontFamily: 'monospace',
        padding: '20px',
        textAlign: 'center',
      }}
    >
      <h1 style={{ fontFamily: 'sans-serif', textTransform: 'uppercase', marginBottom: '10px' }}>404</h1>
      <p style={{ textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '20px' }}>Page Not Found</p>
      <a
        href="/"
        style={{
          backgroundColor: '#0D0D0D',
          color: '#F4F4F0',
          padding: '8px 24px',
          fontSize: '14px',
          fontWeight: 'bold',
          textTransform: 'uppercase',
          textDecoration: 'none',
          transition: 'background-color 0.2s',
        }}
      >
        Return Home
      </a>
    </div>
  );
}
