import {Router} from 'express';
import prisma from '../database/prisma.js';
import {requireAuth} from '../middleware/auth.js';
import {validateQuery} from '../middleware/validate.js';
import {ListUsersQuerySchema} from 'shared';

const router = Router();
router.use(requireAuth);

router.get('/', validateQuery(ListUsersQuerySchema), async (req, res) => {
  try {
    const {search, page, limit} = req.query;
    const take = limit;
    const skip = (page - 1) * take;

    const where = search
      ? {
        OR: [
          {email: {contains: search}},
          {fullname: {contains: search}},
        ],
      }
      : {};

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {id: true, email: true, fullname: true, isOnline: true},
        orderBy: [{isOnline: 'desc'}, {fullname: 'asc'}, {email: 'asc'}],
        take,
        skip,
      }),
      prisma.user.count({where}),
    ]);

    res.json({
      users,
      total,
      page,
      totalPages: Math.ceil(total / take),
    });
  } catch (err) {
    res.status(500).json({error: err.message});
  }
});

export default router;