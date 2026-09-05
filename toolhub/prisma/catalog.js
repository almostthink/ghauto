// The demo catalog: real tools, described from their own documentation.
//
// `logo` is the vendor's favicon, fetched live from their domain, so every
// entry has a genuine mark without shipping anyone's trademark in the repo.
// Replace any of them with a proper upload from the admin panel.
// Versions and file sizes move constantly: treat them as a starting point and
// check them before the catalog goes public.

const logo = (domain) => `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;

export const CATALOG = [
  // ---------------------------------------------------------------- Windows
  {
    name: "CCleaner", category: "windows", sub: "Optimization", price: "Freemium",
    site: "ccleaner.com", version: "6.30", size: "52 MB", rating: 4.3, downloads: 128540,
    tags: ["cleanup", "registry", "privacy"],
    short: "Clears temporary files, browser data and unused registry entries.",
    long: "CCleaner removes the files Windows and installed applications leave behind: caches, logs, crash dumps and browser history. It also manages startup entries and browser plugins, and includes a registry cleaner that backs up every change before applying it.",
    features: ["One-click cleanup across apps and browsers", "Startup and scheduled task manager", "Registry cleaner with automatic backups", "Duplicate file finder", "Software uninstaller"],
    requirements: ["Windows 10 or 11", "1 GB RAM", "150 MB free disk space"]
  },
  {
    name: "BleachBit", category: "windows", sub: "Optimization", price: "Free",
    site: "bleachbit.org", version: "4.6.2", size: "16 MB", rating: 4.5, downloads: 41200,
    tags: ["cleanup", "open source", "privacy"],
    short: "Open-source disk cleaner that also shreds files beyond recovery.",
    long: "BleachBit frees disk space by deleting cache, logs and temporary files for hundreds of applications. Beyond cleaning it can overwrite free space and shred individual files, so deleted data cannot be recovered, and every cleaner is a readable configuration file you can audit.",
    features: ["Cleaners for 100+ applications", "Free space overwriting and file shredding", "Command line interface for scripting", "Preview before deleting", "Portable build available"],
    requirements: ["Windows 10 or 11", "512 MB RAM"]
  },
  {
    name: "Glary Utilities", category: "windows", sub: "Optimization", price: "Freemium",
    site: "glarysoft.com", version: "6.14", size: "38 MB", rating: 4.2, downloads: 33800,
    tags: ["cleanup", "maintenance"],
    short: "Maintenance suite bundling cleanup, repair and optimisation tools.",
    long: "Glary Utilities collects around twenty maintenance tools behind a single one-click scan: disk cleanup, registry repair, shortcut fixing, startup management and a disk space analyser. Each tool can also be run on its own from the advanced view.",
    features: ["One-click maintenance scan", "Disk space analyser", "Startup manager", "Duplicate and empty folder finder", "Context menu manager"],
    requirements: ["Windows 10 or 11", "1 GB RAM"]
  },
  {
    name: "Microsoft PC Manager", category: "windows", sub: "Optimization", price: "Free",
    site: "pcmanager.microsoft.com", version: "3.15", size: "42 MB", rating: 4.1, downloads: 58700,
    tags: ["cleanup", "microsoft"],
    short: "Microsoft's own cleanup and health utility for Windows 11.",
    long: "PC Manager is Microsoft's first-party maintenance app: it clears temporary files, manages startup programs, checks for Windows updates and surfaces Defender status from one panel. Because it ships from Microsoft it makes no changes the platform does not already support.",
    features: ["Health check with one-click fixes", "Storage cleanup and large file finder", "Startup app management", "Windows Update and Defender status", "Browser protection settings"],
    requirements: ["Windows 10 (1809) or Windows 11", "1 GB RAM"]
  },
  {
    name: "Process Lasso", category: "windows", sub: "Optimization", price: "Freemium",
    site: "bitsum.com", version: "14.2", size: "12 MB", rating: 4.6, downloads: 27400,
    tags: ["cpu", "performance"],
    short: "Keeps a busy machine responsive by shaping process priorities.",
    long: "Process Lasso watches CPU load and lowers the priority of background processes that would otherwise starve the application you are using. Rules can be saved per process, so a game or a compile job keeps the cores it needs across reboots.",
    features: ["ProBalance responsiveness algorithm", "Persistent per-process priorities and affinities", "Power plan automation", "Process watchdog rules", "Detailed CPU and memory graphs"],
    requirements: ["Windows 10 or 11 (64-bit)", "2 GB RAM"]
  },
  {
    name: "Revo Uninstaller", category: "windows", sub: "Optimization", price: "Freemium",
    site: "revouninstaller.com", version: "2.5.9", size: "22 MB", rating: 4.7, downloads: 46300,
    tags: ["uninstall", "cleanup"],
    short: "Removes programs together with the files and registry keys they leave.",
    long: "Revo Uninstaller runs an application's own uninstaller, then scans for the folders, files and registry entries it left behind and offers to remove them too. A hunter mode lets you drag a target onto any window to uninstall whatever owns it.",
    features: ["Leftover scan after every uninstall", "Forced uninstall for broken entries", "Hunter mode", "Restore points before each removal", "Batch uninstall"],
    requirements: ["Windows 10 or 11", "1 GB RAM"]
  },
  {
    name: "Autoruns", category: "windows", sub: "Optimization", price: "Free",
    site: "learn.microsoft.com", version: "14.11", size: "4 MB", rating: 4.8, downloads: 31900,
    tags: ["startup", "sysinternals"],
    short: "Shows everything Windows starts automatically, in one list.",
    long: "Autoruns from Sysinternals enumerates every autostart location Windows has: run keys, services, drivers, scheduled tasks, codecs, browser helpers and shell extensions. Entries can be disabled rather than deleted, and unsigned or unknown binaries can be checked against VirusTotal.",
    features: ["Every autostart location in one view", "VirusTotal lookups", "Signature verification", "Disable instead of delete", "Offline system analysis"],
    requirements: ["Windows 10 or 11", "No installation required"]
  },
  {
    name: "WizTree", category: "windows", sub: "Optimization", price: "Freemium",
    site: "diskanalyzer.com", version: "4.24", size: "8 MB", rating: 4.8, downloads: 38100,
    tags: ["disk", "analyzer"],
    short: "Finds what is filling a drive, in seconds.",
    long: "WizTree reads the NTFS master file table directly instead of walking folders, so a full drive scan finishes in a few seconds. Results are shown as a sortable tree and a treemap, which makes the largest files and folders obvious at a glance.",
    features: ["Scans an NTFS drive in seconds", "Treemap visualisation", "Top 1000 largest files list", "File type breakdown", "Portable version"],
    requirements: ["Windows 10 or 11", "NTFS drive for fast scans"]
  },
  {
    name: "Malwarebytes", category: "windows", sub: "Security", price: "Freemium",
    site: "malwarebytes.com", version: "5.3", size: "270 MB", rating: 4.6, downloads: 96200,
    tags: ["antimalware", "security"],
    short: "Second-opinion scanner for malware, adware and unwanted software.",
    long: "Malwarebytes pairs signature detection with behaviour analysis and is commonly run alongside another antivirus as a second opinion. The free build scans and cleans on demand; the paid tier adds real-time protection, a ransomware shield and a browser guard.",
    features: ["On-demand and scheduled scans", "Ransomware and exploit protection (paid)", "Browser guard against scam sites", "Quarantine with one-click restore", "Rootkit scanning"],
    requirements: ["Windows 10 or 11", "4 GB RAM", "250 MB free disk space"]
  },
  {
    name: "Bitwarden", category: "windows", sub: "Security", price: "Freemium",
    site: "bitwarden.com", version: "2026.8", size: "88 MB", rating: 4.8, downloads: 74600,
    tags: ["passwords", "open source"],
    short: "Open-source password manager that syncs across every device.",
    long: "Bitwarden stores passwords, passkeys, cards and notes in an end-to-end encrypted vault. The clients and the server are open source and the server can be self-hosted, so the whole chain is auditable. The free tier already covers unlimited items on unlimited devices.",
    features: ["End-to-end encrypted vault", "Passkey support", "Browser extensions and mobile apps", "Secure password generator", "Self-hosting option"],
    requirements: ["Windows 10 or 11", "Bitwarden account or self-hosted server"]
  },
  {
    name: "KeePassXC", category: "windows", sub: "Security", price: "Free",
    site: "keepassxc.org", version: "2.7.10", size: "42 MB", rating: 4.7, downloads: 39400,
    tags: ["passwords", "offline", "open source"],
    short: "Offline password manager with a local encrypted database.",
    long: "KeePassXC keeps credentials in a single encrypted file you control: nothing is uploaded anywhere unless you sync the file yourself. It handles TOTP codes, SSH agent integration and browser autofill through an extension.",
    features: ["Local KDBX database, no cloud account", "Built-in TOTP generator", "SSH agent integration", "Browser integration extension", "Auto-type into any application"],
    requirements: ["Windows 10 or 11", "200 MB free disk space"]
  },
  {
    name: "VeraCrypt", category: "windows", sub: "Security", price: "Free",
    site: "veracrypt.fr", version: "1.26.24", size: "38 MB", rating: 4.6, downloads: 28700,
    tags: ["encryption", "open source"],
    short: "Encrypts disks and creates hidden encrypted volumes.",
    long: "VeraCrypt creates encrypted containers that mount as ordinary drives, and can encrypt an entire system partition with pre-boot authentication. It is the maintained successor to TrueCrypt, with stronger key derivation and regular audits.",
    features: ["Full disk and container encryption", "Pre-boot authentication", "Hidden volumes with plausible deniability", "AES, Serpent, Twofish and cascades", "Portable mode"],
    requirements: ["Windows 10 or 11", "Administrator rights for system encryption"]
  },
  {
    name: "Emsisoft Emergency Kit", category: "windows", sub: "Security", price: "Free",
    site: "emsisoft.com", version: "2026.7", size: "380 MB", rating: 4.5, downloads: 19800,
    tags: ["antimalware", "portable"],
    short: "Portable malware scanner for a machine that is already infected.",
    long: "Emergency Kit runs from a USB stick without installation, which matters when malware blocks installers. It scans with Emsisoft's dual-engine detection and includes a command line scanner and a HiJackFree-style analysis tool for stubborn cases.",
    features: ["Runs without installation", "Dual-engine malware detection", "Command line scanner", "Startup and process analysis tools", "Free for personal use"],
    requirements: ["Windows 10 or 11", "USB stick or 1 GB free disk space"]
  },
  {
    name: "Snappy Driver Installer Origin", category: "windows", sub: "Drivers", price: "Free",
    site: "sdi-tool.org", version: "1.12.6", size: "24 MB", rating: 4.5, downloads: 24600,
    tags: ["drivers", "offline"],
    short: "Installs drivers without an internet connection.",
    long: "Snappy Driver Installer Origin works from downloadable driver packs, so a freshly installed machine with no network driver can still be brought online. It is open source, carries no bundled software and can run entirely from a USB stick.",
    features: ["Full offline driver packs", "Portable, no installation", "Restore points before installing", "Open source, no bundled offers", "Driver pack updates via torrent or HTTP"],
    requirements: ["Windows 10 or 11", "Driver packs need 20+ GB for the full set"]
  },
  {
    name: "Display Driver Uninstaller", category: "windows", sub: "Drivers", price: "Free",
    site: "wagnardsoft.com", version: "18.0.9", size: "14 MB", rating: 4.8, downloads: 36700,
    tags: ["drivers", "gpu"],
    short: "Removes every trace of a graphics driver before a clean install.",
    long: "DDU strips NVIDIA, AMD and Intel display drivers together with the registry keys, folders and leftovers a normal uninstall leaves behind. It is the standard first step when a driver update leaves a system unstable, and is meant to be run in safe mode.",
    features: ["Clean removal for NVIDIA, AMD and Intel", "Safe mode workflow", "Prevents automatic driver reinstallation", "Log of everything removed", "Portable"],
    requirements: ["Windows 10 or 11", "Safe mode recommended"]
  },
  {
    name: "NVIDIA App", category: "windows", sub: "Drivers", price: "Free",
    site: "nvidia.com", version: "11.0", size: "180 MB", rating: 4.3, downloads: 88400,
    tags: ["drivers", "gpu", "nvidia"],
    short: "Driver updates, game settings and capture for NVIDIA GPUs.",
    long: "The NVIDIA App replaced GeForce Experience and Control Panel: it installs drivers, exposes per-game graphics settings, and provides the in-game overlay with performance monitoring, instant replay and filters, without requiring an account.",
    features: ["Driver updates without an account", "In-game performance overlay", "Instant replay and recording", "Per-game optimal settings", "Freestyle filters and RTX features"],
    requirements: ["Windows 10 or 11 (64-bit)", "GeForce GTX 900 series or newer"]
  },
  {
    name: "7-Zip", category: "windows", sub: "Utilities", price: "Free",
    site: "7-zip.org", version: "25.01", size: "1.6 MB", rating: 4.9, downloads: 152300,
    tags: ["archive", "open source"],
    short: "Archiver with strong compression and support for every common format.",
    long: "7-Zip packs and unpacks 7z, ZIP, TAR, GZIP and RAR among others, with AES-256 encryption for 7z and ZIP archives. Its own 7z format usually compresses noticeably better than ZIP, and the whole thing is a 1.6 MB open-source download.",
    features: ["Reads and writes a dozen archive formats", "AES-256 encrypted archives", "Split archives into volumes", "Shell integration and context menu", "Command line version included"],
    requirements: ["Windows 10 or 11", "10 MB free disk space"]
  },
  {
    name: "Notepad++", category: "windows", sub: "Utilities", price: "Free",
    site: "notepad-plus-plus.org", version: "8.7.6", size: "5 MB", rating: 4.8, downloads: 118900,
    tags: ["editor", "open source"],
    short: "Fast text and code editor with syntax highlighting for 80+ languages.",
    long: "Notepad++ opens large files quickly, highlights syntax for dozens of languages, and supports multi-caret editing, macros, column selection and regular-expression search across files. A plugin ecosystem covers formatting, comparison and FTP editing.",
    features: ["Syntax highlighting for 80+ languages", "Multi-caret and column editing", "Find and replace across files with regex", "Macro recording", "Plugin manager"],
    requirements: ["Windows 10 or 11", "50 MB free disk space"]
  },
  {
    name: "Microsoft PowerToys", category: "windows", sub: "Utilities", price: "Free",
    site: "learn.microsoft.com", version: "0.92", size: "220 MB", rating: 4.8, downloads: 92600,
    tags: ["utilities", "microsoft", "open source"],
    short: "A set of power-user utilities Microsoft ships as open source.",
    long: "PowerToys bundles utilities Windows itself lacks: FancyZones window layouts, PowerToys Run as a launcher, PowerRename for bulk renaming, a colour picker, an always-on-top toggle, text extraction from the screen and more, each switchable on its own.",
    features: ["FancyZones window management", "PowerToys Run launcher", "Bulk rename with regex", "Text extractor and colour picker", "Keyboard remapping"],
    requirements: ["Windows 10 (2004) or Windows 11", "x64 or ARM64"]
  },
  {
    name: "Everything", category: "windows", sub: "Utilities", price: "Free",
    site: "voidtools.com", version: "1.4.1", size: "2 MB", rating: 4.9, downloads: 67800,
    tags: ["search", "files"],
    short: "Instant filename search across every NTFS drive.",
    long: "Everything builds its index from the NTFS master file table, so it lists every file on a machine in seconds and filters as you type with no perceptible delay. It supports regular expressions, an HTTP and FTP server, and a command line interface.",
    features: ["Whole-drive index built in seconds", "Results filter as you type", "Regular expression search", "HTTP and FTP server mode", "Tiny footprint"],
    requirements: ["Windows 10 or 11", "NTFS drives"]
  },
  {
    name: "Rufus", category: "windows", sub: "Utilities", price: "Free",
    site: "rufus.ie", version: "4.7", size: "1.5 MB", rating: 4.8, downloads: 84200,
    tags: ["usb", "installer", "open source"],
    short: "Creates bootable USB drives from ISO images.",
    long: "Rufus writes Windows and Linux ISOs to a USB stick and is generally the fastest tool for the job. For Windows 11 it can strip the TPM, Secure Boot and account requirements at write time, and it verifies checksums before writing.",
    features: ["Bootable USB from any ISO", "Windows 11 requirement bypasses", "MBR and GPT, BIOS and UEFI", "Checksum verification", "Portable single executable"],
    requirements: ["Windows 10 or 11", "USB drive"]
  },
  {
    name: "HWiNFO", category: "windows", sub: "Utilities", price: "Free",
    site: "hwinfo.com", version: "8.24", size: "12 MB", rating: 4.8, downloads: 51300,
    tags: ["monitoring", "hardware"],
    short: "Reads every sensor the hardware exposes.",
    long: "HWiNFO reports the full hardware inventory and reads temperatures, clocks, voltages, fan speeds and power draw from every sensor a board exposes. Readings can be logged to CSV or pushed to an overlay, which makes it the usual companion for stability testing.",
    features: ["Complete hardware inventory", "Live sensor monitoring", "CSV logging for long runs", "Alerts on thresholds", "Feeds overlays such as RTSS"],
    requirements: ["Windows 10 or 11", "No installation required (portable build)"]
  },
  {
    name: "CrystalDiskInfo", category: "windows", sub: "Utilities", price: "Free",
    site: "crystalmark.info", version: "9.6.3", size: "6 MB", rating: 4.7, downloads: 43900,
    tags: ["storage", "smart"],
    short: "Shows drive health from S.M.A.R.T. data before a disk fails.",
    long: "CrystalDiskInfo reads S.M.A.R.T. attributes from HDDs, SSDs and NVMe drives and turns them into a plain health verdict, with temperature, power-on hours and written data. It can warn by email when an attribute crosses a threshold.",
    features: ["Health status for HDD, SSD and NVMe", "Temperature and power-on hours", "Threshold alerts", "Written-data totals for SSD wear", "Portable build"],
    requirements: ["Windows 10 or 11"]
  },

  // ------------------------------------------------------------------- Game
  {
    name: "MSI Afterburner", category: "game", sub: "Overlays", price: "Free",
    site: "msi.com", version: "4.6.6", size: "58 MB", rating: 4.7, downloads: 112400,
    tags: ["overclocking", "monitoring", "overlay"],
    short: "Graphics card overclocking with an in-game monitoring overlay.",
    long: "Afterburner tunes GPU clocks, voltage and fan curves on cards from any vendor, and ships with RivaTuner Statistics Server for the on-screen display that shows frame rate, frame times, temperatures and utilisation while you play.",
    features: ["Clock, voltage and fan curve control", "On-screen display via RTSS", "Frame time graphing", "Hardware monitoring and logging", "Custom fan curves per temperature"],
    requirements: ["Windows 10 or 11", "Any modern AMD or NVIDIA GPU"]
  },
  {
    name: "CapFrameX", category: "game", sub: "Overlays", price: "Free",
    site: "capframex.com", version: "1.7.3", size: "72 MB", rating: 4.6, downloads: 21700,
    tags: ["benchmark", "frametimes", "open source"],
    short: "Captures and analyses frame times, not just average FPS.",
    long: "CapFrameX records frame time data through PresentMon and turns it into the percentile statistics that actually describe smoothness: 1% and 0.1% lows, stutter percentage and frame time distribution, with comparison between runs and hardware.",
    features: ["Frame time capture via PresentMon", "1% and 0.1% low percentiles", "Run comparison and aggregation", "Sensor logging alongside frames", "Open source"],
    requirements: ["Windows 10 or 11 (64-bit)", ".NET runtime included in the installer"]
  },
  {
    name: "FPS Monitor", category: "game", sub: "Overlays", price: "Paid",
    site: "fpsmon.com", version: "6.2", size: "26 MB", rating: 4.4, downloads: 18900,
    tags: ["overlay", "monitoring"],
    short: "Configurable hardware overlay designed for gameplay.",
    long: "FPS Monitor draws a fully customisable overlay of frame rate, CPU and GPU load, temperatures and RAM usage over any game, and logs the same data to file. Layouts are drag-and-drop, so the HUD shows only the sensors you care about.",
    features: ["Drag-and-drop overlay designer", "Frame rate and full sensor readout", "Session logging and reports", "Alerts on overheating", "Works with DirectX and Vulkan titles"],
    requirements: ["Windows 10 or 11", "DirectX 11, 12 or Vulkan"]
  },
  {
    name: "OBS Studio", category: "game", sub: "Recording", price: "Free",
    site: "obsproject.com", version: "31.1", size: "140 MB", rating: 4.9, downloads: 164800,
    tags: ["recording", "streaming", "open source"],
    short: "The standard open-source recorder and streaming studio.",
    long: "OBS Studio composes scenes from game captures, cameras, browsers and images, records them locally and streams to any RTMP or WHIP service. Hardware encoding on NVIDIA, AMD and Intel keeps the performance cost low, and a large plugin ecosystem covers the rest.",
    features: ["Scene composition with unlimited sources", "Hardware encoding (NVENC, AMF, QuickSync)", "Streaming to any RTMP or WHIP service", "Replay buffer for instant clips", "Plugin and script ecosystem"],
    requirements: ["Windows 10 or 11 (64-bit)", "DirectX 11 capable GPU", "4 GB RAM"]
  },
  {
    name: "ShareX", category: "game", sub: "Recording", price: "Free",
    site: "getsharex.com", version: "17.1", size: "38 MB", rating: 4.8, downloads: 71200,
    tags: ["screenshots", "capture", "open source"],
    short: "Screenshot and screen recording tool with automated workflows.",
    long: "ShareX captures regions, windows, scrolling pages or video, then runs whatever workflow you configure: annotate, watermark, upload to a destination and copy the link to the clipboard. It supports dozens of upload targets, including custom ones.",
    features: ["Region, window and scrolling capture", "GIF and video recording", "Built-in annotation editor", "Automated post-capture workflows", "80+ upload destinations"],
    requirements: ["Windows 10 or 11", ".NET runtime"]
  },
  {
    name: "Bandicam", category: "game", sub: "Recording", price: "Freemium",
    site: "bandicam.com", version: "8.2", size: "96 MB", rating: 4.3, downloads: 44100,
    tags: ["recording", "capture"],
    short: "Lightweight recorder for games, screen regions and devices.",
    long: "Bandicam records a game, a screen region or an external device with hardware acceleration, keeping the performance hit small even at high resolutions. Recordings can include webcam overlay, microphone mixing and drawing while recording.",
    features: ["Game, screen and device capture modes", "Hardware accelerated encoding", "Webcam overlay and mic mixing", "Scheduled recording", "Real-time drawing"],
    requirements: ["Windows 10 or 11", "DirectX 9 or later"]
  },
  {
    name: "Cheat Engine", category: "game", sub: "Trainers", price: "Free",
    site: "cheatengine.org", version: "7.6", size: "42 MB", rating: 4.4, downloads: 76300,
    tags: ["memory", "debugging", "open source"],
    short: "Open-source memory scanner and debugger for single-player games.",
    long: "Cheat Engine scans and edits the memory of a running process, with a debugger, disassembler and Lua scripting on top. It is widely used to modify single-player games and to learn reverse engineering. Using it in online games breaks their terms of service and gets accounts banned.",
    features: ["Memory scanning and editing", "Built-in debugger and disassembler", "Lua scripting and trainer generator", "Pointer scanning", "Open source"],
    requirements: ["Windows 10 or 11", "Single-player titles only"]
  },
  {
    name: "WeMod", category: "game", sub: "Trainers", price: "Freemium",
    site: "wemod.com", version: "9.4", size: "120 MB", rating: 4.2, downloads: 63500,
    tags: ["trainers", "single player"],
    short: "Ready-made trainers for thousands of single-player games.",
    long: "WeMod maintains curated trainers for single-player titles and applies them without manual memory editing: pick a game, toggle the options you want, launch. The catalogue is maintained per game version. Online and competitive titles are deliberately out of scope.",
    features: ["Curated trainers for 3000+ games", "Automatic game detection", "Per-version updates", "Controller and hotkey support", "Single-player titles only"],
    requirements: ["Windows 10 or 11 (64-bit)", "Account required"]
  },
  {
    name: "Vortex", category: "game", sub: "Mods", price: "Free",
    site: "nexusmods.com", version: "1.14", size: "180 MB", rating: 4.3, downloads: 58200,
    tags: ["mods", "nexus"],
    short: "Nexus Mods' official manager for installing and ordering mods.",
    long: "Vortex installs mods from Nexus Mods, resolves conflicts through a rule system and sorts load order automatically with LOOT for supported games. Profiles keep separate mod sets for the same game, and deployment is reversible.",
    features: ["One-click install from Nexus Mods", "Automatic load order sorting", "Conflict resolution rules", "Profiles per playthrough", "Reversible deployment"],
    requirements: ["Windows 10 or 11", "Nexus Mods account for downloads"]
  },
  {
    name: "Mod Organizer 2", category: "game", sub: "Mods", price: "Free",
    site: "github.com", version: "2.5.2", size: "94 MB", rating: 4.7, downloads: 39700,
    tags: ["mods", "bethesda", "open source"],
    short: "Virtual file system mod manager that never touches the game folder.",
    long: "Mod Organizer 2 keeps every mod in its own folder and presents them to the game through a virtual file system, so the installation stays clean and a broken mod can be disabled instantly. It is the usual choice for heavily modded Bethesda titles.",
    features: ["Virtual file system, clean game folder", "Per-profile mod sets and load orders", "Conflict view down to individual files", "Integrated LOOT sorting", "Open source"],
    requirements: ["Windows 10 or 11 (64-bit)", "Supported games: Skyrim, Fallout, Starfield and others"]
  },
  {
    name: "Special K", category: "game", sub: "Overlays", price: "Free",
    site: "special-k.info", version: "24.9", size: "48 MB", rating: 4.5, downloads: 22800,
    tags: ["framerate", "hdr", "open source"],
    short: "Frame rate limiter and rendering fixes injected into games.",
    long: "Special K sits between a game and its graphics API to fix what the game got wrong: a much more accurate frame rate limiter than most in-game options, HDR retrofits for SDR titles, input remapping and texture management, all configurable per game.",
    features: ["Precise frame rate limiting", "HDR retrofit for SDR games", "Latency reduction", "Texture and shader management", "Per-game configuration profiles"],
    requirements: ["Windows 10 or 11", "DirectX 11, 12 or Vulkan"]
  },
  {
    name: "DS4Windows", category: "game", sub: "Utilities", price: "Free",
    site: "ds4-windows.com", version: "3.7", size: "34 MB", rating: 4.6, downloads: 47600,
    tags: ["controller", "input", "open source"],
    short: "Makes PlayStation controllers work as Xbox controllers on PC.",
    long: "DS4Windows presents a DualShock 4 or DualSense pad to Windows as an Xbox controller, so games that only understand XInput accept it. It also exposes touchpad, gyro and lightbar, and supports per-game profiles with custom mappings and macros.",
    features: ["DualShock 4 and DualSense support", "XInput emulation for any game", "Gyro and touchpad mapping", "Per-game profiles", "Macros and shift modifiers"],
    requirements: ["Windows 10 or 11", "ViGEmBus driver (installed by the setup)"]
  },

  // ----------------------------------------------------------------- Roblox
  {
    name: "Roblox Studio", category: "roblox", sub: "Studio", price: "Free",
    site: "create.roblox.com", version: "2026.8", size: "1.2 GB", rating: 4.4, downloads: 143700,
    tags: ["studio", "official"],
    short: "The official editor for building and publishing Roblox experiences.",
    long: "Roblox Studio is the first-party environment for building experiences: terrain and part editing, the Luau script editor, physics and lighting preview, team create for collaborative editing, and one-click publishing with analytics for the published place.",
    features: ["Terrain, part and model editing", "Luau script editor with debugger", "Team Create collaboration", "Play and device emulation", "Publishing and analytics"],
    requirements: ["Windows 10 or 11, or macOS 13+", "4 GB RAM", "Roblox account"]
  },
  {
    name: "Rojo", category: "roblox", sub: "Studio", price: "Free",
    site: "rojo.space", version: "7.5", size: "8 MB", rating: 4.8, downloads: 26400,
    tags: ["workflow", "git", "open source"],
    short: "Builds Roblox projects from files on disk, so Git can track them.",
    long: "Rojo syncs a project structured as files and folders into Roblox Studio, which lets a team use a real editor, code review and version control instead of editing inside a place file. Changes appear live in Studio while the server runs.",
    features: ["Live sync from disk into Studio", "Projects as plain files for Git", "Builds place and model files from source", "Works with any editor", "Open source"],
    requirements: ["Windows, macOS or Linux", "Roblox Studio", "Command line familiarity"]
  },
  {
    name: "Argon", category: "roblox", sub: "Studio", price: "Free",
    site: "argon.wiki", version: "2.0.24", size: "12 MB", rating: 4.6, downloads: 14200,
    tags: ["vscode", "workflow", "open source"],
    short: "Two-way sync between Visual Studio Code and Roblox Studio.",
    long: "Argon extends the file-sync idea with two-way synchronisation: changes made in Studio flow back to disk, not just the other way around. It ships as a VS Code extension with project scaffolding, a built-in Rojo-compatible format and sourcemap generation.",
    features: ["Two-way sync with Studio", "VS Code extension", "Rojo-compatible projects", "Sourcemap generation for type checking", "Project templates"],
    requirements: ["Visual Studio Code", "Roblox Studio"]
  },
  {
    name: "StyLua", category: "roblox", sub: "Studio", price: "Free",
    site: "github.com", version: "2.1", size: "4 MB", rating: 4.8, downloads: 17800,
    tags: ["formatter", "luau", "open source"],
    short: "Opinionated code formatter for Lua and Luau.",
    long: "StyLua formats Lua and Luau to one consistent style, which ends formatting arguments in a team and keeps diffs about behaviour rather than whitespace. It runs from the command line, in CI, or on save through editor extensions.",
    features: ["Deterministic formatting for Luau", "Editor integration and format on save", "CI check mode", "Configurable line width and indentation", "Open source"],
    requirements: ["Windows, macOS or Linux", "Command line"]
  },
  {
    name: "Selene", category: "roblox", sub: "Studio", price: "Free",
    site: "kampfkarren.github.io", version: "0.28", size: "5 MB", rating: 4.7, downloads: 12600,
    tags: ["linter", "luau", "open source"],
    short: "Linter that catches Lua and Luau mistakes before they ship.",
    long: "Selene analyses Lua and Luau for the errors that a compiler would not catch: unused variables, shadowing, incorrect standard library usage and Roblox-specific pitfalls. A Roblox standard library definition ships with it.",
    features: ["Roblox-aware lint rules", "Custom standard library definitions", "Editor and CI integration", "Fast, written in Rust", "Open source"],
    requirements: ["Windows, macOS or Linux", "Command line"]
  },
  {
    name: "Wally", category: "roblox", sub: "Studio", price: "Free",
    site: "wally.run", version: "0.3.2", size: "6 MB", rating: 4.6, downloads: 11400,
    tags: ["packages", "dependencies", "open source"],
    short: "Package manager for Roblox projects.",
    long: "Wally brings dependency management to Roblox development: declare packages in a manifest, install pinned versions into your project and share your own libraries through the public registry. It works alongside Rojo in a file-based workflow.",
    features: ["Manifest-based dependencies", "Version pinning with a lockfile", "Public package registry", "Private registries supported", "Works with Rojo projects"],
    requirements: ["Windows, macOS or Linux", "Rojo-style project layout"]
  },
  {
    name: "Aftman", category: "roblox", sub: "Utilities", price: "Free",
    site: "github.com", version: "0.3", size: "5 MB", rating: 4.5, downloads: 9800,
    tags: ["toolchain", "open source"],
    short: "Installs and pins the command line tools a project needs.",
    long: "Aftman reads a project manifest and installs the exact versions of Rojo, Wally, StyLua and other tools that the project expects, so every contributor and the CI runner use the same versions without manual setup.",
    features: ["Per-project tool versions", "Global tool installation", "Reproducible setups across a team", "Works on Windows, macOS and Linux", "Open source"],
    requirements: ["Command line", "Internet access for the first install"]
  },
  {
    name: "Lune", category: "roblox", sub: "Utilities", price: "Free",
    site: "lune-org.github.io", version: "0.9", size: "18 MB", rating: 4.6, downloads: 8600,
    tags: ["luau", "runtime", "open source"],
    short: "Runs Luau scripts outside Roblox, for tooling and tests.",
    long: "Lune is a standalone Luau runtime with libraries for the filesystem, network, processes and Roblox place files. It lets a team run tests, build steps and asset pipelines in the same language the game is written in.",
    features: ["Standalone Luau runtime", "Reads and writes Roblox place and model files", "Filesystem, network and process APIs", "Useful for CI and build scripts", "Open source"],
    requirements: ["Windows, macOS or Linux", "Command line"]
  },
  {
    name: "Blender", category: "roblox", sub: "Assets", price: "Free",
    site: "blender.org", version: "4.5 LTS", size: "410 MB", rating: 4.9, downloads: 187600,
    tags: ["3d", "modelling", "open source"],
    short: "Full 3D suite for the models, rigs and animations you import.",
    long: "Blender covers modelling, sculpting, UV unwrapping, texturing, rigging and animation, and exports FBX and OBJ that Roblox Studio imports directly. It is the standard free pipeline for custom meshes, characters and animations.",
    features: ["Modelling, sculpting and UV tools", "Rigging and animation", "FBX and OBJ export for Studio", "Texture painting and baking", "Huge library of community add-ons"],
    requirements: ["Windows 10 or 11, macOS or Linux", "8 GB RAM recommended", "GPU with OpenGL 4.3"]
  },
  {
    name: "Audacity", category: "roblox", sub: "Assets", price: "Free",
    site: "audacityteam.org", version: "3.7.4", size: "68 MB", rating: 4.6, downloads: 96400,
    tags: ["audio", "editing", "open source"],
    short: "Audio editor for cleaning up the sounds you upload.",
    long: "Audacity records and edits audio: trimming, normalising, noise reduction and format conversion, which is what most game sound work needs before an upload. It exports to the formats Roblox accepts and handles long files comfortably.",
    features: ["Multi-track recording and editing", "Noise reduction and normalisation", "Format conversion and export", "Spectrogram view", "Open source"],
    requirements: ["Windows 10 or 11, macOS or Linux", "2 GB RAM"]
  },

  // ---------------------------------------------------------------- Crypto
  {
    name: "Exodus", category: "crypto", sub: "Wallets", price: "Free",
    site: "exodus.com", version: "25.9", size: "96 MB", rating: 4.5, downloads: 88300,
    tags: ["wallet", "multichain"],
    short: "Multi-chain desktop and mobile wallet with a built-in exchange.",
    long: "Exodus is a self-custody wallet covering a wide set of chains from one interface, with an integrated swap provider, staking for supported assets and Trezor hardware pairing. Keys stay on the device; there is no account.",
    features: ["Dozens of chains in one wallet", "Built-in swaps", "Staking for supported assets", "Trezor hardware pairing", "Desktop, mobile and browser extension"],
    requirements: ["Windows 10+, macOS 13+ or Linux", "4 GB RAM"]
  },
  {
    name: "Electrum", category: "crypto", sub: "Wallets", price: "Free",
    site: "electrum.org", version: "4.6", size: "34 MB", rating: 4.7, downloads: 52700,
    tags: ["bitcoin", "wallet", "open source"],
    short: "Long-standing Bitcoin-only wallet built for control.",
    long: "Electrum is a Bitcoin wallet that syncs against remote servers instead of downloading the chain, so it starts in seconds. It supports hardware wallets, multisig, coin control, custom fees and PSBT, which makes it a common choice for people who want precise control over their transactions.",
    features: ["Fast start, no full chain download", "Hardware wallet support", "Multisig and PSBT", "Coin control and custom fees", "Connect to your own node"],
    requirements: ["Windows 10+, macOS or Linux", "Bitcoin only"]
  },
  {
    name: "Sparrow Wallet", category: "crypto", sub: "Wallets", price: "Free",
    site: "sparrowwallet.com", version: "2.2.2", size: "128 MB", rating: 4.8, downloads: 31900,
    tags: ["bitcoin", "privacy", "open source"],
    short: "Bitcoin wallet focused on privacy and transparency.",
    long: "Sparrow shows exactly what a transaction does before it is signed: inputs, outputs, fees and privacy implications. It connects to your own node or an Electrum server, supports every common hardware wallet, and treats coin control and labelling as first-class features.",
    features: ["Full transaction detail before signing", "Connects to your own node", "All major hardware wallets", "Coin control with labels", "PSBT and multisig"],
    requirements: ["Windows 10+, macOS 13+ or Linux", "Bitcoin only"]
  },
  {
    name: "Ledger Live", category: "crypto", sub: "Wallets", price: "Free",
    site: "ledger.com", version: "2.98", size: "142 MB", rating: 4.2, downloads: 74100,
    tags: ["hardware", "wallet"],
    short: "Companion application for Ledger hardware wallets.",
    long: "Ledger Live installs device firmware and chain applications, shows a consolidated portfolio, and prepares transactions that the hardware device signs. Private keys never leave the device, so the desktop application only ever handles public data and unsigned transactions.",
    features: ["Device firmware and app management", "Portfolio across accounts and chains", "Staking for supported assets", "Buy, sell and swap through partners", "Keys never leave the device"],
    requirements: ["Windows 10+, macOS 13+ or Linux", "A Ledger hardware wallet"]
  },
  {
    name: "Trezor Suite", category: "crypto", sub: "Wallets", price: "Free",
    site: "trezor.io", version: "25.8", size: "156 MB", rating: 4.4, downloads: 38600,
    tags: ["hardware", "wallet", "open source"],
    short: "Open-source desktop application for Trezor devices.",
    long: "Trezor Suite manages Trezor hardware wallets: firmware updates, account discovery, coin control and Tor routing for connections. The whole application is open source, and it can talk to your own Bitcoin node instead of Trezor's backends.",
    features: ["Open source, auditable client", "Tor routing built in", "Coin control and labelling", "Your own backend node supported", "Firmware and device management"],
    requirements: ["Windows 10+, macOS 13+ or Linux", "A Trezor hardware wallet"]
  },
  {
    name: "MetaMask", category: "crypto", sub: "Wallets", price: "Free",
    site: "metamask.io", version: "12.9", size: "24 MB", rating: 4.1, downloads: 128900,
    tags: ["ethereum", "wallet", "browser"],
    short: "Browser wallet for Ethereum and EVM networks.",
    long: "MetaMask is the browser extension most Ethereum applications expect: it holds keys locally, signs transactions from web applications, and supports any EVM network you add. Hardware wallets can be connected so the extension never holds the key material.",
    features: ["Works with any EVM network", "Connects to web3 applications", "Hardware wallet support", "Swaps and bridging", "Extension and mobile app"],
    requirements: ["Chrome, Firefox, Edge or Brave", "Mobile app available"]
  },
  {
    name: "Rabby Wallet", category: "crypto", sub: "Wallets", price: "Free",
    site: "rabby.io", version: "0.92", size: "28 MB", rating: 4.6, downloads: 34200,
    tags: ["ethereum", "wallet", "open source"],
    short: "EVM wallet that explains what a transaction will actually do.",
    long: "Rabby simulates every transaction before signing and shows the resulting balance changes and risk warnings in plain language, which catches drainer approvals that a raw signature request hides. It switches networks automatically to match the site you are on.",
    features: ["Pre-sign transaction simulation", "Risk warnings for approvals", "Automatic network switching", "Multi-chain address book", "Open source"],
    requirements: ["Chrome, Edge or Brave", "Desktop application available"]
  },
  {
    name: "Rotki", category: "crypto", sub: "Analytics", price: "Freemium",
    site: "rotki.com", version: "1.36", size: "180 MB", rating: 4.5, downloads: 16800,
    tags: ["portfolio", "privacy", "open source"],
    short: "Portfolio tracker and accounting tool that runs locally.",
    long: "Rotki keeps portfolio and tax accounting data in a local encrypted database instead of a vendor's cloud. It imports from exchanges and on-chain addresses, computes profit and loss under several accounting methods, and never uploads holdings anywhere.",
    features: ["Local encrypted database", "Exchange and blockchain imports", "Profit and loss accounting reports", "DeFi position tracking", "Open source"],
    requirements: ["Windows 10+, macOS or Linux", "4 GB RAM"]
  },
  {
    name: "CoinStats", category: "crypto", sub: "Analytics", price: "Freemium",
    site: "coinstats.app", version: "5.12", size: "112 MB", rating: 4.3, downloads: 67400,
    tags: ["portfolio", "tracker"],
    short: "Portfolio tracker that connects exchanges and wallets in one view.",
    long: "CoinStats aggregates balances from hundreds of exchanges and wallets into a single portfolio, with performance charts, DeFi positions, NFT holdings, alerts and tax-ready exports. Connections can be read-only API keys or public addresses.",
    features: ["300+ exchange and wallet connections", "DeFi and NFT tracking", "Price and portfolio alerts", "Tax report exports", "Desktop, web and mobile"],
    requirements: ["Windows 10+, macOS or web browser", "Account required"]
  },
  {
    name: "Zerion", category: "crypto", sub: "Analytics", price: "Free",
    site: "zerion.io", version: "2.14", size: "32 MB", rating: 4.5, downloads: 29800,
    tags: ["defi", "portfolio"],
    short: "Reads DeFi positions straight from the chain.",
    long: "Zerion connects to wallet addresses and decodes what they hold across DeFi: liquidity positions, staking, lending and yield strategies that generic trackers report as unknown tokens. It works read-only from a public address, no keys needed.",
    features: ["Decodes DeFi positions across protocols", "Read-only tracking by address", "Multi-chain coverage", "Transaction history in plain language", "Wallet extension and mobile app"],
    requirements: ["Browser extension or mobile app", "A wallet address to watch"]
  },
  {
    name: "DeBank", category: "crypto", sub: "Analytics", price: "Free",
    site: "debank.com", version: "web", size: "—", rating: 4.4, downloads: 41300,
    tags: ["defi", "portfolio", "web"],
    short: "DeFi portfolio dashboard covering most EVM chains.",
    long: "DeBank shows what an address holds across EVM chains, including positions inside lending markets, DEX pools and staking contracts, plus a readable history of its transactions and approvals. Token approvals can be reviewed and revoked from the same page.",
    features: ["Portfolio across most EVM chains", "Protocol-level position breakdown", "Approval review and revoking", "Readable transaction history", "Follow other addresses"],
    requirements: ["Any modern browser", "A wallet address to watch"]
  },
  {
    name: "TradingView", category: "crypto", sub: "Trading", price: "Freemium",
    site: "tradingview.com", version: "2.9 (desktop)", size: "148 MB", rating: 4.7, downloads: 152800,
    tags: ["charts", "trading"],
    short: "Charting platform used across crypto and traditional markets.",
    long: "TradingView provides the charting most traders standardise on: hundreds of indicators, drawing tools, custom Pine Script studies, alerts and multi-chart layouts, with a desktop application that keeps the layouts local and supports multiple monitors.",
    features: ["Hundreds of indicators and drawing tools", "Pine Script custom indicators", "Price and indicator alerts", "Multi-chart layouts", "Desktop, web and mobile"],
    requirements: ["Windows 10+, macOS or Linux", "Account for saved layouts"]
  },
  {
    name: "Bitcoin Core", category: "crypto", sub: "Trading", price: "Free",
    site: "bitcoincore.org", version: "29.0", size: "42 MB", rating: 4.6, downloads: 44700,
    tags: ["node", "bitcoin", "open source"],
    short: "The reference Bitcoin implementation, run as your own node.",
    long: "Bitcoin Core validates the entire chain independently, which is what lets a wallet trust its own view of the network rather than someone else's server. It includes a wallet, an RPC interface for other tools, and can back Electrum or Sparrow as their backend.",
    features: ["Full chain validation", "Wallet with descriptor support", "RPC interface for other applications", "Tor support", "Pruning for smaller disks"],
    requirements: ["Windows 10+, macOS or Linux", "600+ GB disk for a full node, 10 GB pruned", "2 GB RAM"]
  },
  {
    name: "Revoke.cash", category: "crypto", sub: "Security", price: "Free",
    site: "revoke.cash", version: "web", size: "—", rating: 4.7, downloads: 36900,
    tags: ["approvals", "security", "web"],
    short: "Reviews and revokes the token approvals a wallet has granted.",
    long: "Every approval a wallet signs stays live until revoked, and stale approvals are how a large share of drains happen. Revoke.cash lists what each address has approved across chains and lets you cancel any of them from one page.",
    features: ["Approvals across many chains", "Revoke in a few clicks", "Works with hardware wallets", "Read-only inspection of any address", "Open source"],
    requirements: ["Any modern browser", "Wallet connection to revoke"]
  },

  // --------------------------------------------------- Game, per title
  {
    name: "OpenIV", category: "game", sub: "Mods", price: "Free",
    site: "openiv.com", version: "4.1", size: "42 MB", rating: 4.7, downloads: 68400,
    tags: ["gta", "modding", "editor"],
    short: "Archive editor and mod installer for GTA V and GTA IV.",
    long: "OpenIV opens the game's own archives so textures, models, vehicles and scripts can be replaced, and installs mods into a separate mods folder that leaves the original files untouched. It is the foundation most GTA V single-player modding builds on. Rockstar bans modified clients in GTA Online, so keep it to single player.",
    features: ["Reads and edits RPF game archives", "mods folder keeps original files intact", "Texture, model and script editing", "Package installer for mod archives", "GTA V, GTA IV and Max Payne 3"],
    requirements: ["Windows 10 or 11", "A legal copy of the game", "Single player only"]
  },
  {
    name: "Script Hook V", category: "game", sub: "Mods", price: "Free",
    site: "dev-c.com", version: "1.0.3570.1", size: "2 MB", rating: 4.6, downloads: 74200,
    tags: ["gta", "modding", "scripting"],
    short: "Runs custom .asi scripts in GTA V single player.",
    long: "Script Hook V exposes the game's native functions to custom scripts, which is what almost every GTA V single-player mod is built on. It ships with a trainer for testing. It disables itself in GTA Online, and Rockstar bans modified clients there.",
    features: ["Native function access for .asi scripts", "Bundled single-player trainer", "Required by most GTA V mods", "Updated for each game patch", "Disabled in online mode"],
    requirements: ["Windows 10 or 11", "GTA V for PC", "Single player only"]
  },
  {
    name: "FiveM", category: "game", sub: "Utilities", price: "Free",
    site: "fivem.net", version: "1.0", size: "180 MB", rating: 4.5, downloads: 96700,
    tags: ["gta", "multiplayer", "roleplay"],
    short: "Community multiplayer platform for GTA V, run by Cfx.re.",
    long: "FiveM runs its own servers, separate from GTA Online, where communities build roleplay and custom game modes with their own scripts and assets. It is operated by Cfx.re, which Rockstar acquired in 2023, so it is a sanctioned way to play modified multiplayer.",
    features: ["Custom servers separate from GTA Online", "Roleplay and custom game modes", "Server-side scripting and assets", "Built-in server browser", "Operated by Cfx.re under Rockstar"],
    requirements: ["Windows 10 or 11", "A legal copy of GTA V", "Rockstar Games account"]
  },
  {
    name: "CS Demo Manager", category: "game", sub: "Utilities", price: "Free",
    site: "cs-demo-manager.com", version: "3.6", size: "210 MB", rating: 4.7, downloads: 31800,
    tags: ["cs2", "demos", "open source"],
    short: "Analyses Counter-Strike demos: rounds, duels, heatmaps and stats.",
    long: "CS Demo Manager parses CS2 and CS:GO demos into readable statistics: per-round economy, duels, utility damage, weapon accuracy and 2D playback with heatmaps. Sequences can be exported to video for review clips, and matches are searchable across your whole demo library.",
    features: ["Round, duel and utility statistics", "2D playback with heatmaps", "Export sequences to video", "Match and player search across a demo library", "Open source"],
    requirements: ["Windows 10 or 11, macOS or Linux", "Counter-Strike installed for playback"]
  },
  {
    name: "Half-Life Advanced Effects", category: "game", sub: "Recording", price: "Free",
    site: "advancedfx.org", version: "2.156", size: "34 MB", rating: 4.5, downloads: 18600,
    tags: ["cs2", "recording", "open source"],
    short: "Camera control and frame capture for Source engine movie making.",
    long: "HLAE is the toolkit behind most Counter-Strike frag movies: smooth camera paths, free camera, depth and mask passes, and lossless frame capture for compositing. It works alongside demo playback rather than modifying the game.",
    features: ["Free camera and camera path editor", "Lossless frame and audio capture", "Depth, mask and matte passes", "Works with demo playback", "Open source"],
    requirements: ["Windows 10 or 11", "Counter-Strike 2 or a Source game"]
  },
  {
    name: "Blitz", category: "game", sub: "Utilities", price: "Freemium",
    site: "blitz.gg", version: "3.24", size: "160 MB", rating: 4.2, downloads: 84300,
    tags: ["valorant", "stats", "overlay"],
    short: "Companion app with stats, lineups and post-match review.",
    long: "Blitz reads match history through the publisher's own interfaces and shows agent and map lineups, loadout economy and post-match breakdowns for Valorant, League of Legends and several other titles. It is a companion overlay, not a game modification.",
    features: ["Match history and post-game analysis", "Agent, map and lineup guides", "Live overlay with round information", "Supports several titles from one app", "Free tier with no gameplay changes"],
    requirements: ["Windows 10 or 11", "Publisher account for match history"]
  },
  {
    name: "Tracker Network", category: "game", sub: "Utilities", price: "Freemium",
    site: "tracker.gg", version: "4.2", size: "120 MB", rating: 4.3, downloads: 71500,
    tags: ["fortnite", "stats", "overlay"],
    short: "Match statistics and overlay for Fortnite, Apex and more.",
    long: "The Tracker Network app records session performance across Fortnite, Apex Legends, Valorant and other titles, showing an in-game overlay with your live session and a history of matches, weapons and placements afterwards.",
    features: ["Live session overlay", "Match history across supported titles", "Weapon and placement breakdowns", "Session goals and trends", "Reads public match data only"],
    requirements: ["Windows 10 or 11", "Account on the supported game"]
  },
  {
    name: "Prism Launcher", category: "game", sub: "Mods", price: "Free",
    site: "prismlauncher.org", version: "9.4", size: "48 MB", rating: 4.8, downloads: 62900,
    tags: ["minecraft", "mods", "open source"],
    short: "Minecraft launcher that keeps every modpack in its own instance.",
    long: "Prism Launcher runs each Minecraft setup as an isolated instance with its own mods, version and Java settings, so a modpack can never break another. It installs Fabric, Forge, Quilt and NeoForge, and imports packs from CurseForge and Modrinth directly.",
    features: ["Isolated instances per modpack", "Fabric, Forge, Quilt and NeoForge", "CurseForge and Modrinth imports", "Per-instance Java and memory settings", "Open source, no telemetry"],
    requirements: ["Windows 10 or 11, macOS or Linux", "A Minecraft account", "Java (installed by the launcher)"]
  },
  {
    name: "Playnite", category: "game", sub: "Utilities", price: "Free",
    site: "playnite.link", version: "10.3", size: "96 MB", rating: 4.8, downloads: 57400,
    tags: ["library", "launchers", "open source"],
    short: "One library for Steam, Epic, GOG, Xbox and the rest.",
    long: "Playnite imports the libraries of every store and emulator you use into a single catalogue with artwork, playtime and metadata, and launches each game through its own client. There is a desktop mode and a fullscreen mode for a couch setup.",
    features: ["Imports Steam, Epic, GOG, Xbox, Ubisoft and more", "Emulator library support", "Automatic metadata and artwork", "Fullscreen mode with controller support", "Extensions and themes"],
    requirements: ["Windows 10 or 11", ".NET runtime included in the installer"]
  },
  {
    name: "Borderless Gaming", category: "game", sub: "Utilities", price: "Freemium",
    site: "github.com", version: "10.5", size: "3 MB", rating: 4.5, downloads: 39200,
    tags: ["window", "fullscreen", "open source"],
    short: "Turns a windowed game into borderless fullscreen.",
    long: "Borderless Gaming strips the border and title bar from a windowed game and stretches it to the display, which gives instant alt-tab without the flicker of exclusive fullscreen. Favourites are remembered and applied automatically when a game starts.",
    features: ["Borderless fullscreen for any window", "Automatic rules per game", "Multi-monitor aware", "No game files touched", "Open source"],
    requirements: ["Windows 10 or 11", ".NET runtime"]
  },
  {
    name: "Luau Language Server", category: "roblox", sub: "Studio", price: "Free",
    site: "github.com", version: "1.44", size: "16 MB", rating: 4.7, downloads: 13900,
    tags: ["luau", "vscode", "open source"],
    short: "Autocomplete, type checking and go-to-definition for Luau in VS Code.",
    long: "luau-lsp brings the editor features Roblox Studio has into VS Code: type checking against the Roblox API, autocomplete for instances from a sourcemap generated by Rojo, inlay hints and diagnostics as you type.",
    features: ["Roblox API type definitions", "Sourcemap-aware instance autocomplete", "Inline diagnostics and type errors", "Go to definition and hover docs", "Open source"],
    requirements: ["Visual Studio Code", "Rojo project for full instance awareness"]
  },
  {
    name: "Hoarcekat", category: "roblox", sub: "Studio", price: "Free",
    site: "github.com", version: "2.3", size: "2 MB", rating: 4.5, downloads: 7900,
    tags: ["ui", "plugin", "open source"],
    short: "Preview UI components in Studio without running the game.",
    long: "Hoarcekat is a Studio plugin that renders UI components in isolation from a story file, so an interface can be built and reviewed without playing through to the screen that shows it. It is the Roblox equivalent of a component storybook.",
    features: ["Renders components from story files", "No play-testing to reach a screen", "Live reload as the source changes", "Works with Roact, Fusion and plain UI", "Open source"],
    requirements: ["Roblox Studio", "Story files in the project"]
  },

  // ------------------------------------------------------- Roblox Executors
  {
    name: "Xeno Executor", category: "roblox-executors", sub: "Executors", price: "Free",
    site: "xeno.now", version: "1.3.60", size: "—", rating: 4.4, downloads: 73400,
    tags: ["roblox", "executor", "lua", "script-executor", "windows"],
    short: "Windows Roblox script executor listed with release and compatibility tracking.",
    long: "Xeno Executor is a third-party Windows utility associated with Roblox script execution. This listing records catalog metadata only; Roblox client updates can break compatibility and third-party executors can result in account action.",
    features: ["Lua script execution", "Keyless workflow", "Release tracking", "Windows desktop interface", "Compatibility notes"],
    requirements: ["Windows 10 or 11 (64-bit)", "Roblox installed", "Internet connection"]
  },
  {
    name: "Solara Executor", category: "roblox-executors", sub: "Executors", price: "Free",
    site: "solaraget.com", version: "3.221", size: "—", rating: 4.3, downloads: 68900,
    tags: ["roblox", "executor", "lua", "script-executor", "windows"],
    short: "Windows Roblox Lua executor with release and client compatibility notes.",
    long: "Solara Executor is a third-party Windows-focused Roblox Lua utility. The catalog tracks the advertised release rather than making claims about detection resistance or guaranteed compatibility.",
    features: ["Lua script execution", "Windows 10/11 support", "Release tracking", "Compatibility notes", "Compact desktop workflow"],
    requirements: ["Windows 10 or 11 (64-bit)", "Roblox installed", "Internet connection"]
  },
  {
    name: "Velocity Executor", category: "roblox-executors", sub: "Executors", price: "Free",
    site: "getvelocity.org", version: "0.8.2", size: "—", rating: 4.1, downloads: 52100,
    tags: ["roblox", "executor", "lua", "script-executor", "windows"],
    short: "Third-party Windows Roblox executor with version tracking.",
    long: "Velocity Executor is cataloged as a third-party Roblox script executor with versioned releases and compatibility notes. Roblox changes its client frequently, so the listed version is a snapshot rather than a compatibility guarantee.",
    features: ["Lua script execution", "Roblox client version tracking", "Release changelog", "Windows workflow", "Compatibility-focused updates"],
    requirements: ["Windows 10 or 11", "Roblox installed", "Internet connection"]
  },

  // ------------------------------------------------------------- GameCheats
  {
    name: "GTAV Kiddion's Mod Menu", category: "gamecheats", sub: "Cheats", price: "Free",
    site: "kiddion.org", version: "1.0.1", size: "—", rating: 4.0, downloads: 61300,
    tags: ["gta-v", "gta5", "mod-menu", "kiddions", "modding"],
    short: "External GTA V mod-menu listing with version and compatibility metadata.",
    long: "Kiddion's Modest Menu is a third-party utility associated with GTA V modding. Online use of modification tools can violate Rockstar policies and may result in account sanctions; this directory entry is informational only.",
    features: ["External menu architecture", "Configurable interface", "Version tracking", "Changelog metadata", "GTA V compatibility notes"],
    requirements: ["Windows 10 or 11", "GTA V for PC", "Use only where third-party modifications are permitted"]
  },
  {
  name: "CS2 Midnight Rage Legit", category: "gamecheats", sub: "Cheats", price: "Paid",
  site: "midnight.rage", version: "2026.08", size: "—", rating: 4.2, downloads: 28400,
  tags: ["cs2", "counter-strike-2", "legit", "cheat"],
  short: "Third-party CS2 cheat product listed with release and compatibility metadata.",
  long: "CS2 Midnight Rage Legit is a third-party Counter-Strike 2 cheat product. This catalog entry contains product metadata and compatibility information only.",
  features: ["Legit-style configuration", "Aim assistance", "Visual information", "Configurable settings", "Release tracking"],
  requirements: ["Windows 10 or 11", "Counter-Strike 2 installed", "Current game build"]
},
{
  name: "Fortnite Project Nova", category: "gamecheats", sub: "Cheats", price: "Paid",
  site: "project-nova.example", version: "2026.08", size: "—", rating: 3.9, downloads: 16300,
  tags: ["fortnite", "cheat", "esp", "aim"],
  short: "Third-party Fortnite cheat product with release and compatibility metadata.",
  long: "Fortnite Project Nova is a third-party Fortnite cheat product. The catalog entry is informational and tracks the product name, release state and compatibility metadata.",
  features: ["Aim assistance", "Visual overlays", "Configurable settings", "Build tracking", "Release information"],
  requirements: ["Windows 10 or 11", "Fortnite installed", "Current game build"]
},
{
  name: "Valorant Project Infinity", category: "gamecheats", sub: "Cheats", price: "Paid",
  site: "project-infinity.example", version: "2026.08", size: "—", rating: 3.8, downloads: 14100,
  tags: ["valorant", "cheat", "esp", "aim"],
  short: "Third-party Valorant cheat product with release tracking.",
  long: "Valorant Project Infinity is a third-party Valorant cheat product. Compatibility can change following game and anti-cheat updates, so the version shown is a catalog snapshot.",
  features: ["Aim assistance", "Visual overlays", "Configurable settings", "Release tracking", "Compatibility metadata"],
  requirements: ["Windows 10 or 11", "Valorant installed", "Current game build"]
},
{
  name: "Apex Legends SafeCheats", category: "gamecheats", sub: "Cheats", price: "Paid",
  site: "safecheats.example", version: "2026.08", size: "—", rating: 3.7, downloads: 11800,
  tags: ["apex-legends", "cheat", "esp", "aim"],
  short: "Third-party Apex Legends cheat product with season compatibility tracking.",
  long: "Apex Legends SafeCheats is a third-party Apex Legends cheat product. This entry records catalog metadata and supported release information without making claims about detection resistance.",
  features: ["Aim assistance", "Visual overlays", "Season tracking", "Configurable settings", "Release information"],
  requirements: ["Windows 10 or 11", "Apex Legends installed", "Current game build"]
}
];

export const attachLogos = (items) => items.map((item) => ({ ...item, logo: logo(item.site) }));
