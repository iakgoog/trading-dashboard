import { Header } from './components/ui/Header';

export function App() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <Header />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 h-[400px] flex flex-col items-center justify-center text-slate-400">
          <p className="text-sm">Initializing market data...</p>
        </div>
      </main>
    </div>
  );
}
