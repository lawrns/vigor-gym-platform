export function LogoCloud() {
  const items = ['Sportia', 'EnerGym', 'FuerzaFit', 'Ritmo', 'Vitalis'];
  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="text-center text-neutral-500 text-sm">Confiado por gimnasios innovadores</div>
      <div className="mt-4 grid grid-cols-2 md:grid-cols-5 gap-6 items-center opacity-70">
        {items.map(name => (
          <div key={name} className="text-center font-medium text-neutral-700">
            {name}
          </div>
        ))}
      </div>
    </div>
  );
}
