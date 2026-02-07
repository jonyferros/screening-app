import { useSearchParams } from 'react-router-dom';

function OutreachThankYou() {
  const [searchParams] = useSearchParams();
  const unsubscribed = searchParams.get('unsubscribed') === 'true';

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center px-4">
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-10 max-w-md text-center">
        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-8 h-8 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>

        {unsubscribed ? (
          <>
            <h1 className="text-2xl font-bold text-slate-800 mb-2">Unsubscribed</h1>
            <p className="text-slate-500 text-sm mb-6">
              You've been successfully unsubscribed and won't receive any more emails from us about this opportunity.
            </p>
          </>
        ) : (
          <>
            <h1 className="text-2xl font-bold text-slate-800 mb-2">Thanks for letting us know</h1>
            <p className="text-slate-500 text-sm mb-6">
              We appreciate you taking the time to respond. We won't contact you again about this opportunity.
            </p>
          </>
        )}

        <p className="text-xs text-slate-400">
          If you change your mind or have questions, feel free to reach out directly.
        </p>
      </div>
    </div>
  );
}

export default OutreachThankYou;
