
import React from 'react';

interface EmptyStateProps {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  message: string;
  action?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ icon: Icon, title, message, action }) => {
  return (
    <div className="flex flex-col items-center justify-center text-center py-10 px-4 bg-background-secondary rounded-lg">
      <div className="bg-background-tertiary p-4 rounded-full mb-4">
        <Icon className="w-12 h-12 text-text-secondary" />
      </div>
      <h3 className="text-lg font-bold text-text-primary">{title}</h3>
      <p className="text-sm text-text-secondary mt-2 max-w-xs">{message}</p>
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
};
