import { SignIn } from '@clerk/clerk-react';

export function LoginPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-slate-100 flex flex-col items-center justify-center p-4">
      <div className="mb-8 text-center">
        <div className="inline-flex items-center justify-center w-14 h-14 bg-blue-600 rounded-2xl mb-4 shadow-lg">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="1" x2="12" y2="23" />
            <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-slate-800">Controle Financeiro</h1>
        <p className="text-slate-500 text-sm mt-1">Gerencie suas finanças com segurança</p>
      </div>

      <SignIn
        appearance={{
          elements: {
            rootBox: 'w-full max-w-md',
            card: 'shadow-xl rounded-2xl border border-slate-100',
            headerTitle: 'text-slate-800',
            headerSubtitle: 'text-slate-500',
            socialButtonsBlockButton:
              'border border-slate-200 hover:bg-slate-50 text-slate-700 font-medium rounded-xl transition-colors',
            formButtonPrimary:
              'bg-blue-600 hover:bg-blue-700 rounded-xl font-medium transition-colors',
            footerActionLink: 'text-blue-600 hover:text-blue-700 font-medium',
            formFieldInput:
              'rounded-xl border-slate-200 focus:ring-2 focus:ring-blue-400 focus:border-transparent',
          },
        }}
      />
    </div>
  );
}
