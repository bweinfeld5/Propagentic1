import React from 'react';
import { canvasLayoutSystem, getCanvasContainer, getCanvasLayout } from '../../../styles/canvasLayoutSystem';
import { canvasDesignSystem } from '../../../styles/canvasDesignSystem';

interface CanvasDashboardLayoutProps {
  children: React.ReactNode;
  sidebar?: React.ReactNode;
  activityStream?: React.ReactNode;
  topBar?: React.ReactNode;
  breadcrumbs?: React.ReactNode;
  className?: string;
}

const CanvasDashboardLayout: React.FC<CanvasDashboardLayoutProps> = ({
  children,
  sidebar,
  activityStream,
  topBar,
  breadcrumbs,
  className = ''
}) => {
  return (
    <div className={`min-h-screen bg-neutral-50 ${className}`}>
      {/* Canvas Top Navigation */}
      {topBar && (
        <header className={`
          ${canvasLayoutSystem.navigation.topNav.background}
          ${canvasLayoutSystem.navigation.topNav.height}
          ${canvasLayoutSystem.navigation.topNav.padding}
          ${canvasLayoutSystem.navigation.topNav.position}
        `}>
          {topBar}
        </header>
      )}

      {/* Canvas Breadcrumbs */}
      {breadcrumbs && (
        <nav className={`
          ${canvasLayoutSystem.navigation.breadcrumbs.background}
          ${canvasLayoutSystem.navigation.breadcrumbs.padding}
        `}>
          <div className={getCanvasContainer('page', false)}>
            <div className={canvasLayoutSystem.navigation.breadcrumbs.base}>
              {breadcrumbs}
            </div>
          </div>
        </nav>
      )}

      {/* Main Dashboard Container */}
      <main className={getCanvasContainer('page')}>
        <div className={`${getCanvasLayout('dashboard')} min-h-[calc(100vh-4rem)]`}>
          
          {/* Left Sidebar - Quick Actions (Canvas Navigation Style) */}
          {sidebar && (
            <aside className={`
              ${canvasLayoutSystem.widgets.quickActions.base}
              ${canvasLayoutSystem.widgets.quickActions.position}
              ${canvasLayoutSystem.widgets.quickActions.height}
              ${canvasLayoutSystem.widgets.quickActions.order}
              hidden lg:block
            `}>
              <div className={`
                bg-white 
                border border-neutral-200 
                rounded-lg 
                shadow-sm 
                h-full
                ${canvasLayoutSystem.containers.sidebar.padding}
              `}>
                {sidebar}
              </div>
            </aside>
          )}

          {/* Main Content Area */}
          <section className={`
            ${canvasLayoutSystem.widgets.mainContent.base}
            ${canvasLayoutSystem.widgets.mainContent.minHeight}
            ${canvasLayoutSystem.widgets.mainContent.order}
          `}>
            <div className={canvasLayoutSystem.containers.content.spacing}>
              {children}
            </div>
          </section>

          {/* Right Activity Stream (Canvas Style) */}
          {activityStream && (
            <aside className={`
              ${canvasLayoutSystem.widgets.activityStream.base}
              ${canvasLayoutSystem.widgets.activityStream.position}
              ${canvasLayoutSystem.widgets.activityStream.height}
              ${canvasLayoutSystem.widgets.activityStream.order}
              hidden lg:block
            `}>
              <div className={`
                bg-white 
                border border-neutral-200 
                rounded-lg 
                shadow-sm 
                h-full
                ${canvasLayoutSystem.containers.sidebar.padding}
              `}>
                {activityStream}
              </div>
            </aside>
          )}

          {/* Mobile Sidebar Overlay */}
          {sidebar && (
            <div className="lg:hidden fixed inset-0 z-50 bg-neutral-800 bg-opacity-50 hidden" id="mobile-sidebar-overlay">
              <div className="fixed inset-y-0 left-0 w-80 bg-white shadow-xl">
                <div className={canvasLayoutSystem.containers.sidebar.padding}>
                  {sidebar}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

// Canvas-style Mobile Navigation
export const CanvasMobileNav: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className = '' }) => {
  return (
    <nav className={`
      lg:hidden
      fixed bottom-0 left-0 right-0
      bg-white 
      border-t border-neutral-200
      shadow-lg
      z-40
      ${className}
    `}>
      <div className="grid grid-cols-4 h-16">
        {children}
      </div>
    </nav>
  );
};

// Canvas-style Mobile Nav Item
export const CanvasMobileNavItem: React.FC<{
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  badge?: number;
  onClick?: () => void;
}> = ({ icon, label, active = false, badge, onClick }) => {
  return (
    <button
      onClick={onClick}
      className={`
        flex flex-col items-center justify-center
        text-xs font-medium
        transition-colors duration-200
        relative
        ${active 
          ? 'text-primary-600 bg-primary-50' 
          : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50'
        }
      `}
    >
      <div className="relative mb-1">
        {icon}
        {badge && badge > 0 && (
          <span className="absolute -top-1 -right-1 bg-error-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
            {badge > 99 ? '99+' : badge}
          </span>
        )}
      </div>
      <span className="leading-tight">{label}</span>
    </button>
  );
};

export default CanvasDashboardLayout; 