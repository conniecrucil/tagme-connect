import React from 'react';

interface IconProps {
  name: string;
  className?: string;
}

// Helper function to get display name for icons
const getDisplayName = (name: string): string => {
  const displayNames: Record<string, string> = {
    // Primary actions
    email: 'Email',
    call: 'Call',
    Mobile: 'Mobile',
    website: 'Website',
    location: 'Location',
    calendar: 'Calendar',
    Home: 'Home',
    Office: 'Office',
    fax: 'Fax',
    signal: 'Signal',
    messenger: 'Messenger',
    whatsApp: 'WhatsApp',
    telegram: 'Telegram',
    weChat: 'WeChat',
    matrix: 'Matrix',
    
    // Secondary actions
    facebook: 'Facebook',
    instagram: 'Instagram',
    linkedin: 'LinkedIn',
    youtube: 'YouTube',
    x: 'X',
    bluesky: 'Bluesky',
    tiktok: 'TikTok',
    snapchat: 'Snapchat',
    twitch: 'Twitch',
    vimeo: 'Vimeo',
    spotify: 'Spotify',
    discord: 'Discord',
    reddit: 'Reddit',
    pinterest: 'Pinterest',
    github: 'GitHub',
    apple: 'Apple',
    behance: 'Behance',
    dribbble: 'Dribbble',
    artstation: 'ArtStation',
    bemer: 'Bemer',
    buymeacoffee: 'Buy Me a Coffee',
    cashapp: 'Cash App',
    coinbase: 'Coinbase',
    yelp: 'Yelp',
    npm: 'NPM'
  };
  
  return displayNames[name] || name;
};

// Text-based icon component that shows the action name instead of SVG
export const UnifiedIcon: React.FC<IconProps> = ({ name, className = "w-6 h-6" }) => {
  const displayName = getDisplayName(name);
  
  return (
    <span className={`text-xs font-medium ${className}`}>
      {displayName}
    </span>
  );
};

// Export as default for backward compatibility
export default UnifiedIcon;
