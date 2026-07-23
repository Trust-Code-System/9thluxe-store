"use client";

import {
  FaInstagram,
  FaXTwitter,
  FaWhatsapp,
  FaTiktok,
  FaFacebookF,
} from "react-icons/fa6";

const iconClass =
  "h-5 w-5 text-muted-foreground transition-colors duration-150 hover:text-accent";

export interface SocialLinksProps {
  instagramUrl?: string;
  xUrl?: string;
  whatsappUrl?: string;
  tiktokUrl?: string;
  facebookUrl?: string;
}

const DEFAULTS: Required<SocialLinksProps> = {
  instagramUrl:
    "https://www.instagram.com/fadeessence1?igsh=MW8zbHV4cXF5ZTQycA%3D%3D&utm_source=qr",
  xUrl: "https://x.com/fade_essence?s=21",
  whatsappUrl: "https://wa.me/2348160591348",
  tiktokUrl: "https://www.tiktok.com/@coming_soonnn_?_r=1&_t=ZS-922wBNzhnGK",
  facebookUrl:
    "https://www.facebook.com/profile.php?id=61585007902299&mibextid=wwXIfr",
};

export function SocialLinks(props: SocialLinksProps = {}) {
  const links = [
    { url: props.instagramUrl ?? DEFAULTS.instagramUrl, label: "Instagram", Icon: FaInstagram },
    { url: props.xUrl ?? DEFAULTS.xUrl, label: "X (Twitter)", Icon: FaXTwitter },
    { url: props.whatsappUrl ?? DEFAULTS.whatsappUrl, label: "WhatsApp", Icon: FaWhatsapp },
    { url: props.tiktokUrl ?? DEFAULTS.tiktokUrl, label: "TikTok", Icon: FaTiktok },
    { url: props.facebookUrl ?? DEFAULTS.facebookUrl, label: "Facebook", Icon: FaFacebookF },
  ].filter((l) => l.url);

  return (
    <div className="flex items-center gap-4">
      {links.map(({ url, label, Icon }) => (
        <a
          key={label}
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={label}
        >
          <Icon className={iconClass} />
        </a>
      ))}
    </div>
  );
}
