/**
 * Member Factory for Demo Data Generation
 * Creates realistic member profiles with proper status distribution
 */

export interface MemberData {
  email: string;
  firstName: string;
  lastName: string;
  status: 'active' | 'paused' | 'cancelled' | 'invited';
  phone?: string;
}

export function createMemberFactory() {
  const firstNames = [
    'Ana', 'Carlos', 'María', 'José', 'Carmen', 'Antonio', 'Isabel', 'Manuel',
    'Pilar', 'Francisco', 'Dolores', 'David', 'Rosario', 'Jesús', 'Teresa',
    'Alejandro', 'Lucía', 'Miguel', 'Mercedes', 'Rafael', 'Montserrat', 'Ángel',
    'Esperanza', 'Luis', 'Amparo', 'Javier', 'Inmaculada', 'Juan', 'Cristina',
    'Fernando', 'Concepción', 'Sergio', 'Remedios', 'Pablo', 'Nuria', 'Jorge',
    'Silvia', 'Alberto', 'Beatriz', 'Adrián', 'Noelia', 'Álvaro', 'Mónica',
    'Óscar', 'Sandra', 'Rubén', 'Sonia', 'Iván', 'Vanessa', 'Diego'
  ];

  const lastNames = [
    'García', 'González', 'Rodríguez', 'Fernández', 'López', 'Martínez', 'Sánchez',
    'Pérez', 'Gómez', 'Martín', 'Jiménez', 'Ruiz', 'Hernández', 'Díaz', 'Moreno',
    'Muñoz', 'Álvarez', 'Romero', 'Alonso', 'Gutiérrez', 'Navarro', 'Torres',
    'Domínguez', 'Vázquez', 'Ramos', 'Gil', 'Ramírez', 'Serrano', 'Blanco',
    'Suárez', 'Molina', 'Morales', 'Ortega', 'Delgado', 'Castro', 'Ortiz',
    'Rubio', 'Marín', 'Sanz', 'Iglesias', 'Nuñez', 'Medina', 'Garrido'
  ];

  // Status distribution: 70% active, 15% paused, 10% cancelled, 5% invited
  const statusDistribution = [
    ...Array(70).fill('active'),
    ...Array(15).fill('paused'),
    ...Array(10).fill('cancelled'),
    ...Array(5).fill('invited'),
  ];

  return {
    create(index: number): MemberData {
      // Use index for deterministic but varied selection
      const firstNameIndex = (index * 7) % firstNames.length;
      const lastNameIndex = (index * 11) % lastNames.length;
      const statusIndex = index % statusDistribution.length;

      const firstName = firstNames[firstNameIndex];
      const lastName = lastNames[lastNameIndex];
      const status = statusDistribution[statusIndex] as MemberData['status'];

      // Generate email with index to ensure uniqueness
      const emailSuffix = (index + 50).toString(); // Start from 50 to avoid single digits
      const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}${emailSuffix}@demo.mx`;

      // Generate phone number (optional, 80% have phone)
      const hasPhone = (index % 5) !== 0; // 80% have phone
      const phone = hasPhone ? `+52 55 ${String(1000 + (index % 9000)).padStart(4, '0')} ${String(1000 + ((index * 3) % 9000)).padStart(4, '0')}` : undefined;

      return {
        email,
        firstName,
        lastName,
        status,
        phone,
      };
    },

    /**
     * Get status distribution for validation
     */
    getStatusDistribution() {
      return {
        active: 70,
        paused: 15,
        cancelled: 10,
        invited: 5,
      };
    },

    /**
     * Create a batch of members
     */
    createBatch(count: number): MemberData[] {
      return Array.from({ length: count }, (_, index) => this.create(index));
    },
  };
}

/**
 * Utility function to validate member data
 */
export function validateMemberData(member: MemberData): boolean {
  return !!(
    member.email &&
    member.firstName &&
    member.lastName &&
    member.status &&
    ['active', 'paused', 'cancelled', 'invited'].includes(member.status)
  );
}

/**
 * Get realistic member status for expiration scenarios
 */
export function getMemberStatusForExpiration(daysUntilExpiration: number): 'active' | 'paused' {
  // Members closer to expiration are more likely to be paused
  if (daysUntilExpiration <= 3) {
    return Math.random() < 0.3 ? 'paused' : 'active'; // 30% paused when very close
  } else if (daysUntilExpiration <= 7) {
    return Math.random() < 0.2 ? 'paused' : 'active'; // 20% paused when close
  } else {
    return Math.random() < 0.1 ? 'paused' : 'active'; // 10% paused otherwise
  }
}
