import React from 'react';
import { Quote } from 'lucide-react';

interface QuoteBannerProps {
  quote: string;
  author?: string;
  context?: string;
}

export const QuoteBanner: React.FC<QuoteBannerProps> = ({ 
  quote, 
  author,
  context
}) => {
  return (
    <div className="my-6 rounded-xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm">
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700">
          <Quote className="w-4 h-4" />
        </div>
        <div className="space-y-1">
          <p className="text-sm sm:text-base font-medium text-slate-900 italic leading-relaxed">
            &ldquo;{quote}&rdquo;
          </p>
          {(author || context) && (
            <div className="flex items-center gap-2 text-xs text-slate-500 font-mono pt-0.5">
              {author && <span>— {author}</span>}
              {author && context && <span>•</span>}
              {context && <span>{context}</span>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
