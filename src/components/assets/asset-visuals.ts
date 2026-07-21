import { Box, Car, Film, Layers, LayoutGrid, Mountain, Sparkles, Swords, User } from "lucide-react";
import type { AssetStyle, AssetType } from "@/domain/asset";

export const ASSET_TYPE_ICONS: Readonly<Record<AssetType, typeof Box>> = {
  Character: User,
  Environment: Mountain,
  Prop: Box,
  Weapon: Swords,
  Vehicle: Car,
  VFX: Sparkles,
  UI: LayoutGrid,
  Material: Layers,
  Animation: Film,
};

/** Deterministic gradient per style, used by the CSS-only preview placeholder. */
export const ASSET_STYLE_GRADIENTS: Readonly<Record<AssetStyle, string>> = {
  Realistic: "from-slate-700 via-slate-800 to-slate-900",
  "Low-poly": "from-blue-900 via-blue-950 to-slate-900",
  Stylized: "from-purple-900 via-indigo-950 to-slate-900",
  "Pixel-art": "from-cyan-900 via-slate-900 to-slate-950",
  "Hand-painted": "from-fuchsia-900 via-purple-950 to-slate-900",
  Cartoon: "from-teal-800 via-cyan-950 to-slate-900",
};
