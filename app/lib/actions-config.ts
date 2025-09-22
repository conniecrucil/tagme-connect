// Shared action configurations for both admin and normal builders
export interface ActionConfig {
  name: string;
  label: string;
  color: string;
  placeholder: string;
}

// Primary Actions (Communication & Basic Info) - Limited set as per design
export const primaryActionsConfig: ActionConfig[] = [
  { name: 'Home', label: 'Home', color: '#6B7280', placeholder: '+1 (555) 123-4567' },
  { name: 'Mobile', label: 'Mobile', color: '#6B7280', placeholder: '+1 (555) 987-6543' },
  { name: 'Office', label: 'Office', color: '#6B7280', placeholder: '+1 (555) 456-7890' },
  { name: 'fax', label: 'Fax', color: '#6B7280', placeholder: '+1 (555) 234-5679' },
  { name: 'email', label: 'Email', color: '#6B7280', placeholder: 'john@example.com' },
  { name: 'location', label: 'Location', color: '#6B7280', placeholder: '123 Main St, Vancouver, BC' },
  { name: 'calendar', label: 'Calendar', color: '#6B7280', placeholder: 'https://calendly.com/johndoe' },
  { name: 'call', label: 'Call', color: '#6B7280', placeholder: '+1 (555) 234-5678' },
  { name: 'whatsApp', label: 'WhatsApp', color: '#25D366', placeholder: '+1234567890' },
  { name: 'messenger', label: 'Messenger', color: '#0084FF', placeholder: 'john.doe.messenger' },
  { name: 'telegram', label: 'Telegram', color: '#0088cc', placeholder: '@johndoe' },
  { name: 'website', label: 'Website', color: '#6B7280', placeholder: 'https://johndoe.com' },
  { name: 'matrix', label: 'Matrix', color: '#000000', placeholder: '@johndoe:matrix.org' },
  { name: 'signal', label: 'Signal', color: '#3A76F0', placeholder: '+1 (555) 987-6543' },
  { name: 'weChat', label: 'WeChat', color: '#07C160', placeholder: 'john_doe_2024' },
];

// Secondary Actions (Social Media & Platforms)
export const secondaryActionsConfig: ActionConfig[] = [
  { name: 'facebook', label: 'Facebook', color: '#1877f2', placeholder: 'https://facebook.com/johndoe' },
  { name: 'instagram', label: 'Instagram', color: '#405de6', placeholder: 'https://instagram.com/johndoe' },
  { name: 'x', label: 'X', color: '#000000', placeholder: 'https://x.com/johndoe' },
  { name: 'bluesky', label: 'Bluesky', color: '#0085FF', placeholder: 'https://bsky.app/profile/johndoe.bsky.social' },
  { name: 'linkedin', label: 'LinkedIn', color: '#0077b5', placeholder: 'https://linkedin.com/in/johndoe' },
  { name: 'youtube', label: 'YouTube', color: '#ff0000', placeholder: 'https://youtube.com/@johndoe' },
  { name: 'tiktok', label: 'TikTok', color: '#000000', placeholder: 'https://tiktok.com/@johndoe' },
  { name: 'snapchat', label: 'Snapchat', color: '#FFCC00', placeholder: 'johndoe_snap' },
  { name: 'twitch', label: 'Twitch', color: '#9146ff', placeholder: 'https://twitch.tv/johndoe' },
  { name: 'vimeo', label: 'Vimeo', color: '#1ab7ea', placeholder: 'https://vimeo.com/johndoe' },
  { name: 'spotify', label: 'Spotify', color: '#1ed760', placeholder: 'https://open.spotify.com/user/johndoe' },
  { name: 'discord', label: 'Discord', color: '#7289da', placeholder: 'johndoe#1234' },
  { name: 'reddit', label: 'Reddit', color: '#ff5700', placeholder: 'https://reddit.com/u/johndoe' },
  { name: 'pinterest', label: 'Pinterest', color: '#bd081c', placeholder: 'https://pinterest.com/johndoe' },
  { name: 'github', label: 'GitHub', color: '#333333', placeholder: 'https://github.com/johndoe' },
  { name: 'apple', label: 'Apple App Store', color: '#007AFF', placeholder: 'https://apps.apple.com/app/johndoe' },
  { name: 'artstation', label: 'ArtStation', color: '#000000', placeholder: 'https://artstation.com/johndoe' },
  { name: 'bemer', label: 'Bemer', color: '#FFD700', placeholder: 'johndoe_bemer' },
  { name: 'behance', label: 'Behance', color: '#1769FF', placeholder: 'https://behance.net/johndoe' },
  { name: 'buymeacoffee', label: 'Buy Me a Coffee', color: '#FFDD00', placeholder: 'https://buymeacoffee.com/johndoe' },
  { name: 'cashapp', label: 'Cash App', color: '#00D632', placeholder: '$johndoe' },
  { name: 'coinbase', label: 'Coinbase', color: '#0052FF', placeholder: 'johndoe_crypto' },
  { name: 'yelp', label: 'Yelp', color: '#FF1A1A', placeholder: 'https://yelp.com/biz/johndoe-business' },
  { name: 'npm', label: 'NPM', color: '#CB3837', placeholder: 'https://npmjs.com/~johndoe' },
  { name: 'dribbble', label: 'Dribbble', color: '#EA4C89', placeholder: 'https://dribbble.com/johndoe' },
];

// Combined available actions for backward compatibility
export const allAvailableActions = [...primaryActionsConfig, ...secondaryActionsConfig];

// Helper function to get action config by name
export const getActionConfig = (actionName: string): ActionConfig | undefined => {
  return allAvailableActions.find(action => action.name === actionName);
};

// Helper function to get primary actions only
export const getPrimaryActions = (): ActionConfig[] => {
  return primaryActionsConfig;
};

// Helper function to get secondary actions only
export const getSecondaryActions = (): ActionConfig[] => {
  return secondaryActionsConfig;
};

