import type { Story, StoryDefault } from "@ladle/react";
import { Logo, LogoIcon } from "./logo";

export default {
  title: "UI / Logo",
} satisfies StoryDefault;

export const FullLogo: Story = () => (
  <div className="p-8">
    <Logo showText />
  </div>
);

export const LogoOnly: Story = () => (
  <div className="p-8">
    <Logo />
  </div>
);

export const LogoIconOnly: Story = () => (
  <div className="p-8">
    <LogoIcon size={48} />
  </div>
);

export const Sizes: Story = () => (
  <div className="flex items-center gap-8 p-8">
    <LogoIcon size={16} />
    <LogoIcon size={24} />
    <LogoIcon size={32} />
    <LogoIcon size={48} />
    <LogoIcon size={64} />
  </div>
);

export const OnDark: Story = () => (
  <div className="p-8 bg-slate-900">
    <Logo showText />
  </div>
);

export const OnLight: Story = () => (
  <div className="p-8 bg-white">
    <Logo showText />
  </div>
);
