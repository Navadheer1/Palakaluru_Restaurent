import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950 text-white p-4">
      <div className="text-center max-w-md">
        <span className="text-6xl font-black text-amber-500 block mb-2">404</span>
        <h1 className="text-2xl font-bold mb-2">Page Not Found</h1>
        <p className="text-slate-400 text-sm mb-6">
          The requested page could not be found or you may not have permission to view it.
        </p>
        <Link
          href="/login"
          className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm transition"
        >
          Return to Login
        </Link>
      </div>
    </div>
  );
}
