"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeSanitize from "rehype-sanitize";
import rehypeSlug from "rehype-slug";

export default function MarkdownContent({ content }: { content: string }) {
  return (
    <div className="prose prose-zinc prose-code:before:content-none prose-code:after:content-none max-w-none">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeSanitize, rehypeSlug]}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
