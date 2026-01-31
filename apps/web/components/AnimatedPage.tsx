
import React from 'react';

const AnimatedPage: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    return (
        <div className="animate-fadeIn h-full w-full flex flex-col overflow-hidden">
            {children}
        </div>
    );
};

export default AnimatedPage;
