export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="relative flex min-h-screen items-center justify-center p-6">
      {/* Background image */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage:
            "url('https://images.unsplash.com/photo-1490093158370-1a6be674437b?q=80&w=1014&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D')",
        }}
      ></div>

      {/* Overlay for better contrast */}
      <div className="absolute inset-0 bg-black/30"></div>

      {/* Background decorative circles */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-white/20 blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 h-96 w-96 rounded-full bg-white/10 blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2 transform rounded-full bg-white/5 blur-2xl"></div>
      </div>

      {/* Login card */}
      <div className="relative z-10 flex w-full max-w-7xl">
        <div className="w-full rounded-2xl border border-gray-700/50 bg-zinc-950 p-8 shadow-2xl md:w-[40%] md:rounded-l-2xl md:rounded-r-none md:p-14">
          {/* Logo */}
          <div className="mb-10">
            <div className="text-2xl font-bold text-white">Lorem Ipsum</div>
            <div className="text-sm text-gray-400">Platform</div>
          </div>

          {/* Content with original padding */}
          <div className="pt-12">{children}</div>
        </div>

        <div className="relative hidden w-[60%] overflow-hidden rounded-r-2xl border border-white/20 bg-white/10 p-8 shadow-2xl backdrop-blur-xs md:block">
          <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent"></div>
          <div className="absolute inset-0 bg-gradient-to-tl from-gray-400/10 via-transparent to-white/5"></div>

          <div className="relative z-10 flex h-full items-center justify-center">
            <div className="text-lg font-light text-white/60"></div>
          </div>
        </div>
      </div>
    </div>
  );
}
