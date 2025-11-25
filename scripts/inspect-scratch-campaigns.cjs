const { PrismaClient } = require("@prisma/client");

async function main() {
  const prisma = new PrismaClient();
  try {
    const campaigns = await prisma.campaign.findMany({
      where: { templateType: "SCRATCH_CARD" },
      select: { id: true, name: true, designConfig: true },
    });

    console.log("All SCRATCH_CARD campaigns (id, name, designConfig):\n");
    console.log(JSON.stringify(campaigns, null, 2));

    const bold = campaigns.filter(
      (c) => c.designConfig && c.designConfig.theme === "bold"
    );

    console.log("\nFiltered (theme === 'bold'):\n");
    console.log(JSON.stringify(bold, null, 2));
  } catch (error) {
    console.error("Error inspecting campaigns:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

