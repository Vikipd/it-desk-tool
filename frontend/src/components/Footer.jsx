import React from "react";
const Footer = () => {
  return (
    <footer className="w-full mt-auto py-4">
      <div className="flex items-center justify-center text-sm text-slate-500">
        {/* The entire block is now a single link */}
        <a
          href="https://www.raajconsultancy.com/"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center font-semibold text-slate-700 hover:text-blue-600 transition-colors"
        >
          <span>Developed by</span>
          <img
            src="/assets/images/rcs-logo.png"
            alt="RCS Logo"
            className="h-5 w-auto mx-2" // Slightly adjusted margin for better spacing
          />
          <span>RCS © 2025</span>
        </a>
      </div>
    </footer>
  );
};
export default Footer;
