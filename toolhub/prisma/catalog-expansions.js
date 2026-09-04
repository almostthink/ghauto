// Additional directory entries requested for Roblox Executors and GameCheats.
// Popularity figures are catalog baselines, not verified usage statistics.
// Third-party cheat/executor listings are not endorsements and may violate game rules.

const logo = (domain) => `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;

export const EXPANDED_CATALOG = [
  {
    name: "Xeno Executor", category: "roblox-executors", sub: "Executors", price: "Free",
    site: "xeno.now", version: "1.3.60", size: "—", rating: 4.4, downloads: 73400, views: 284600,
    tags: ["roblox", "executor", "lua", "script-executor", "windows"],
    short: "Windows Roblox script executor listed with release and compatibility tracking.",
    long: "Xeno Executor is a third-party Windows utility associated with Roblox script execution. This listing records catalog metadata only; Roblox client updates can break compatibility and third-party executors can result in account action.",
    features: ["Lua script execution", "Keyless workflow", "Release tracking", "Windows desktop interface", "Compatibility notes"],
    requirements: ["Windows 10 or 11 (64-bit)", "Roblox installed", "Internet connection"]
  },
  {
    name: "Solara Executor", category: "roblox-executors", sub: "Executors", price: "Free",
    site: "solaraget.com", version: "3.221", size: "—", rating: 4.3, downloads: 68900, views: 251800,
    tags: ["roblox", "executor", "lua", "script-executor", "windows"],
    short: "Windows Roblox Lua executor with release and client compatibility notes.",
    long: "Solara Executor is a third-party Windows-focused Roblox Lua utility. The catalog tracks the advertised release rather than making claims about detection resistance or guaranteed compatibility.",
    features: ["Lua script execution", "Windows 10/11 support", "Release tracking", "Compatibility notes", "Compact desktop workflow"],
    requirements: ["Windows 10 or 11 (64-bit)", "Roblox installed", "Internet connection"]
  },
  {
    name: "Velocity Executor", category: "roblox-executors", sub: "Executors", price: "Free",
    site: "getvelocity.org", version: "0.8.2", size: "—", rating: 4.1, downloads: 52100, views: 197400,
    tags: ["roblox", "executor", "lua", "script-executor", "windows"],
    short: "Third-party Windows Roblox executor with version tracking.",
    long: "Velocity Executor is cataloged as a third-party Roblox script executor with versioned releases and compatibility notes. Roblox changes its client frequently, so the listed version is a snapshot rather than a compatibility guarantee.",
    features: ["Lua script execution", "Roblox client version tracking", "Release changelog", "Windows workflow", "Compatibility-focused updates"],
    requirements: ["Windows 10 or 11", "Roblox installed", "Internet connection"]
  },
  {
    name: "GTAV Kiddion's Mod Menu", category: "gamecheats", sub: "Cheats", price: "Free",
    site: "kiddion.org", version: "1.0.1", size: "—", rating: 4.0, downloads: 61300, views: 226900,
    tags: ["gta-v", "gta5", "mod-menu", "kiddions", "modding"],
    short: "External GTA V mod-menu listing with version and compatibility metadata.",
    long: "Kiddion's Modest Menu is a third-party utility associated with GTA V modding. Online use of modification tools can violate Rockstar policies and may result in account sanctions; this directory entry is informational only.",
    features: ["External menu architecture", "Configurable interface", "Version tracking", "Changelog metadata", "GTA V compatibility notes"],
    requirements: ["Windows 10 or 11", "GTA V for PC", "Use only where third-party modifications are permitted"]
  },
  {
    name: "Fortnite Hack", category: "gamecheats", sub: "Cheats", price: "Paid",
    site: "fortnitehack.org", version: "42.10", size: "—", rating: 3.8, downloads: 44700, views: 181300,
    tags: ["fortnite", "cheat", "aimbot", "esp", "wallhack"],
    short: "Third-party Fortnite cheat listing tracked against the current game build.",
    long: "This entry represents a third-party Fortnite cheat listing, not an Epic Games product. The version field is used as a game-build compatibility marker and is not a claim that the software is safe or undetected.",
    features: ["Build compatibility marker", "ESP-style overlays", "Aim-assist style features", "Release-status tracking", "Catalog metadata"],
    requirements: ["Windows 10 or 11 (64-bit)", "Fortnite PC installation", "Compatibility changes with game and anti-cheat updates"]
  },
  {
    name: "Valorant Hack", category: "gamecheats", sub: "Cheats", price: "Paid",
    site: "project-infinity.cloud", version: "2026.08", size: "—", rating: 3.7, downloads: 39200, views: 169800,
    tags: ["valorant", "cheat", "esp", "aimbot", "vanguard"],
    short: "Third-party Valorant cheat directory entry with a date-based release marker.",
    long: "This listing covers third-party Valorant cheat software. Riot's Vanguard anti-cheat is active on Valorant, so detection and compatibility can change quickly; no undetected guarantee is made here.",
    features: ["Date-based release tracking", "ESP-style overlays", "Aim-assist style options", "Status notes", "Compatibility metadata"],
    requirements: ["Windows 10 or 11 (64-bit)", "Valorant installed", "Compatibility changes with Vanguard and game updates"]
  },
  {
    name: "CS2 Hack", category: "gamecheats", sub: "Cheats", price: "Freemium",
    site: "aimstar.online", version: "2.4.1", size: "—", rating: 3.9, downloads: 48600, views: 204700,
    tags: ["cs2", "counter-strike-2", "cheat", "aimbot", "esp"],
    short: "Third-party Counter-Strike 2 cheat listing with release metadata.",
    long: "CS2 Hack is cataloged as a third-party competitive-game cheat listing. The popularity figures are directory baselines rather than verified real-world usage, and VAC or game updates can change compatibility at any time.",
    features: ["Aimbot-style targeting", "ESP-style overlays", "Radar-style information", "Release tracking", "Compatibility notes"],
    requirements: ["Windows 10 or 11", "Counter-Strike 2 installed", "Current game and anti-cheat build"]
  },
  {
    name: "Apex Legends Hack", category: "gamecheats", sub: "Cheats", price: "Paid",
    site: "safecheats.io", version: "2026.05", size: "—", rating: 3.6, downloads: 31500, views: 137900,
    tags: ["apex-legends", "cheat", "esp", "aimbot", "wallhack"],
    short: "Third-party Apex Legends cheat listing with season and release tracking.",
    long: "This directory entry tracks a third-party Apex Legends cheat listing by release period and supported game season. It is not affiliated with Electronic Arts or Respawn, and detection resistance is not guaranteed.",
    features: ["Season compatibility marker", "ESP-style overlays", "Aim-assist style options", "Release tracking", "Catalog changelog metadata"],
    requirements: ["Windows 10 or 11 (64-bit)", "Apex Legends PC installation", "Compatibility depends on anti-cheat and game updates"]
  }
].map((item) => ({ ...item, logo: logo(item.site) }));
