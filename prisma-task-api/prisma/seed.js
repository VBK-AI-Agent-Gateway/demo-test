/**
 * Seed data: creates sample projects and tasks.
 * Usage: npm run seed  (requires DATABASE_URL and migrated database)
 */
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  // Clean existing data (idempotent seed)
  await prisma.task.deleteMany();
  await prisma.project.deleteMany();

  const projects = [
    {
      name: 'Website Redesign',
      description: 'Refresh the marketing site with a new look.',
      tasks: {
        create: [
          { title: 'Audit current pages', description: 'List pages and pain points', status: 'DONE', priority: 'HIGH' },
          { title: 'Design new homepage', status: 'IN_PROGRESS', priority: 'HIGH' },
          { title: 'Implement hero section', status: 'TODO', priority: 'MEDIUM' },
        ],
      },
    },
    {
      name: 'Mobile App',
      description: 'Cross-platform mobile client.',
      tasks: {
        create: [
          { title: 'Set up React Native project', status: 'DONE', priority: 'MEDIUM' },
          { title: 'Build login screen', status: 'IN_PROGRESS', priority: 'HIGH' },
          { title: 'Push notifications', status: 'TODO', priority: 'LOW' },
          { title: 'Offline cache', status: 'TODO', priority: 'MEDIUM' },
        ],
      },
    },
    {
      name: 'Data Pipeline',
      description: 'ETL jobs for analytics.',
      tasks: {
        create: [
          { title: 'Define schema', status: 'DONE', priority: 'HIGH' },
          { title: 'Write extractor', description: 'Pull from REST API', status: 'TODO', priority: 'MEDIUM' },
        ],
      },
    },
  ];

  for (const p of projects) {
    await prisma.project.create({ data: p });
  }

  const count = await prisma.project.count();
  const taskCount = await prisma.task.count();
  console.log(`Seeded ${count} projects and ${taskCount} tasks.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });