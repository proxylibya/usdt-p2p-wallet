
import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeftIcon } from './icons/ArrowLeftIcon';
import { PullToRefresh } from './PullToRefresh';
import { useLanguage } from '../context/LanguageContext';

interface PageLayoutProps {
  title: string;
  children: React.ReactNode;
  action?: React.ReactNode;
  noPadding?: boolean;
  onRefresh?: () => Promise<void>;
  scrollable?: boolean;
}

const PageLayout: React.FC<PageLayoutProps> = ({ title, children, action, noPadding = false, onRefresh, scrollable = true }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { direction } = useLanguage();

  const handleBack = () => {
      if (location.key !== "default") {
          navigate(-1);
      } else {
          navigate('/', { replace: true });
      }
  };

  /**
   * World-Class Layout Fix:
   * Instead of relying on padding which can be inconsistent, we inject a physical 
   * Spacer element at the end of the scroll flow.
   * 
   * Height Calculation: 
   * BottomNav (~60px) + Safe Area (~34px) + Breathing Room (~34px)
   * = h-32 (128px)
   * This ensures content is ALWAYS scrollable above the fixed navbar.
   */
  const BottomSpacer = () => (
      <div className="w-full flex-none h-32 pb-safe pointer-events-none opacity-0" aria-hidden="true" />
  );

  return (
    <div className="flex flex-col h-full w-full bg-background-primary overflow-hidden">
      {/* Fixed Header with Safe Area support */}
      <header className="flex-none z-30 bg-background-primary/95 backdrop-blur-md border-b border-border-divider/30 pt-safe transition-all duration-200">
        <div className="relative flex items-center justify-center px-4 h-[60px] w-full">
            <button
              onClick={handleBack}
              className="absolute start-4 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary p-2 rounded-full hover:bg-background-tertiary transition-colors active:scale-90 z-10"
              aria-label="Go back"
            >
              <ArrowLeftIcon className="w-6 h-6 transition-transform rtl:rotate-180" />
            </button>
            
            <h1 className="text-lg font-bold text-center text-text-primary truncate max-w-[60%]">
                {title}
            </h1>
            
            {action && (
                <div className="absolute end-4 top-1/2 -translate-y-1/2 flex items-center z-10">
                    {action}
                </div>
            )}
        </div>
      </header>
      
      {/* Main Content Area */}
      <main className="flex-1 w-full relative overflow-hidden flex flex-col">
          {onRefresh && scrollable ? (
              <PullToRefresh 
                onRefresh={onRefresh} 
                className="h-full w-full"
              >
                  {/* 
                      We use a flex-col container.
                      The 'content' wrapper takes flex-1 to push spacer down.
                      The Spacer is separate to ensure padding doesn't affect its layout.
                  */}
                  <div className="flex flex-col min-h-full">
                      <div className={`flex-1 ${noPadding ? '' : 'px-4 pt-4'}`}>
                        {children}
                      </div>
                      <BottomSpacer />
                  </div>
              </PullToRefresh>
          ) : scrollable ? (
              <div className="h-full w-full overflow-y-auto no-scrollbar flex flex-col">
                  <div className="flex flex-col min-h-full">
                      <div className={`flex-1 ${noPadding ? '' : 'px-4 pt-4'}`}>
                          {children}
                      </div>
                      <BottomSpacer />
                  </div>
              </div>
          ) : (
              <div className="h-full w-full relative">
                  {children}
              </div>
          )}
      </main>
    </div>
  );
};

export default PageLayout;
