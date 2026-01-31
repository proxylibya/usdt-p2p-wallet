import { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2 } from 'lucide-react';

interface FormPageLayoutProps {
  title: string;
  subtitle?: string;
  backPath: string;
  isLoading?: boolean;
  isSubmitting?: boolean;
  onSubmit: () => void;
  submitLabel?: string;
  children: ReactNode;
  icon?: ReactNode;
}

const FormPageLayout: React.FC<FormPageLayoutProps> = ({
  title,
  subtitle,
  backPath,
  isLoading,
  isSubmitting,
  onSubmit,
  submitLabel = 'Save',
  children,
  icon,
}) => {
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-brand-yellow" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => navigate(backPath)}
          className="flex items-center gap-2 text-text-secondary hover:text-text-primary mb-4 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
        <div className="flex items-center gap-4">
          {icon && (
            <div className="p-3 bg-brand-yellow/20 rounded-xl">
              {icon}
            </div>
          )}
          <div>
            <h1 className="text-2xl font-bold text-text-primary">{title}</h1>
            {subtitle && <p className="text-text-secondary mt-1">{subtitle}</p>}
          </div>
        </div>
      </div>

      {/* Form Content */}
      <div className="bg-background-secondary rounded-xl border border-border-divider p-6">
        <div className="space-y-6">
          {children}
        </div>

        {/* Actions */}
        <div className="flex gap-4 mt-8 pt-6 border-t border-border-divider">
          <button
            onClick={() => navigate(backPath)}
            className="flex-1 btn-secondary"
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            onClick={onSubmit}
            disabled={isSubmitting}
            className="flex-1 btn-primary flex items-center justify-center gap-2"
          >
            {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
            {submitLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

export default FormPageLayout;
