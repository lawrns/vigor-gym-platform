import { Router, Response } from 'express';
import { PrismaClient } from '../generated/prisma/index.js';
import { authRequired } from '../middleware/auth.js';
import { tenantRequired, TenantRequest } from '../middleware/tenant.js';
import { logger } from '../utils/auditLogger.js';
import { validateDashboardQuery, DashboardValidationError } from '../lib/validation/dashboard.js';
import { z } from 'zod';

const router = Router();
const prisma = new PrismaClient();

// Validation schemas
const createClassSchema = z.object({
  gymId: z.string().uuid(),
  title: z.string().min(1).max(100),
  startsAt: z.string().datetime(),
  capacity: z.number().int().min(1).max(100),
});

const updateClassSchema = z.object({
  gymId: z.string().uuid().optional(),
  title: z.string().min(1).max(100).optional(),
  startsAt: z.string().datetime().optional(),
  capacity: z.number().int().min(1).max(100).optional(),
});

/**
 * GET /v1/classes/today - Get today's class schedule
 *
 * Query Parameters:
 * - locationId: Optional UUID of specific gym location
 * - date: Optional ISO date (defaults to today)
 *
 * Returns classes with:
 * - id, name, startsAt, endsAt, capacity, booked, trainer
 * - Attendance tracking capabilities for trainers/managers
 */
router.get(
  '/today',
  authRequired(['owner', 'manager', 'staff']),
  tenantRequired(),
  async (req: TenantRequest, res: Response) => {
    try {
      const { companyId } = req.tenant!;
      const { locationId, date } = req.query;

      // Validate locationId if provided
      if (locationId) {
        try {
          validateDashboardQuery({
            orgId: companyId,
            locationId: locationId as string,
          });
        } catch (error) {
          if (error instanceof DashboardValidationError) {
            return res.status(422).json({
              error: error.code,
              message: error.message,
              field: error.field,
            });
          }
          throw error;
        }
      }

      // Parse date parameter or use today
      const targetDate = date ? new Date(date as string) : new Date();
      if (isNaN(targetDate.getTime())) {
        return res.status(422).json({
          error: 'INVALID_DATE',
          message: 'date must be a valid ISO date',
          field: 'date',
        });
      }

      // Set date range for the target day
      const startOfDay = new Date(targetDate);
      startOfDay.setHours(0, 0, 0, 0);

      const endOfDay = new Date(targetDate);
      endOfDay.setHours(23, 59, 59, 999);

      // Get classes for the day (handle potential data corruption)
      let classes = [];
      try {
        classes = await prisma.class.findMany({
          where: {
            startsAt: {
              gte: startOfDay,
              lte: endOfDay,
            },
            ...(locationId && { gymId: locationId as string }),
          },
          include: {
            gym: {
              select: {
                id: true,
                name: true,
              },
            },
            bookings: {
              include: {
                membership: {
                  include: {
                    member: {
                      select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                      },
                    },
                  },
                },
              },
            },
          },
          orderBy: {
            startsAt: 'asc',
          },
        });
      } catch (error) {
        logger.warn(
          {
            error: error.message,
            companyId,
            locationId,
            date: targetDate.toISOString().split('T')[0],
          },
          'Failed to fetch classes - possibly corrupted data, returning empty result'
        );

        // Return empty result if there's a data corruption issue
        classes = [];
      }

      // Transform classes to include booking counts and attendance info
      const classesWithStats = classes.map(classItem => {
        const allBookings = classItem.bookings;
        const confirmedBookings = allBookings.filter(
          b => b.status === 'reserved' || b.status === 'confirmed'
        );

        // Calculate estimated end time (assume 1 hour duration)
        const estimatedEndTime = new Date(classItem.startsAt);
        estimatedEndTime.setHours(estimatedEndTime.getHours() + 1);

        return {
          id: classItem.id,
          name: classItem.title, // Use title field from schema
          description: null, // Not available in current schema
          startsAt: classItem.startsAt.toISOString(),
          endsAt: estimatedEndTime.toISOString(), // Estimated end time
          capacity: classItem.capacity,
          booked: confirmedBookings.length,
          attended: 0, // Not tracked in current schema
          noShows: 0, // Not tracked in current schema
          pending: confirmedBookings.length, // All bookings are pending attendance
          utilizationPercent:
            classItem.capacity > 0
              ? Math.round((confirmedBookings.length / classItem.capacity) * 100)
              : 0,
          gym: classItem.gym,
          trainer: null, // Not available in current schema
          bookings: confirmedBookings.map(booking => ({
            id: booking.id,
            member: {
              id: booking.membership.member.id,
              name: `${booking.membership.member.firstName} ${booking.membership.member.lastName}`,
            },
            attended: null, // Not tracked in current schema
            bookedAt: booking.createdAt.toISOString(),
          })),
          status: getClassStatus(classItem.startsAt, estimatedEndTime),
        };
      });

      res.json({
        classes: classesWithStats,
        date: targetDate.toISOString().split('T')[0],
        locationId: locationId || null,
        total: classesWithStats.length,
        summary: {
          totalCapacity: classesWithStats.reduce((sum, c) => sum + c.capacity, 0),
          totalBooked: classesWithStats.reduce((sum, c) => sum + c.booked, 0),
          totalAttended: classesWithStats.reduce((sum, c) => sum + c.attended, 0),
          averageUtilization:
            classesWithStats.length > 0
              ? Math.round(
                  classesWithStats.reduce((sum, c) => sum + c.utilizationPercent, 0) /
                    classesWithStats.length
                )
              : 0,
        },
      });
    } catch (error) {
      logger.error(
        {
          error: error.message,
          companyId: req.tenant?.companyId,
          locationId: req.query.locationId,
          date: req.query.date,
        },
        'Classes today error'
      );

      res.status(500).json({
        message: "Failed to fetch today's classes",
      });
    }
  }
);

