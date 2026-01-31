
import React from 'react';

interface FlagProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  code: string;
}

export const Flag: React.FC<FlagProps> = ({ code, className, ...props }) => {
  const flagUrl = `https://cdn.jsdelivr.net/gh/lipis/flag-icons/flags/4x3/${code.toLowerCase()}.svg`;
  
  return (
    <img
      src={flagUrl}
      alt={`${code} flag`}
      loading="lazy"
      className={className}
      {...props}
    />
  );
};
