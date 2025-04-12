import { CreatePostForm } from "@/components/posts/CreatePostForm";

export default function CreatePostPage() {
  return (
    <main className="min-h-screen p-4 sm:p-8" style={{ backgroundColor: 'var(--background)' }}>
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl sm:text-3xl font-bold mb-8 text-center" style={{ color: 'var(--text)' }}>
          게시글 등록
        </h1>
        <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-lg">
          <CreatePostForm />
        </div>
      </div>
    </main>
  );
} 