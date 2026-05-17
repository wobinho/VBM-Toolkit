import { ToolkitShell } from "@/components/shell/ToolkitShell";
import { PortraitStudio } from "@/components/portrait/PortraitStudio";

export const metadata = {
  title: "Portrait Prompt Studio · VBM Toolkit",
};

export default function PortraitPromptPage() {
  return (
    <ToolkitShell
      toolNumber="01"
      toolName="Portrait Prompt Studio"
      crumbs={[{ label: "Toolkit", href: "/" }, { label: "Tools" }]}
      rightSlot={
        <span className="text-ink-soft">
          Midjourney · niji 7 · 3:4 · local library
        </span>
      }
    >
      <PortraitStudio />
    </ToolkitShell>
  );
}
