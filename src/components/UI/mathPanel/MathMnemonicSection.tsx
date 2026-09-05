import React, { useState } from "react";
import { ChevronDown } from "lucide-react";
import { colors } from "@/theme/colors";

interface MathMnemonicSectionProps {
  mnemonic?: string;
}

export const MathMnemonicSection: React.FC<MathMnemonicSectionProps> = ({
  mnemonic,
}) => {
  const [open, setOpen] = useState(true);

  if (!mnemonic) return null;

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between text-xs font-semibold text-neutral-600 mb-2.5 hover:text-neutral-900 transition-colors focus:outline-none cursor-pointer border-b border-neutral-100 pb-1.5"
      >
        <div className="flex items-center gap-1.5">
          <span className="text-sm">🗣️</span>
          <span>记忆口诀与秒杀心法</span>
        </div>
        <ChevronDown
          className={`w-3.5 h-3.5 transition-transform duration-fast ease-standard ${open ? "rotate-0" : "-rotate-90"}`}
        />
      </button>
      {open && (
        <div
          className="px-3 py-2.5 rounded-lg text-xs leading-relaxed border shadow-sm font-medium"
          style={{
            backgroundColor: colors.secondary[50],
            borderColor: colors.secondary[200],
            color: colors.secondary[700],
          }}
        >
          {mnemonic}
        </div>
      )}
    </div>
  );
};
