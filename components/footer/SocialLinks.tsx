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

export function SocialLinks() {
  return (
    <div className="flex items-center gap-4">
      <a
        href="https://www.instagram.com/fadeessence1?igsh=MW8zbHV4cXF5ZTQycA%3D%3D&utm_source=qr"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Instagram"
      >
        <FaInstagram className={iconClass} />
      </a>
      <a
        href="https://x.com/fade_essence?s=21"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="X (Twitter)"
      >
        <FaXTwitter className={iconClass} />
      </a>
      <a
        href="https://wa.me/2348160591348"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="WhatsApp"
      >
        <FaWhatsapp className={iconClass} />
      </a>
      <a
        href="https://www.tiktok.com/@coming_soonnn_?_r=1&_t=ZS-922wBNzhnGK"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="TikTok"
      >
        <FaTiktok className={iconClass} />
      </a>
      <a
        href="https://www.facebook.com/profile.php?id=61585007902299&mibextid=wwXIfr"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Facebook"
      >
        <FaFacebookF className={iconClass} />
      </a>
    </div>
  );
}
