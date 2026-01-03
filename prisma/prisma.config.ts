// Prisma 7 configuration for migrations
export default {
  datasources: {
    db: {
      url: process.env.DATABASE_URL!,
    },
  },
};

