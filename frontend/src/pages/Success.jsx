function Success() {
  return (
    <div>
      {/* SquareMoon branded header */}
      <div className="bg-[#0d1b2a] px-6 py-4">
        <div className="max-w-3xl mx-auto flex items-center gap-3">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="white">
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
          </svg>
          <span className="text-white text-lg font-bold tracking-tight">SquareMoon</span>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 py-24 text-center">
      <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
        <span className="text-green-600 text-3xl font-bold">✓</span>
      </div>
      <h2 className="text-2xl font-bold text-slate-800 mb-2">
        Screening Submitted
      </h2>
      <p className="text-slate-500 text-sm">
        Thank you! The screening has been recorded successfully.
      </p>
      </div>
    </div>
  );
}

export default Success;
