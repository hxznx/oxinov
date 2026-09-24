import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

/**
 * Lesson text renderer shared by learners and the teacher preview. Raw HTML is never rendered, and
 * react-markdown's URL filter drops unsafe link protocols such as javascript:.
 */
export function LessonMarkdown({ children }: { children: string }) {
  return (
    <Markdown
      remarkPlugins={[remarkGfm]}
      components={{
        a: ({ href, children: text }) => (
          <a href={href} {...(href?.startsWith('http') ? { rel: 'noopener noreferrer', target: '_blank' } : {})}>
            {text}
          </a>
        ),
      }}
    >
      {children}
    </Markdown>
  );
}
