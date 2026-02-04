const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const ads = await prisma.ad.findMany({
    select: { adName: true, spend: true, leads: true, date: true },
    orderBy: { adName: 'asc' }
  });

  console.log('=== Données brutes dans la table Ad ===');
  ads.forEach(a => console.log(`${a.adName}: €${a.spend} | ${a.leads} leads | ${a.date.toISOString().split('T')[0]}`));

  console.log('\n=== Totaux par pub ===');
  const grouped = {};
  ads.forEach(a => {
    if (!grouped[a.adName]) grouped[a.adName] = { spend: 0, leads: 0, count: 0 };
    grouped[a.adName].spend += a.spend;
    grouped[a.adName].leads += a.leads;
    grouped[a.adName].count++;
  });
  Object.entries(grouped).forEach(([name, data]) => {
    console.log(`${name}: €${data.spend.toFixed(2)} total (${data.count} entrées) | ${data.leads} leads`);
  });

  const totalSpend = ads.reduce((sum, a) => sum + a.spend, 0);
  console.log(`\n=== TOTAL GLOBAL: €${totalSpend.toFixed(2)} ===`);

  await prisma.$disconnect();
}
check();
