import {
  Boxes, Cpu, Download, Gamepad2, Grid2X2, HardDrive, Package, Palette,
  Rocket, ShieldCheck, Sparkles, Wallet, Wrench
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

// Categories store an icon name so the CMS can change them without a deploy.
const ICONS: Record<string, LucideIcon> = {
  package: Package,
  "shield-check": ShieldCheck,
  "gamepad-2": Gamepad2,
  "grid-2x2": Grid2X2,
  wallet: Wallet,
  boxes: Boxes,
  cpu: Cpu,
  download: Download,
  "hard-drive": HardDrive,
  palette: Palette,
  rocket: Rocket,
  sparkles: Sparkles,
  wrench: Wrench
};

export const ICON_NAMES = Object.keys(ICONS);

export function CategoryIcon({ name, size = 20 }: { name?: string; size?: number }) {
  const Icon = ICONS[name ?? "package"] ?? Package;
  return <Icon size={size} />;
}
