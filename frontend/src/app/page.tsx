import Link from "next/link";

import Image from "next/image";

export default function Home() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-white to-amber-50 p-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md text-center border border-emerald-100">
        <div className="mb-4 flex justify-center">
          <Image
            src="/ref-logo.jpg"
            alt="REF Logo"
            width={80}
            height={80}
            className="rounded-full shadow-sm"
          />
        </div>
        <h1 className="text-3xl font-bold mb-2 text-emerald-700">
          Sistem Monitoring
        </h1>
        <h2 className="text-xl font-semibold mb-6 text-amber-600">REF 2026</h2>
        <p className="text-sm text-gray-600 mb-8">Ramadan EduAction Festival</p>
        <div className="flex flex-col gap-4">
          <Link
            href="/dashboard"
            className="w-full bg-gradient-to-r from-indigo-600 to-indigo-700 text-white py-3 rounded-lg font-bold hover:from-indigo-700 hover:to-indigo-800 transition-all shadow-md hover:shadow-lg"
          >
            📊 Dashboard Monitoring
          </Link>
          <Link
            href="/upload"
            className="w-full bg-gradient-to-r from-emerald-600 to-emerald-700 text-white py-3 rounded-lg font-bold hover:from-emerald-700 hover:to-emerald-800 transition-all shadow-md hover:shadow-lg"
          >
            📤 Upload Data Finance
          </Link>
          <Link
            href="/validasi"
            className="w-full bg-gradient-to-r from-teal-600 to-teal-700 text-white py-3 rounded-lg font-bold hover:from-teal-700 hover:to-teal-800 transition-all shadow-md hover:shadow-lg"
          >
            📝 Validasi Data Finance
          </Link>
          <Link
            href="/event"
            className="w-full bg-gradient-to-r from-amber-600 to-amber-700 text-white py-3 rounded-lg font-bold hover:from-amber-700 hover:to-amber-800 transition-all shadow-md hover:shadow-lg"
          >
            🎪 Input Event
          </Link>
          <Link
            href="/kemitraan"
            className="w-full bg-gradient-to-r from-purple-600 to-purple-700 text-white py-3 rounded-lg font-bold hover:from-purple-700 hover:to-purple-800 transition-all shadow-md hover:shadow-lg"
          >
            🤝 Input Kemitraan
          </Link>
        </div>
      </div>
    </main>
  );
}
