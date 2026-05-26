export type PostFieldErrors = {
  title?: string;
  content?: string;
};

export const validatePostInput = (
  title: string,
  content: string,
): PostFieldErrors | null => {
  const errors: PostFieldErrors = {};
  const trimmedTitle = title.trim();
  const trimmedContent = content.trim();

  if (!trimmedTitle) {
    errors.title = "제목을 입력하세요.";
  }
  if (!trimmedContent) {
    errors.content = "내용을 입력하세요.";
  }

  return Object.keys(errors).length > 0 ? errors : null;
};

export const canEditPost = (
  authorId: string,
  userId: string | undefined,
): boolean => Boolean(userId && authorId === userId);
