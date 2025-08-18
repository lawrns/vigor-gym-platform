export default function RegisterPage() {
  return (
    <main className="max-w-sm mx-auto py-12">
      <h1 className="text-2xl font-display mb-4">Crear cuenta</h1>
      <form className="space-y-3">
        <input placeholder="Nombre completo" className="w-full border border-neutral-200 rounded-md px-3 py-2" />
        <input placeholder="Email" className="w-full border border-neutral-200 rounded-md px-3 py-2" />
        <input placeholder="Contraseña" type="password" className="w-full border border-neutral-200 rounded-md px-3 py-2" />
        <button className="w-full px-3 py-2 rounded-md bg-primary-500 text-white">Crear</button>
      </form>
    </main>
  );
}




