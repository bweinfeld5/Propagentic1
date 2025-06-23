import React from 'react';
import { Outlet } from 'react-router-dom';
import GlassyHeader from './GlassyHeader';
// import FooterSection from '../landing/FooterSection'; // Optional: Add footer if needed consistently

/**
 * PublicLayout - Layout component for public pages
 * Includes the universal GlassyHeader and renders child routes with Outlet
 */
const PublicLayout = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <GlassyHeader />
      <main className="flex-grow">
        {/* Outlet renders the matched child route component */}
        <Outlet />
      </main>
      {/* Optional Footer */}
      {/* <FooterSection /> */}
    </div>
  );
};

export default PublicLayout; 