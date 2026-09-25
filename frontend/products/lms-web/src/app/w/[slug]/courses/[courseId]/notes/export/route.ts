import { NextResponse, type NextRequest } from 'next/server';
import { auth } from '@/lib/auth.ts';
import { EduApiError, eduApi } from '@/lib/edu-api.ts';
import { exportFileName, notesToMarkdown } from '@/lib/notes.ts';

type Context = { params: Promise<{ slug: string; courseId: string }> };

/** Markdown download of the learner's own notes for a course (FR-PLAYER-403). */
export async function GET(request: NextRequest, { params }: Context): Promise<NextResponse> {
  const { slug, courseId } = await params;
  const back = `/w/${slug}/courses/${courseId}/notes`;
  const session = await auth.currentSession(back);
  if (!session) return NextResponse.redirect(new URL(`/auth/login?returnTo=${encodeURIComponent(back)}`, request.url));
  try {
    const workspace = (await eduApi.workspaces(session.accessToken)).find((item) => item.slug === slug);
    if (!workspace) return new NextResponse('Not found', { status: 404 });
    const [course, notes] = await Promise.all([
      eduApi.course(session.accessToken, workspace.id, courseId),
      eduApi.courseNotes(session.accessToken, workspace.id, courseId),
    ]);
    return new NextResponse(notesToMarkdown(course.title, notes), {
      headers: {
        'Content-Type': 'text/markdown; charset=utf-8',
        'Content-Disposition': `attachment; filename="${exportFileName(course.title)}"`,
        'Cache-Control': 'private, no-store',
      },
    });
  } catch (error) {
    const status = error instanceof EduApiError ? error.status : 503;
    return new NextResponse(status === 404 ? 'Not found' : 'Your notes are unavailable right now. Try again shortly.', { status: status === 404 ? 404 : 503 });
  }
}
