// COPY AND PASTE THIS ENTIRE BLOCK INTO: frontend/src/components/Footer.jsx

import React from 'react';

const Footer = () => {
  return (
    <footer className="w-full mt-auto py-4">
      <div className="flex items-center justify-center text-sm text-slate-500">
        <span>Developed by</span>
        <a 
          href="https://www.raajconsultancy.com/" 
          target="_blank" 
          rel="noopener noreferrer"
          className="ml-2 flex items-center font-semibold text-slate-700 hover:text-blue-600 transition-colors"
        >
          <img 
            src="/assets/images/rcs-logo.png" 
            alt="RAAJ Consultancy Services Logo"
            className="h-6 w-auto mr-2" // Logo is placed before the text
          />
          RAAJ Consultancy Services
        </a>
      </div>
    </footer>
  );
};

export default Footer;