const WORDS_PER_MINUTE = 200;

export function readingTime(content: string): number {
  const text = content
    .replace(/```[\s\S]*?```/g, "")
    .replace(/`[^`]+`/g, "")
    .replace(/!\[.*?\]\(.*?\)/g, "")
    .replace(/\[([^\]]+)\]\(.*?\)/g, "$1")
    .replace(/[#*_~>|-]/g, "")
    .replace(/https?:\/\/\S+/g, "")
    .trim();

  const words = text.split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / WORDS_PER_MINUTE));
}