// GET /v1/classes - List classes
router.get(
  '/',
  authRequired(['staff', 'manager', 'owner']),
  tenantRequired(),
  async (req: TenantRequest, res: Response) => {
    try {
      const { page = 1, limit = 20, gymId, from, to } = req.query;
      const skip = (Number(page) - 1) * Number(limit);

      // Build where clause
      const where: any = {};

      if (gymId) {
        where.gymId = gymId;
      }

      if (from || to) {
        where.startsAt = {};
        if (from) {
          where.startsAt.gte = new Date(from as string);
        }
        if (to) {
          where.startsAt.lte = new Date(to as string);
        }
      }

      const [classes, total] = await Promise.all([
        prisma.class.findMany({
          where,
          include: {
            gym: true,
            _count: {
              select: { bookings: true },
            },
          },
          orderBy: { startsAt: 'asc' },
          skip,
          take: Number(limit),
        }),
        prisma.class.count({ where }),
      ]);

      res.json({
        classes: classes.map(cls => ({
          id: cls.id,
          title: cls.title,
          startsAt: cls.startsAt,
          capacity: cls.capacity,
          bookingsCount: cls._count.bookings,
          availableSpots: cls.capacity - cls._count.bookings,
          gym: {
            id: cls.gym.id,
            name: cls.gym.name,
            city: cls.gym.city,
          },
        })),
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit)),
        },
      });
    } catch (error) {
      console.error('Error fetching classes:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }
);

// POST /v1/classes - Create a new class
router.post(
  '/',
  authRequired(['manager', 'owner']),
  tenantRequired(),
  async (req: TenantRequest, res: Response) => {
    try {
      const validation = createClassSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({
          message: 'Validation error',
          errors: validation.error.errors,
        });
      }

      const { gymId, title, startsAt, capacity } = validation.data;

      // Verify gym exists
      const gym = await prisma.gym.findUnique({
        where: { id: gymId },
      });

      if (!gym) {
        return res.status(404).json({ message: 'Gym not found' });
      }

      // Check for scheduling conflicts (same gym, overlapping time)
      const startsAtDate = new Date(startsAt);
      const endsAtDate = new Date(startsAtDate.getTime() + 60 * 60 * 1000); // Assume 1 hour duration

      const conflictingClass = await prisma.class.findFirst({
        where: {
          gymId: gymId,
          startsAt: {
            gte: new Date(startsAtDate.getTime() - 60 * 60 * 1000), // 1 hour before
            lte: new Date(startsAtDate.getTime() + 60 * 60 * 1000), // 1 hour after
          },
        },
      });

      if (conflictingClass) {
        return res.status(409).json({
          message: 'Schedule conflict: Another class is scheduled at this time',
          conflictingClass: {
            id: conflictingClass.id,
            title: conflictingClass.title,
            startsAt: conflictingClass.startsAt,
          },
        });
      }

      // Create the class
      const newClass = await prisma.class.create({
        data: {
          gymId,
          title,
          startsAt: startsAtDate,
          capacity,
        },
        include: {
          gym: true,
        },
      });

      res.status(201).json({
        id: newClass.id,
        title: newClass.title,
        startsAt: newClass.startsAt,
        capacity: newClass.capacity,
        bookingsCount: 0,
        availableSpots: newClass.capacity,
        gym: {
          id: newClass.gym.id,
          name: newClass.gym.name,
          city: newClass.gym.city,
        },
      });
    } catch (error) {
      console.error('Error creating class:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }
);

// GET /v1/classes/:id - Get a specific class
router.get(
  '/:id',
  authRequired(['staff', 'manager', 'owner']),
  tenantRequired(),
  async (req: TenantRequest, res: Response) => {
    try {
      const classId = req.params.id;

      const classData = await prisma.class.findUnique({
        where: { id: classId },
        include: {
          gym: true,
          bookings: {
            include: {
              membership: {
                include: {
                  member: true,
                },
              },
            },
          },
        },
      });

      if (!classData) {
        return res.status(404).json({ message: 'Class not found' });
      }

      res.json({
        id: classData.id,
        title: classData.title,
        startsAt: classData.startsAt,
        capacity: classData.capacity,
        bookingsCount: classData.bookings.length,
        availableSpots: classData.capacity - classData.bookings.length,
        gym: {
          id: classData.gym.id,
          name: classData.gym.name,
          city: classData.gym.city,
        },
        bookings: classData.bookings.map(booking => ({
          id: booking.id,
          status: booking.status,
          bookedAt: booking.createdAt, // Use createdAt instead of bookedAt
          member: booking.membership.member
            ? {
                id: booking.membership.member.id,
                firstName: booking.membership.member.firstName,
                lastName: booking.membership.member.lastName,
                email: booking.membership.member.email,
              }
            : null,
        })),
      });
    } catch (error) {
      console.error('Error fetching class:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }
);

// PATCH /v1/classes/:id - Update a class
router.patch(
  '/:id',
  authRequired(['manager', 'owner']),
  tenantRequired(),
  async (req: TenantRequest, res: Response) => {
    try {
      const classId = req.params.id;

      const validation = updateClassSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({
          message: 'Validation error',
          errors: validation.error.errors,
        });
      }

      // Check if class exists
      const existingClass = await prisma.class.findUnique({
        where: { id: classId },
      });

      if (!existingClass) {
        return res.status(404).json({ message: 'Class not found' });
      }

      const updateData = validation.data;

      // Convert startsAt to Date if provided
      const processedData = {
        ...updateData,
        ...(updateData.startsAt && { startsAt: new Date(updateData.startsAt) }),
      };

      // Update the class
      const updatedClass = await prisma.class.update({
        where: { id: classId },
        data: processedData,
        include: {
          gym: true,
          _count: {
            select: { bookings: true },
          },
        },
      });

      res.json({
        id: updatedClass.id,
        title: updatedClass.title,
        startsAt: updatedClass.startsAt,
        capacity: updatedClass.capacity,
        bookingsCount: updatedClass._count.bookings,
        availableSpots: updatedClass.capacity - updatedClass._count.bookings,
        gym: {
          id: updatedClass.gym.id,
          name: updatedClass.gym.name,
          city: updatedClass.gym.city,
        },
      });
    } catch (error) {
      console.error('Error updating class:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }
);

// DELETE /v1/classes/:id - Delete a class
router.delete(
  '/:id',
  authRequired(['manager', 'owner']),
  tenantRequired(),
  async (req: TenantRequest, res: Response) => {
    try {
      const classId = req.params.id;

      // Check if class exists and has bookings
      const existingClass = await prisma.class.findUnique({
        where: { id: classId },
        include: {
          _count: {
            select: { bookings: true },
          },
        },
      });

      if (!existingClass) {
        return res.status(404).json({ message: 'Class not found' });
      }

      if (existingClass._count.bookings > 0) {
        return res.status(409).json({
          message: 'Cannot delete class with existing bookings',
          bookingsCount: existingClass._count.bookings,
        });
      }

      // Delete the class
      await prisma.class.delete({
        where: { id: classId },
      });

      res.status(204).send();
    } catch (error) {
      console.error('Error deleting class:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }
);

/**
 * PATCH /v1/classes/:classId/attendance/:bookingId - Mark attendance
 *
 * Body:
 * - attended: boolean (true = attended, false = no-show, null = pending)
 *
 * Requires trainer or manager role
 */
router.patch(
  '/:classId/attendance/:bookingId',
  authRequired(['owner', 'manager', 'staff']),
  tenantRequired(),
  async (req: TenantRequest, res: Response) => {
    try {
      const { companyId } = req.tenant!;
      const { classId, bookingId } = req.params;
      const { attended } = req.body;

      // Validate attended parameter
      if (attended !== true && attended !== false && attended !== null) {
        return res.status(422).json({
          error: 'INVALID_ATTENDED',
          message: 'attended must be true, false, or null',
          field: 'attended',
        });
      }

      // Verify the booking belongs to a class in this company
      const booking = await prisma.booking.findFirst({
        where: {
          id: bookingId,
          classId,
          membership: {
            companyId,
          },
        },
        include: {
          class: {
            include: {
              gym: true,
            },
          },
          membership: {
            include: {
              member: true,
            },
          },
        },
      });

      if (!booking) {
        return res.status(404).json({
          error: 'BOOKING_NOT_FOUND',
          message: 'Class booking not found',
        });
      }

      // Note: Current schema doesn't support attendance tracking
      // This would require adding attended and attendanceMarkedAt fields to Booking model
      // For now, we'll return a success response but not actually update anything

      res.json({
        message: 'Attendance tracking not yet implemented in current schema',
        booking: {
          id: booking.id,
          attended: null, // Would be updated when schema supports it
          attendanceMarkedAt: null,
          member: {
            id: booking.membership.member.id,
            name: `${booking.membership.member.firstName} ${booking.membership.member.lastName}`,
          },
        },
        note: 'Schema migration needed to support attendance tracking',
      });
    } catch (error) {
      logger.error(
        {
          error: error.message,
          companyId: req.tenant?.companyId,
          classId: req.params.classId,
          bookingId: req.params.bookingId,
        },
        'Mark attendance error'
      );

      res.status(500).json({
        message: 'Failed to update attendance',
      });
    }
  }
);

/**
 * Helper function to determine class status
 */
function getClassStatus(startsAt: Date, endsAt: Date): 'upcoming' | 'in-progress' | 'completed' {
  const now = new Date();

  if (now < startsAt) {
    return 'upcoming';
  } else if (now >= startsAt && now <= endsAt) {
    return 'in-progress';
  } else {
    return 'completed';
  }
}

export default router;
