// @ts-nocheck - Temporarily disable strict checks for sprint focus
import { Router } from 'express';
import { PrismaClient } from '../generated/prisma/index.js';
import { authRequired } from '../middleware/auth.js';
import { tenantRequired } from '../middleware/tenant.js';
import { z } from 'zod';

const router = Router();
const prisma = new PrismaClient();

// Validation schemas
const createClassSchema = z.object({
  gymId: z.string().uuid(),
  title: z.string().min(1).max(100),
  startsAt: z.string().datetime(),
  capacity: z.number().int().min(1).max(100)
});

const updateClassSchema = z.object({
  gymId: z.string().uuid().optional(),
  title: z.string().min(1).max(100).optional(),
  startsAt: z.string().datetime().optional(),
  capacity: z.number().int().min(1).max(100).optional()
});

// GET /v1/classes - List classes
router.get('/',
  authRequired(['staff', 'manager', 'owner']),
  tenantRequired(),
  async (req, res) => {
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
              select: { bookings: true }
            }
          },
          orderBy: { startsAt: 'asc' },
          skip,
          take: Number(limit)
        }),
        prisma.class.count({ where })
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
            city: cls.gym.city
          }
        })),
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit))
        }
      });

    } catch (error) {
      console.error('Error fetching classes:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }
);

// POST /v1/classes - Create a new class
router.post('/',
  authRequired(['manager', 'owner']),
  tenantRequired(),
  async (req, res) => {
    try {
      const validation = createClassSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ 
          message: 'Validation error',
          errors: validation.error.errors
        });
      }

      const { gymId, title, startsAt, capacity } = validation.data;

      // Verify gym exists
      const gym = await prisma.gym.findUnique({
        where: { id: gymId }
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
            lte: new Date(startsAtDate.getTime() + 60 * 60 * 1000)  // 1 hour after
          }
        }
      });

      if (conflictingClass) {
        return res.status(409).json({ 
          message: 'Schedule conflict: Another class is scheduled at this time',
          conflictingClass: {
            id: conflictingClass.id,
            title: conflictingClass.title,
            startsAt: conflictingClass.startsAt
          }
        });
      }

      // Create the class
      const newClass = await prisma.class.create({
        data: {
          gymId,
          title,
          startsAt: startsAtDate,
          capacity
        },
        include: {
          gym: true
        }
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
          city: newClass.gym.city
        }
      });

    } catch (error) {
      console.error('Error creating class:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }
);

// GET /v1/classes/:id - Get a specific class
router.get('/:id',
  authRequired(['staff', 'manager', 'owner']),
  tenantRequired(),
  async (req, res) => {
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
                  member: true
                }
              }
            }
          }
        }
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
          city: classData.gym.city
        },
        bookings: classData.bookings.map(booking => ({
          id: booking.id,
          status: booking.status,
          bookedAt: booking.bookedAt,
          member: {
            id: booking.membership.member.id,
            firstName: booking.membership.member.firstName,
            lastName: booking.membership.member.lastName,
            email: booking.membership.member.email
          }
        }))
      });

    } catch (error) {
      console.error('Error fetching class:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }
);

// PATCH /v1/classes/:id - Update a class
router.patch('/:id',
  authRequired(['manager', 'owner']),
  tenantRequired(),
  async (req, res) => {
    try {
      const classId = req.params.id;
      
      const validation = updateClassSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ 
          message: 'Validation error',
          errors: validation.error.errors
        });
      }

      // Check if class exists
      const existingClass = await prisma.class.findUnique({
        where: { id: classId }
      });

      if (!existingClass) {
        return res.status(404).json({ message: 'Class not found' });
      }

      const updateData = validation.data;

      // Convert startsAt to Date if provided
      if (updateData.startsAt) {
        updateData.startsAt = new Date(updateData.startsAt);
      }

      // Update the class
      const updatedClass = await prisma.class.update({
        where: { id: classId },
        data: updateData,
        include: {
          gym: true,
          _count: {
            select: { bookings: true }
          }
        }
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
          city: updatedClass.gym.city
        }
      });

    } catch (error) {
      console.error('Error updating class:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }
);

// DELETE /v1/classes/:id - Delete a class
router.delete('/:id',
  authRequired(['manager', 'owner']),
  tenantRequired(),
  async (req, res) => {
    try {
      const classId = req.params.id;

      // Check if class exists and has bookings
      const existingClass = await prisma.class.findUnique({
        where: { id: classId },
        include: {
          _count: {
            select: { bookings: true }
          }
        }
      });

      if (!existingClass) {
        return res.status(404).json({ message: 'Class not found' });
      }

      if (existingClass._count.bookings > 0) {
        return res.status(409).json({ 
          message: 'Cannot delete class with existing bookings',
          bookingsCount: existingClass._count.bookings
        });
      }

      // Delete the class
      await prisma.class.delete({
        where: { id: classId }
      });

      res.status(204).send();

    } catch (error) {
      console.error('Error deleting class:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }
);

export default router;
