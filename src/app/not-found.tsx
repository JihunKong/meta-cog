'use client';

export default function NotFound() {
  return (
    <div className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center gap-2 py-10">
      <h1 className="text-4xl font-bold">404</h1>
      <h2 className="text-xl">페이지를 찾을 수 없습니다</h2>
      <p className="text-muted-foreground">
        요청하신 페이지가 존재하지 않거나 이동되었을 수 있습니다.
      </p>
      <a
        href="/"
        className="mt-4 rounded-md bg-primary px-4 py-2 text-white hover:bg-primary/90"
      >
        홈으로 돌아가기
      </a>
    </div>
  );
} 