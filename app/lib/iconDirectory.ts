const bucketUrl = import.meta.env.VITE_AWS_S3_BUCKET_URL;

export const iconDirectory = {
    appsumo: {
      name: "AppSumo",
      section: "secondary" as const,
      iconLocation: `${bucketUrl}/icons/appsumo.svg`,
      backgroundColor: "#ff6b35",
      inputType: "text" as const,
      validationRegex: "^[a-zA-Z0-9_-]+$"
    },
    behance: {
      name: "Behance",
      section: "secondary" as const,
      iconLocation: `${bucketUrl}/icons/behance.svg`,
      backgroundColor: "#1769ff",
      inputType: "url" as const,
      validationRegex: "^https://www\\.behance\\.net/[a-zA-Z0-9_-]+$"
    },
    bitcoin: {
      name: "Bitcoin",
      section: "secondary" as const,
      iconLocation: `${bucketUrl}/icons/bitcoin.svg`,
      backgroundColor: "#f7931a",
      inputType: "text" as const,
      validationRegex: "^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$|^bc1[a-z0-9]{39,59}$"
    },
    box: {
      name: "Box",
      section: "secondary" as const,
      iconLocation: `${bucketUrl}/icons/box.svg`,
      backgroundColor: "#0061d5",
      inputType: "url" as const,
      validationRegex: "^https://[a-zA-Z0-9-]+\\.app\\.box\\.com/[a-zA-Z0-9_-]+$"
    },
    calendar: {
      name: "Calendar",
      section: "primary" as const,
      iconLocation: `${bucketUrl}/icons/calendar.svg`,
      backgroundColor: "#007bff",
      inputType: "url" as const,
    },
    call: {
      name: "Phone Call",
      section: "primary" as const,
      iconLocation: `${bucketUrl}/icons/call.svg`,
      backgroundColor: "#28a745",
      inputType: "tel" as const
    },
    code: {
      name: "Code",
      section: "primary" as const,
      iconLocation: `${bucketUrl}/icons/code.svg`,
      backgroundColor: "#6c757d",
      inputType: "url" as const,
    },
    codeberg: {
      name: "Codeberg",
      section: "secondary" as const,
      iconLocation: `${bucketUrl}/icons/codeberg.svg`,
      backgroundColor: "#2185d0",
      inputType: "url" as const,
      validationRegex: "^https://codeberg\\.org/[a-zA-Z0-9_.-]+/[a-zA-Z0-9_.-]+$"
    },
    diaspora: {
      name: "Diaspora",
      section: "secondary" as const,
      iconLocation: `${bucketUrl}/icons/diaspora.svg`,
      backgroundColor: "#7c4dff",
      inputType: "url" as const,
      validationRegex: "^https://[a-zA-Z0-9.-]+\\.diaspora-foundation\\.org/people/[a-f0-9]{40}$"
    },
    discord: {
      name: "Discord",
      section: "secondary" as const,
      iconLocation: `${bucketUrl}/icons/discord.svg`,
      backgroundColor: "#5865f2",
      inputType: "text" as const,
      validationRegex: "^.{3,32}#[0-9]{4}$"
    },
    documents: {
      name: "Documents",
      section: "primary" as const,
      iconLocation: `${bucketUrl}/icons/documents.svg`,
      backgroundColor: "#6c757d",
      inputType: "url" as const,
      validationRegex: "^https://docs\\.google\\.com/[a-zA-Z0-9/_.-]+$"
    },
    dribbble: {
      name: "Dribbble",
      section: "secondary" as const,
      iconLocation: `${bucketUrl}/icons/dribbble.svg`,
      backgroundColor: "#ea4c89",
      inputType: "url" as const,
      validationRegex: "^https://dribbble\\.com/[a-zA-Z0-9_.-]+$"
    },
    email: {
      name: "Email",
      section: "primary" as const,
      iconLocation: `${bucketUrl}/icons/email.svg`,
      backgroundColor: "#0078d4",
      inputType: "text" as const,
      validationRegex: "^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$"
    },
    facebook: {
      name: "Facebook",
      section: "secondary" as const,
      iconLocation: `${bucketUrl}/icons/facebook.svg`,
      backgroundColor: "#1877f2",
      inputType: "url" as const,
      validationRegex: "^https://www\\.facebook\\.com/[a-zA-Z0-9_.-]+$"
    },
    fax: {
      name: "Fax",
      section: "primary" as const,
      iconLocation: `${bucketUrl}/icons/fax.svg`,
      backgroundColor: "#6c757d",
      inputType: "tel" as const
    },
    friendica: {
      name: "Friendica",
      section: "secondary" as const,
      iconLocation: `${bucketUrl}/icons/friendica.svg`,
      backgroundColor: "#4e7c96",
      inputType: "url" as const,
      validationRegex: "^https://[a-zA-Z0-9.-]+/profile/[a-zA-Z0-9_.-]+$"
    },
    funkwhale: {
      name: "Funkwhale",
      section: "secondary" as const,
      iconLocation: `${bucketUrl}/icons/funkwhale.svg`,
      backgroundColor: "#1a237e",
      inputType: "url" as const,
      validationRegex: "^https://[a-zA-Z0-9.-]+/@[a-zA-Z0-9_.-]+$"
    },
    github: {
      name: "GitHub",
      section: "secondary" as const,
      iconLocation: `${bucketUrl}/icons/github.svg`,
      backgroundColor: "#333333",
      inputType: "url" as const,
      validationRegex: "^https://github\\.com/[a-zA-Z0-9_.-]+$"
    },
    gitlab: {
      name: "GitLab",
      section: "secondary" as const,
      iconLocation: `${bucketUrl}/icons/gitlab.svg`,
      backgroundColor: "#fc6d26",
      inputType: "url" as const,
      validationRegex: "^https://gitlab\\.com/[a-zA-Z0-9_.-]+$"
    },
    google: {
      name: "Google",
      section: "secondary" as const,
      iconLocation: `${bucketUrl}/icons/google.svg`,
      backgroundColor: "#4285f4",
      inputType: "url" as const,
      validationRegex: "^https://plus\\.google\\.com/\\+[a-zA-Z0-9_.-]+$"
    },
    gumroad: {
      name: "Gumroad",
      section: "secondary" as const,
      iconLocation: `${bucketUrl}/icons/gumroad.svg`,
      backgroundColor: "#36a9ae",
      inputType: "url" as const,
      validationRegex: "^https://gumroad\\.com/[a-zA-Z0-9_.-]+$"
    },
    highlevel: {
      name: "HighLevel",
      section: "secondary" as const,
      iconLocation: `${bucketUrl}/icons/highlevel.svg`,
      backgroundColor: "#6366f1",
      inputType: "url" as const,
      validationRegex: "^https://app\\.gohighlevel\\.com/[a-zA-Z0-9/_.-]+$"
    },
    home: {
      name: "Home",
      section: "primary" as const,
      iconLocation: `${bucketUrl}/icons/home.svg`,
      backgroundColor: "#6c757d",
      inputType: "url" as const,
      validationRegex: "^https?://[^\\s]+\\.[a-zA-Z]{2,}$"
    },
    instagram: {
      name: "Instagram",
      section: "secondary" as const,
      iconLocation: `${bucketUrl}/icons/instagram.svg`,
      backgroundColor: "#e4405f",
      inputType: "url" as const,
      validationRegex: "^https://www\\.instagram\\.com/[a-zA-Z0-9_.-]+$"
    },
    key: {
      name: "Key",
      section: "primary" as const,
      iconLocation: `${bucketUrl}/icons/key.svg`,
      backgroundColor: "#6c757d",
      inputType: "text" as const,
      validationRegex: "^[a-f0-9]{64}$"
    },
    line: {
      name: "Line",
      section: "secondary" as const,
      iconLocation: `${bucketUrl}/icons/line.svg`,
      backgroundColor: "#00c300",
      inputType: "text" as const,
      validationRegex: "^[a-zA-Z0-9_.-]+$"
    },
    linkedin: {
      name: "LinkedIn",
      section: "secondary" as const,
      iconLocation: `${bucketUrl}/icons/linkedin.svg`,
      backgroundColor: "#0077b5",
      inputType: "url" as const,
      validationRegex: "^https://www\\.linkedin\\.com/in/[a-zA-Z0-9_.-]+$"
    },
    littleredbook: {
      name: "Little Red Book",
      section: "secondary" as const,
      iconLocation: `${bucketUrl}/icons/littleredbook.svg`,
      backgroundColor: "#ff2442",
      inputType: "url" as const,
      validationRegex: "^https://www\\.xiaohongshu\\.com/user/profile/[a-zA-Z0-9]+$"
    },
  
  
    mastodon: {
      name: "Mastodon",
      section: "secondary" as const,
      iconLocation: `${bucketUrl}/icons/mastodon.svg`,
      backgroundColor: "#6364ff",
      inputType: "url" as const,
      validationRegex: "^https://[a-zA-Z0-9.-]+/@[a-zA-Z0-9_.-]+@[a-zA-Z0-9.-]+$"
    },
    medium: {
      name: "Medium",
      section: "secondary" as const,
      iconLocation: `${bucketUrl}/icons/medium.svg`,
      backgroundColor: "#000000",
      inputType: "url" as const,
      validationRegex: "^https://medium\\.com/@[a-zA-Z0-9_.-]+$"
    },
    messenger: {
      name: "Messenger",
      section: "primary" as const,
      iconLocation: `${bucketUrl}/icons/messenger.svg`,
      backgroundColor: "#006aff",
      inputType: "url" as const,
      validationRegex: "^https://m\\.me/[a-zA-Z0-9_.-]+$"
    },
    mobile: {
      name: "Mobile",
      section: "primary" as const,
      iconLocation: `${bucketUrl}/icons/mobile.svg`,
      backgroundColor: "#6c757d",
      inputType: "tel" as const
    },
    monero: {
      name: "Monero",
      section: "secondary" as const,
      iconLocation: `${bucketUrl}/icons/monero.svg`,
      backgroundColor: "#ff6600",
      inputType: "text" as const,
      validationRegex: "^[48][0-9AB][1-9A-HJ-NP-Za-km-z]{93}$"
    },
    music: {
      name: "Music",
      section: "secondary" as const,
      iconLocation: `${bucketUrl}/icons/music.svg`,
      backgroundColor: "#6c757d",
      inputType: "url" as const,
      validationRegex: "^https://open\\.spotify\\.com/[a-zA-Z0-9/_.-]+$"
    },
    office: {
      name: "Office",
      section: "primary" as const,
      iconLocation: `${bucketUrl}/icons/office.svg`,
      backgroundColor: "#6c757d",
      inputType: "tel" as const,
    },
    opencollective: {
      name: "Open Collective",
      section: "secondary" as const,
      iconLocation: `${bucketUrl}/icons/opencollective.svg`,
      backgroundColor: "#7fadf2",
      inputType: "url" as const,
      validationRegex: "^https://opencollective\\.com/[a-zA-Z0-9_.-]+$"
    },
    patreon: {
      name: "Patreon",
      section: "secondary" as const,
      iconLocation: `${bucketUrl}/icons/patreon.svg`,
      backgroundColor: "#ff424d",
      inputType: "url" as const,
      validationRegex: "^https://www\\.patreon\\.com/[a-zA-Z0-9_.-]+$"
    },
    pause: {
      name: "Pause",
      section: "primary" as const,
      iconLocation: `${bucketUrl}/icons/pause.svg`,
      backgroundColor: "#6c757d",
      inputType: "text" as const,
      validationRegex: "^.{1,50}$"
    },
    paypal: {
      name: "PayPal",
      section: "secondary" as const,
      iconLocation: `${bucketUrl}/icons/paypal.svg`,
      backgroundColor: "#0070ba",
      inputType: "text" as const,
      validationRegex: "^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$"
    },
    peertube: {
      name: "PeerTube",
      section: "secondary" as const,
      iconLocation: `${bucketUrl}/icons/peertube.svg`,
      backgroundColor: "#f1680d",
      inputType: "url" as const,
      validationRegex: "^https://[a-zA-Z0-9.-]+/accounts/[a-zA-Z0-9_.-]+$"
    },
    pinterest: {
      name: "Pinterest",
      section: "secondary" as const,
      iconLocation: `${bucketUrl}/icons/pinterest.svg`,
      backgroundColor: "#e60023",
      inputType: "url" as const,
      validationRegex: "^https://www\\.pinterest\\.com/[a-zA-Z0-9_.-]+$"
    },
    pixelfed: {
      name: "Pixelfed",
      section: "secondary" as const,
      iconLocation: `${bucketUrl}/icons/pixelfed.svg`,
      backgroundColor: "#ff0080",
      inputType: "url" as const,
      validationRegex: "^https://[a-zA-Z0-9.-]+/@[a-zA-Z0-9_.-]+$"
    },
    quora: {
      name: "Quora",
      section: "secondary" as const,
      iconLocation: `${bucketUrl}/icons/quora.svg`,
      backgroundColor: "#b92b27",
      inputType: "url" as const,
      validationRegex: "^https://www\\.quora\\.com/profile/[a-zA-Z0-9_.-]+$"
    },
    reddit: {
      name: "Reddit",
      section: "secondary" as const,
      iconLocation: `${bucketUrl}/icons/reddit.svg`,
      backgroundColor: "#ff4500",
      inputType: "url" as const,
      validationRegex: "^https://www\\.reddit\\.com/user/[a-zA-Z0-9_.-]+$"
    },
    seamless: {
      name: "Seamless",
      section: "secondary" as const,
      iconLocation: `${bucketUrl}/icons/seamless.svg`,
      backgroundColor: "#00bcd4",
      inputType: "url" as const,
      validationRegex: "^https://www\\.seamless\\.com/[a-zA-Z0-9/_.-]+$"
    },
    share: {
      name: "Share",
      section: "primary" as const,
      iconLocation: `${bucketUrl}/icons/share.svg`,
      backgroundColor: "#6c757d",
      inputType: "url" as const,
      validationRegex: "^https?://[^\\s]+$"
    },
    signal: {
      name: "Signal",
      section: "primary" as const,
      iconLocation: `${bucketUrl}/icons/signal.svg`,
      backgroundColor: "#3a76f0",
      inputType: "tel" as const
    },
    siilo: {
      name: "Siilo",
      section: "primary" as const,
      iconLocation: `${bucketUrl}/icons/siilo.svg`,
      backgroundColor: "#00d4aa",
      inputType: "text" as const,
      validationRegex: "^[a-zA-Z0-9_.-]+$"
    },
    skool: {
      name: "Skool",
      section: "secondary" as const,
      iconLocation: `${bucketUrl}/icons/skool.svg`,
      backgroundColor: "#4f46e5",
      inputType: "url" as const,
      validationRegex: "^https://www\\.skool\\.com/[a-zA-Z0-9_.-]+$"
    },
    skype: {
      name: "Skype",
      section: "primary" as const,
      iconLocation: `${bucketUrl}/icons/skype.svg`,
      backgroundColor: "#00aff0",
      inputType: "text" as const,
      validationRegex: "^[a-zA-Z0-9_.-]+$"
    },
    sms: {
      name: "SMS",
      section: "primary" as const,
      iconLocation: `${bucketUrl}/icons/sms.svg`,
      backgroundColor: "#6c757d",
      inputType: "tel" as const
    },
    snapchat: {
      name: "Snapchat",
      section: "secondary" as const,
      iconLocation: `${bucketUrl}/icons/snapchat.svg`,
      backgroundColor: "#fffc00",
      inputType: "text" as const,
      validationRegex: "^[a-zA-Z0-9_.-]+$"
    },
    soundcloud: {
      name: "SoundCloud",
      section: "secondary" as const,
      iconLocation: `${bucketUrl}/icons/soundcloud.svg`,
      backgroundColor: "#ff5500",
      inputType: "url" as const,
      validationRegex: "^https://soundcloud\\.com/[a-zA-Z0-9_.-]+$"
    },
    spotify: {
      name: "Spotify",
      section: "secondary" as const,
      iconLocation: `${bucketUrl}/icons/spotify.svg`,
      backgroundColor: "#1db954",
      inputType: "url" as const,
      validationRegex: "^https://open\\.spotify\\.com/[a-zA-Z0-9/_.-]+$"
    },
    square: {
      name: "Square",
      section: "secondary" as const,
      iconLocation: `${bucketUrl}/icons/square.svg`,
      backgroundColor: "#0066cc",
      inputType: "url" as const,
      validationRegex: "^https://square\\.up\\.com/[a-zA-Z0-9/_.-]+$"
    },
    store: {
      name: "Store",
      section: "primary" as const,
      iconLocation: `${bucketUrl}/icons/store.svg`,
      backgroundColor: "#6c757d",
      inputType: "url" as const,
      validationRegex: "^https?://[^\\s]+\\.[a-zA-Z]{2,}$"
    },
    telegram: {
      name: "Telegram",
      section: "primary" as const,
      iconLocation: `${bucketUrl}/icons/telegram.svg`,
      backgroundColor: "#0088cc",
      inputType: "text" as const,
      validationRegex: "^@[a-zA-Z0-9_]{5,32}$"
    },
    text: {
      name: "Text",
      section: "primary" as const,
      iconLocation: `${bucketUrl}/icons/text.svg`,
      backgroundColor: "#6c757d",
      inputType: "tel" as const
    },
    threads: {
      name: "Threads",
      section: "secondary" as const,
      iconLocation: `${bucketUrl}/icons/threads.svg`,
      backgroundColor: "#000000",
      inputType: "url" as const,
      validationRegex: "^https://www\\.threads\\.net/@[a-zA-Z0-9_.-]+$"
    },
    tiktok: {
      name: "TikTok",
      section: "secondary" as const,
      iconLocation: `${bucketUrl}/icons/tiktok.svg`,
      backgroundColor: "#000000",
      inputType: "url" as const,
      validationRegex: "^https://www\\.tiktok\\.com/@[a-zA-Z0-9_.-]+$"
    },
    tumblr: {
      name: "Tumblr",
      section: "secondary" as const,
      iconLocation: `${bucketUrl}/icons/tumblr.svg`,
      backgroundColor: "#001935",
      inputType: "url" as const,
      validationRegex: "^https://[a-zA-Z0-9_.-]+\\.tumblr\\.com$"
    },
    twitch: {
      name: "Twitch",
      section: "secondary" as const,
      iconLocation: `${bucketUrl}/icons/twitch.svg`,
      backgroundColor: "#9146ff",
      inputType: "url" as const,
      validationRegex: "^https://www\\.twitch\\.tv/[a-zA-Z0-9_.-]+$"
    },
    ubereats: {
      name: "Uber Eats",
      section: "secondary" as const,
      iconLocation: `${bucketUrl}/icons/ubereats.svg`,
      backgroundColor: "#06c167",
      inputType: "url" as const,
      validationRegex: "^https://www\\.ubereats\\.com/[a-zA-Z0-9/_.-]+$"
    },
    upi: {
      name: "UPI",
      section: "secondary" as const,
      iconLocation: `${bucketUrl}/icons/upi.svg`,
      backgroundColor: "#6c757d",
      inputType: "text" as const,
      validationRegex: "^[^\\s@]+@[^\\s@]+$"
    },
    venmo: {
      name: "Venmo",
      section: "secondary" as const,
      iconLocation: `${bucketUrl}/icons/venmo.svg`,
      backgroundColor: "#3d95ce",
      inputType: "text" as const,
      validationRegex: "^@[a-zA-Z0-9_.-]+$"
    },
    viber: {
      name: "Viber",
      section: "primary" as const,
      iconLocation: `${bucketUrl}/icons/viber.svg`,
      backgroundColor: "#665cac",
      inputType: "tel" as const
    },
    videos: {
      name: "Videos",
      section: "primary" as const,
      iconLocation: `${bucketUrl}/icons/videos.svg`,
      backgroundColor: "#6c757d",
      inputType: "url" as const,
      validationRegex: "^https://www\\.youtube\\.com/[a-zA-Z0-9/_.-]+$"
    },
    vimeo: {
      name: "Vimeo",
      section: "secondary" as const,
      iconLocation: `${bucketUrl}/icons/vimeo.svg`,
      backgroundColor: "#1ab7ea",
      inputType: "url" as const,
      validationRegex: "^https://vimeo\\.com/[a-zA-Z0-9_.-]+$"
    },
    vk: {
      name: "VK",
      section: "secondary" as const,
      iconLocation: `${bucketUrl}/icons/vk.svg`,
      backgroundColor: "#4680c2",
      inputType: "url" as const,
      validationRegex: "^https://vk\\.com/[a-zA-Z0-9_.-]+$"
    },
    wechat: {
      name: "WeChat",
      section: "primary" as const,
      iconLocation: `${bucketUrl}/icons/wechat.svg`,
      backgroundColor: "#07c160",
      inputType: "text" as const,
      validationRegex: "^[a-zA-Z0-9_.-]+$"
    },
    website: {
      name: "Website",
      section: "primary" as const,
      iconLocation: `${bucketUrl}/icons/website.svg`,
      backgroundColor: "#6c757d",
      inputType: "url" as const,
      validationRegex: "^https?://[^\\s]+\\.[a-zA-Z]{2,}$"
    },
    whatsapp: {
      name: "WhatsApp",
      section: "primary" as const,
      iconLocation: `${bucketUrl}/icons/whatsapp.svg`,
      backgroundColor: "#25d366",
      inputType: "tel" as const
    },
    x: {
      name: "X (Twitter)",
      section: "secondary" as const,
      iconLocation: `${bucketUrl}/icons/x.svg`,
      backgroundColor: "#000000",
      inputType: "url" as const,
      validationRegex: "^https://x\\.com/[a-zA-Z0-9_.-]+$"
    },
    yelp: {
      name: "Yelp",
      section: "secondary" as const,
      iconLocation: `${bucketUrl}/icons/yelp.svg`,
      backgroundColor: "#ff1a1a",
      inputType: "url" as const,
      validationRegex: "^https://www\\.yelp\\.com/biz/[a-zA-Z0-9_.-]+$"
    },
    youtube: {
      name: "YouTube",
      section: "secondary" as const,
      iconLocation: `${bucketUrl}/icons/youtube.svg`,
      backgroundColor: "#ff0000",
      inputType: "url" as const,
      validationRegex: "^https://www\\.youtube\\.com/[a-zA-Z0-9/_.-]+$"
    },
    zalo: {
      name: "Zalo",
      section: "primary" as const,
      iconLocation: `${bucketUrl}/icons/zalo.svg`,
      backgroundColor: "#0068ff",
      inputType: "tel" as const
    }
  };