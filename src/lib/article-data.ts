import type { LucideIcon } from "lucide-react";
import {
  Wrench,
  Gamepad2,
  Monitor,
  Bot,
  Terminal,
  Settings,
  Home,
  Workflow,
  Blocks,
  Braces,
} from "lucide-react";

export const categoryMeta: Record<
  string,
  { description: string; Icon: LucideIcon }
> = {
  troubleshooting: {
    description:
      "Step-by-step guides to diagnose and fix common developer issues.",
    Icon: Wrench,
  },
  "discord-bots": {
    description:
      "Tutorials for building, deploying, and managing Discord bots.",
    Icon: Gamepad2,
  },
  "windows-setup": {
    description:
      "Configuring Windows dev environments — WSL, terminals, drivers.",
    Icon: Monitor,
  },
  "ai-development": {
    description:
      "Building with AI — RAG pipelines, prompt engineering, vibe coding.",
    Icon: Bot,
  },
  linux: {
    description:
      "Linux server administration, Docker setup, and CLI workflows.",
    Icon: Terminal,
  },
  devops: {
    description:
      "CI/CD pipelines, container orchestration, and deployment automation.",
    Icon: Settings,
  },
  automation: {
    description:
      "Workflow automation with n8n, Make, and Power Automate.",
    Icon: Workflow,
  },
  web3: {
    description:
      "Smart contracts, Ethereum tooling, and decentralized apps.",
    Icon: Blocks,
  },
  programming: {
    description:
      "Language guides, tooling, and code quality for everyday development.",
    Icon: Braces,
  },
  "home-automation": {
    description:
      "Smart home dashboards, Home Assistant, and IoT integrations.",
    Icon: Home,
  },
};
