// Brand marks drawn as inline SVG. Lucide dropped brand logos, and pulling a
// whole icon package in for seven shapes is not worth it: these render crisply
// at any size and inherit currentColor.

interface IconProps {
  size?: number;
  className?: string;
}

const svg = (size: number, children: React.ReactNode, viewBox = "0 0 24 24", className?: string) => (
  <svg
    width={size}
    height={size}
    viewBox={viewBox}
    fill="currentColor"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
    focusable="false"
    className={className}
  >
    {children}
  </svg>
);

export const WindowsMark = ({ size = 24, className }: IconProps) =>
  svg(size, (
    <>
      <path d="M3 5.4 10.4 4.4v7.1H3V5.4Z" />
      <path d="M11.6 4.2 21 3v8.5h-9.4V4.2Z" />
      <path d="M3 12.5h7.4v7.1L3 18.6v-6.1Z" />
      <path d="M11.6 12.5H21V21l-9.4-1.3v-7.2Z" />
    </>
  ), "0 0 24 24", className);

export const GamepadMark = ({ size = 24, className }: IconProps) =>
  svg(size, (
    <>
      <path d="M6.8 7h10.4a4.8 4.8 0 0 1 4.7 3.9l.9 5.2A2.7 2.7 0 0 1 20.1 19c-.9 0-1.7-.4-2.2-1.1L16.4 16H7.6l-1.5 1.9c-.5.7-1.3 1.1-2.2 1.1a2.7 2.7 0 0 1-2.7-2.9l.9-5.2A4.8 4.8 0 0 1 6.8 7Zm.2 3v1.4H5.6v1.6H7v1.4h1.6V13H10v-1.6H8.6V10H7Zm9 .4a1 1 0 1 0 0 2 1 1 0 0 0 0-2Zm-2 2.4a1 1 0 1 0 0 2 1 1 0 0 0 0-2Zm4 0a1 1 0 1 0 0 2 1 1 0 0 0 0-2Z" />
    </>
  ), "0 0 24 24", className);

export const RobloxMark = ({ size = 24, className }: IconProps) =>
  svg(size, (
    <>
      <path d="M5.2 2 22 6.5 17.5 22 .7 17.5 5.2 2Zm4.3 7.1-1.2 4.4 4.4 1.2 1.2-4.4-4.4-1.2Z" />
    </>
  ), "0 0 24 24", className);

export const EthereumMark = ({ size = 24, className }: IconProps) =>
  svg(size, (
    <>
      <path d="m12 2 6 9.9-6 3.5-6-3.5L12 2Z" opacity=".75" />
      <path d="m12 16.6 6-3.5-6 8.9-6-8.9 6 3.5Z" />
    </>
  ), "0 0 24 24", className);

export const ShieldMark = ({ size = 24, className }: IconProps) =>
  svg(size, (
    <path d="M12 2.2 20 5v6.4c0 4.7-3.2 8.9-8 10.4-4.8-1.5-8-5.7-8-10.4V5l8-2.8Zm3.9 6.6-5.2 5.2-2.6-2.6-1.4 1.4 4 4 6.6-6.6-1.4-1.4Z" />
  ), "0 0 24 24", className);

export const DiscordMark = ({ size = 24, className }: IconProps) =>
  svg(size, (
    <path d="M19.3 5.6A16.4 16.4 0 0 0 15.2 4.4l-.2.4a12.4 12.4 0 0 1 3.6 1.8 15.7 15.7 0 0 0-13.2 0 12.4 12.4 0 0 1 3.6-1.8l-.2-.4A16.4 16.4 0 0 0 4.7 5.6C2.1 9.5 1.4 13.3 1.7 17a16.6 16.6 0 0 0 5 2.5l1-1.7a10.8 10.8 0 0 1-1.7-.8l.4-.3a11.9 11.9 0 0 0 11.2 0l.4.3a10.8 10.8 0 0 1-1.7.8l1 1.7a16.6 16.6 0 0 0 5-2.5c.4-4.3-.6-8-2.9-11.4ZM8.6 14.7c-1 0-1.8-.9-1.8-2s.8-2 1.8-2 1.8.9 1.8 2-.8 2-1.8 2Zm6.8 0c-1 0-1.8-.9-1.8-2s.8-2 1.8-2 1.8.9 1.8 2-.8 2-1.8 2Z" />
  ), "0 0 24 24", className);

export const TelegramMark = ({ size = 24, className }: IconProps) =>
  svg(size, (
    <path d="M21.9 4.3 18.7 19.4c-.2 1.1-.9 1.3-1.8.8l-5-3.7-2.4 2.3c-.3.3-.5.5-1 .5l.4-5.1 9.3-8.4c.4-.4-.1-.6-.6-.2L6.1 12.8l-5-1.5c-1-.4-1.1-1.1.2-1.6l19.4-7.5c.9-.3 1.6.2 1.2 2.1Z" />
  ), "0 0 24 24", className);

export const YoutubeMark = ({ size = 24, className }: IconProps) =>
  svg(size, (
    <path d="M22.5 7.2a2.7 2.7 0 0 0-1.9-1.9C18.9 4.8 12 4.8 12 4.8s-6.9 0-8.6.5A2.7 2.7 0 0 0 1.5 7.2 28 28 0 0 0 1 12a28 28 0 0 0 .5 4.8 2.7 2.7 0 0 0 1.9 1.9c1.7.5 8.6.5 8.6.5s6.9 0 8.6-.5a2.7 2.7 0 0 0 1.9-1.9A28 28 0 0 0 23 12a28 28 0 0 0-.5-4.8ZM9.8 15.3V8.7l5.7 3.3-5.7 3.3Z" />
  ), "0 0 24 24", className);

export const XMark = ({ size = 24, className }: IconProps) =>
  svg(size, (
    <path d="M17.5 3h3.2l-7 8 8.2 10h-6.4l-5-6.2-5.8 6.2H1.5l7.5-8.5L1.1 3h6.6l4.6 5.7L17.5 3Zm-1.1 16.1h1.8L7.7 4.8H5.8l10.6 14.3Z" />
  ), "0 0 24 24", className);

// The ToolHub mark: a cube, the same shape used in the hero illustration.
export const LogoMark = ({ size = 24, className }: IconProps) =>
  svg(size, (
    <>
      <path d="M12 2 3.5 6.6v10.8L12 22l8.5-4.6V6.6L12 2Zm0 2.3 6.2 3.4L12 11 5.8 7.7 12 4.3ZM5.3 9.3 11.1 12.5v6.6L5.3 16V9.3Zm7.6 9.8v-6.6L18.7 9.3V16l-5.8 3.1Z" />
    </>
  ), "0 0 24 24", className);
