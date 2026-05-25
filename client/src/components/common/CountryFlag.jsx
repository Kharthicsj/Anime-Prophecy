import { FaGlobe } from "react-icons/fa";

/**
 * CountryFlag — renders either an emoji OR a real flag image from flagcdn.com
 *
 * Props:
 *   value      : string — country value key ("US" | "Japan" | "UK" | "South Korea" | "India" | "Worldwide")
 *   country    : object { value, label } — alternative to value
 *   size       : "xs" | "sm" | "md" | "lg" | "xl"
 *   mode       : "emoji" (default) | "image" (uses flagcdn.com PNG)
 *   className  : extra CSS classes
 */

/* ── Flag CDN country code map ── */
const FLAG_CDN_MAP = {
  US:            "us",
  Japan:         "jp",
  UK:            "gb",
  "South Korea": "kr",
  India:         "in",
  Worldwide:     null,   // no real flag — show globe icon
};

/* ── Emoji fallback map ── */
const EMOJI_MAP = {
  US:            "🇺🇸",
  Japan:         "🇯🇵",
  UK:            "🇬🇧",
  "South Korea": "🇰🇷",
  India:         "🇮🇳",
  Worldwide:     "🌐",
};

/* ── Sizing for emoji mode ── */
const EMOJI_SIZE = {
  xs:  "1rem",
  sm:  "1.25rem",
  md:  "1.6rem",
  lg:  "2.2rem",
  xl:  "3rem",
};

/* ── Flag CDN width tokens (flagcdn.com/w{width}/) ── */
const IMG_CDN_W = {
  xs:  20,
  sm:  28,
  md:  36,
  lg:  52,
  xl:  72,
};

const IMG_HEIGHT = {
  xs:  "14px",
  sm:  "20px",
  md:  "26px",
  lg:  "36px",
  xl:  "50px",
};

/* ── Globe icon size for Worldwide in image mode ── */
const GLOBE_SIZE = {
  xs:  14,
  sm:  20,
  md:  26,
  lg:  36,
  xl:  52,
};

const CountryFlag = ({
  country,
  value,
  size = "md",
  mode = "emoji",
  className = "",
  style = {},
}) => {
  const key = value || country?.value || country?.label || "";
  const cdnCode = FLAG_CDN_MAP[key];
  const emoji   = EMOJI_MAP[key] || "🌐";

  /* ── Image mode ── */
  if (mode === "image") {
    if (cdnCode === null || cdnCode === undefined) {
      // Worldwide → globe icon
      return (
        <span
          className={className}
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#38bdf8",
            ...style,
          }}
          role="img"
          aria-label="Worldwide"
        >
          <FaGlobe size={GLOBE_SIZE[size] || 26} />
        </span>
      );
    }

    const cdnW = IMG_CDN_W[size] || IMG_CDN_W.md;
    return (
      <img
        src={`https://flagcdn.com/w${cdnW}/${cdnCode}.png`}
        srcSet={`https://flagcdn.com/${cdnCode}.svg 2x`}
        width={cdnW}
        height={parseInt(IMG_HEIGHT[size], 10) || 26}
        alt={key}
        className={className}
        style={{
          borderRadius: "4px",
          objectFit: "cover",
          display: "inline-block",
          boxShadow: "0 1px 4px rgba(0,0,0,0.3)",
          ...style,
        }}
        onError={(e) => {
          // Fallback to emoji if CDN fails
          e.target.style.display = "none";
        }}
      />
    );
  }

  /* ── Emoji mode (default) ── */
  return (
    <span
      className={className}
      style={{
        fontSize: EMOJI_SIZE[size] || EMOJI_SIZE.md,
        lineHeight: 1,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        userSelect: "none",
        ...style,
      }}
      role="img"
      aria-label={key}
    >
      {emoji}
    </span>
  );
};

export default CountryFlag;
