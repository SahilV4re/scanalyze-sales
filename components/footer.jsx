import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-white border-t border-green-700 pt-10 pb-8 px-4">
      {/* Top accent bar */}
      <div className=" w-full bg-gradient-to-r from-[#32CD32] to-[#228B22] rounded-t-lg mb-8" />

      {/* Main layout */}
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row md:justify-between md:items-center gap-8">
        {/* Logo and Brand */}
        <div className="flex items-center gap-3">
          <span className="rounded-full bg-green-700 text-white w-10 h-10 flex items-center justify-center font-bold text-2xl shadow-sm">S</span>
          <span className="text-gray-700 text-2xl font-bold tracking-tight">
            Scanalyze
          </span>
        </div>
        {/* Navigation */}
        <nav className="flex flex-wrap items-center gap-6 text-base">
          <Link href="/" className="text-gray-700 hover:text-[#32CD32] font-medium transition-colors">Home</Link>
          <Link href="/features" className="text-gray-700 hover:text-[#32CD32] font-medium transition-colors">Features</Link>
          <Link href="/pricing" className="text-gray-700 hover:text-[#32CD32] font-medium transition-colors">Pricing</Link>
          <Link href="/how-it-works" className="text-gray-700 hover:text-[#32CD32] font-medium transition-colors">How it works</Link>
          <Link href="/testimonials" className="text-gray-700 hover:text-[#32CD32] font-medium transition-colors">Testimonials</Link>
        </nav>
      </div>

      {/* Divider */}
      <div className="border-t border-gray-100 my-6" />

      {/* Bottom Row */}
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        <span className="text-gray-500 text-sm">
          © {new Date().getFullYear()} Scanalyze. All rights reserved.
        </span>
        <div className="flex gap-1">
                  <Link href="/" className="text-gray-500 text-sm hover:text-green-700 transition-colors">Privacy Policy .</Link>
                  
          <Link href="/" className="text-gray-500 text-sm hover:text-green-700 transition-colors">Terms of Service</Link>
        </div>
      </div>
    </footer>
  );
}
