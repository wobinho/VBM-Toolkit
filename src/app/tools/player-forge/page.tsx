import { ToolkitShell } from "@/components/shell/ToolkitShell";
import { PlayerForge } from "@/components/player/PlayerForge";

export const metadata = {
  title: "Player Forge · VBM Toolkit",
};

export default function PlayerForgePage() {
  return (
    <ToolkitShell
      toolName="Player Forge"
      crumbs={[{ label: "Toolkit", href: "/" }, { label: "Tools" }]}
      rightSlot={<span>custom-players@1 · 4 stat groups · local library</span>}
    >
      <PlayerForge />
    </ToolkitShell>
  );
}
