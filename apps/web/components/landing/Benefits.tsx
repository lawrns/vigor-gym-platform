import { Badge } from '../../components/ui/badge';

type Benefit = {
  title: string;
  desc: string;
  tag: string;
};

const benefits: Benefit[] = [
  {
    title: 'Gimnasios y estudios',
    desc: 'Más de 4,500 espacios y 250 centros de bienestar a nivel nacional.',
    tag: 'Training',
  },
  {
    title: 'Clases y rutinas',
    desc: 'Reserva clases cerca de tu oficina o casa, con visibilidad de capacidad.',
    tag: 'Clases',
  },
  {
    title: 'Nutrición y bienestar',
    desc: 'Contenido y beneficios de salud mental incluidos en tu membresía.',
    tag: 'Wellness',
  },
];

export function Benefits() {
  return (
    <section className="max-w-6xl mx-auto px-4 py-10">
      <h2 className="font-display text-2xl">Con un solo pago mensual, tus colaboradores tienen acceso a:</h2>
      <div className="mt-6 grid md:grid-cols-3 gap-4">
        {benefits.map((b) => (
          <div key={b.title} className="rounded-xl border border-neutral-200 bg-white p-5">
            <Badge variant="secondary">{b.tag}</Badge>
            <div className="mt-3 font-medium text-lg">{b.title}</div>
            <div className="text-neutral-700 text-sm mt-1">{b.desc}</div>
            <div className="mt-4">
              <button className="text-sm text-brand-700 hover:underline">Saber más</button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}




