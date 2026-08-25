export default function App() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-4 bg-slate-50 text-slate-800">
      <div className="w-full max-w-md p-6 bg-white rounded-2xl shadow-sm border border-slate-200 text-center">
        <h1 className="text-2xl font-bold text-slate-900 mb-2">
          Plataforma Beta QR
        </h1>
        <p className="text-sm text-slate-600 mb-4">
          Plataforma web responsive Mobile-First y PWA para la gestión, registro de uso mediante códigos QR y monitoreo en tiempo real del laboratorio de prototipado 3D.
        </p>
        <button className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-colors">
          Iniciar Impresión
        </button>
      </div>
    </main>
  );
}