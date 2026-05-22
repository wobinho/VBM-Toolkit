import { ToolkitShell } from "@/components/shell/ToolkitShell";
import { BadgeStudio } from "@/components/badge/BadgeStudio";

export const metadata = {
  title: "Badge Builder · VBM Toolkit",
};

export default function ClubBadgePage() {
  return (
    <ToolkitShell
      toolName="Badge Builder"
      crumbs={[{ label: "Toolkit", href: "/" }, { label: "Tools" }]}
      rightSlot={<span>1:1 · vector badge · local library</span>}
    >
      <BadgeStudio />
    </ToolkitShell>
  );
}
