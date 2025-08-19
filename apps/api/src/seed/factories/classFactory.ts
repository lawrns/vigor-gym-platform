/**
 * Class Factory for Demo Data Generation
 * Creates realistic gym class schedules with proper timing and capacity
 */

export interface ClassData {
  name: string;
  description: string;
  gymId: string;
  trainerId: string;
  startTime: Date;
  endTime: Date;
  capacity: number;
  isRecurring: boolean;
  dayOfWeek: number; // 0 = Sunday, 6 = Saturday
}

export function createClassFactory() {
  const classDescriptions = {
    Yoga: 'Relaja tu mente y fortalece tu cuerpo con posturas tradicionales de yoga.',
    Spinning: 'Entrenamiento cardiovascular intenso en bicicleta estática con música motivadora.',
    CrossFit: 'Entrenamiento funcional de alta intensidad que combina fuerza y cardio.',
    Pilates: 'Fortalece tu core y mejora tu flexibilidad con ejercicios controlados.',
    Zumba: 'Baila y quema calorías con ritmos latinos en una clase llena de energía.',
    Boxing: 'Aprende técnicas de boxeo mientras mejoras tu condición física.',
    Aqua: 'Ejercicios de bajo impacto en el agua, ideal para todas las edades.',
  };

  const timeSlots = [
    { start: '06:00', end: '07:00' }, // Early morning
    { start: '07:30', end: '08:30' }, // Morning
    { start: '09:00', end: '10:00' }, // Mid-morning
    { start: '18:00', end: '19:00' }, // Evening
    { start: '19:30', end: '20:30' }, // Late evening
  ];

  const capacities = {
    Yoga: 20,
    Spinning: 25,
    CrossFit: 15,
    Pilates: 18,
    Zumba: 30,
    Boxing: 12,
    Aqua: 22,
  };

  return {
    create(
      dayOfWeek: number,
      timeSlotIndex: number,
      classType: string,
      gymId: string,
      trainerId: string
    ): ClassData {
      const timeSlot = timeSlots[timeSlotIndex % timeSlots.length];
      const capacity = capacities[classType as keyof typeof capacities] || 20;
      const description =
        classDescriptions[classType as keyof typeof classDescriptions] ||
        'Clase de entrenamiento grupal.';

      // Calculate next occurrence of this day of week
      const now = new Date();
      const nextClass = new Date(now);
      const daysUntilClass = (dayOfWeek - now.getDay() + 7) % 7;
      nextClass.setDate(now.getDate() + daysUntilClass);

      // Set start time
      const [startHour, startMinute] = timeSlot.start.split(':').map(Number);
      nextClass.setHours(startHour, startMinute, 0, 0);

      // Set end time
      const [endHour, endMinute] = timeSlot.end.split(':').map(Number);
      const endTime = new Date(nextClass);
      endTime.setHours(endHour, endMinute, 0, 0);

      return {
        name: classType,
        description,
        gymId,
        trainerId,
        startTime: nextClass,
        endTime,
        capacity,
        isRecurring: true,
        dayOfWeek,
      };
    },

    /**
     * Create a full weekly schedule
     */
    createWeeklySchedule(
      gyms: Array<{ id: string; name: string }>,
      trainers: Array<{ id: string; firstName: string; lastName: string }>
    ): ClassData[] {
      const classes: ClassData[] = [];
      const classTypes = Object.keys(classDescriptions);

      // 4 classes per day × 7 days = 28 classes per week
      for (let day = 0; day < 7; day++) {
        for (let slot = 0; slot < 4; slot++) {
          const gym = gyms[Math.floor(Math.random() * gyms.length)];
          const trainer = trainers[Math.floor(Math.random() * trainers.length)];
          const classType = classTypes[Math.floor(Math.random() * classTypes.length)];

          const classData = this.create(day, slot, classType, gym.id, trainer.id);
          classes.push(classData);
        }
      }

      return classes;
    },

    /**
     * Create classes for today with realistic distribution
     */
    createTodayClasses(
      gyms: Array<{ id: string; name: string }>,
      trainers: Array<{ id: string; firstName: string; lastName: string }>,
      count: number = 10
    ): ClassData[] {
      const classes: ClassData[] = [];
      const classTypes = Object.keys(classDescriptions);
      const today = new Date();
      const dayOfWeek = today.getDay();

      // Distribute classes throughout the day
      const todayTimeSlots = [
        { start: '06:00', end: '07:00' },
        { start: '07:30', end: '08:30' },
        { start: '09:00', end: '10:00' },
        { start: '10:30', end: '11:30' },
        { start: '12:00', end: '13:00' },
        { start: '17:00', end: '18:00' },
        { start: '18:30', end: '19:30' },
        { start: '19:00', end: '20:00' },
        { start: '20:30', end: '21:30' },
        { start: '21:00', end: '22:00' },
      ];

      for (let i = 0; i < Math.min(count, todayTimeSlots.length); i++) {
        const gym = gyms[i % gyms.length]; // Distribute across gyms
        const trainer = trainers[i % trainers.length]; // Distribute across trainers
        const classType = classTypes[i % classTypes.length]; // Vary class types
        const timeSlot = todayTimeSlots[i];

        const capacity = capacities[classType as keyof typeof capacities] || 20;
        const description =
          classDescriptions[classType as keyof typeof classDescriptions] ||
          'Clase de entrenamiento grupal.';

        // Set start time for today
        const [startHour, startMinute] = timeSlot.start.split(':').map(Number);
        const startTime = new Date(today);
        startTime.setHours(startHour, startMinute, 0, 0);

        // Set end time
        const [endHour, endMinute] = timeSlot.end.split(':').map(Number);
        const endTime = new Date(today);
        endTime.setHours(endHour, endMinute, 0, 0);

        classes.push({
          name: classType,
          description,
          gymId: gym.id,
          trainerId: trainer.id,
          startTime,
          endTime,
          capacity,
          isRecurring: true,
          dayOfWeek,
        });
      }

      return classes.sort((a, b) => a.startTime.getTime() - b.startTime.getTime());
    },

    /**
     * Get class distribution statistics
     */
    getClassStats(classes: ClassData[]) {
      const byType = classes.reduce(
        (acc, cls) => {
          acc[cls.name] = (acc[cls.name] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>
      );

      const byDay = classes.reduce(
        (acc, cls) => {
          const day = [
            'Sunday',
            'Monday',
            'Tuesday',
            'Wednesday',
            'Thursday',
            'Friday',
            'Saturday',
          ][cls.dayOfWeek];
          acc[day] = (acc[day] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>
      );

      const totalCapacity = classes.reduce((sum, cls) => sum + cls.capacity, 0);
      const avgCapacity = totalCapacity / classes.length;

      return {
        total: classes.length,
        byType,
        byDay,
        totalCapacity,
        avgCapacity: Math.round(avgCapacity),
      };
    },

    /**
     * Get popular class times
     */
    getPopularTimes(classes: ClassData[]) {
      const timeSlots = classes.reduce(
        (acc, cls) => {
          const hour = cls.startTime.getHours();
          const timeSlot = `${hour.toString().padStart(2, '0')}:00`;
          acc[timeSlot] = (acc[timeSlot] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>
      );

      return Object.entries(timeSlots)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5); // Top 5 popular times
    },
  };
}

/**
 * Utility function to validate class data
 */
export function validateClassData(classData: ClassData): boolean {
  return !!(
    classData.name &&
    classData.gymId &&
    classData.trainerId &&
    classData.startTime instanceof Date &&
    classData.endTime instanceof Date &&
    classData.endTime > classData.startTime &&
    classData.capacity > 0 &&
    classData.dayOfWeek >= 0 &&
    classData.dayOfWeek <= 6
  );
}

/**
 * Get class type recommendations based on time and day
 */
export function getRecommendedClassType(dayOfWeek: number, hour: number): string {
  // Early morning (6-9 AM): Yoga, Pilates
  if (hour >= 6 && hour < 9) {
    return Math.random() < 0.6 ? 'Yoga' : 'Pilates';
  }

  // Mid-morning (9-12 PM): Aqua, Yoga
  if (hour >= 9 && hour < 12) {
    return Math.random() < 0.5 ? 'Aqua' : 'Yoga';
  }

  // Evening (6-9 PM): High energy classes
  if (hour >= 18 && hour < 21) {
    const energyClasses = ['Spinning', 'CrossFit', 'Zumba', 'Boxing'];
    return energyClasses[Math.floor(Math.random() * energyClasses.length)];
  }

  // Default: balanced selection
  const allClasses = ['Yoga', 'Spinning', 'CrossFit', 'Pilates', 'Zumba', 'Boxing', 'Aqua'];
  return allClasses[Math.floor(Math.random() * allClasses.length)];
}
