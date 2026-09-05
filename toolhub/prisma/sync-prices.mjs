// Pushes the price label from catalog.js onto products that are already in the
// database. The seed deliberately never touches an existing product, so a
// corrected label in the file would otherwise only reach new installs.
//
//   node prisma/sync-prices.mjs          # show what would change
//   node prisma/sync-prices.mjs --apply  # write it
//
// Only `price` and `license` are written. Everything else, including anything
// edited in the panel, is left alone.
import { PrismaClient } from "@prisma/client";
import { CATALOG } from "./catalog.js";

const prisma = new PrismaClient();
const apply = process.argv.includes("--apply");

const slugify = (name) =>
  name.toLowerCase().replace(/\+/g, "-plus").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

async function main() {
  const changes = [];
  for (const item of CATALOG) {
    // Anything the file does not label Free or Premium is skipped rather than
    // guessed at.
    if (item.price !== "Free" && item.price !== "Premium") continue;
    const product = await prisma.product.findUnique({
      where: { slug: slugify(item.name) },
      select: { id: true, name: true, price: true, license: true }
    });
    if (!product) continue;
    if (product.price === item.price && product.license === item.price) continue;
    changes.push({ id: product.id, name: product.name, from: product.price, to: item.price });
  }

  if (!changes.length) {
    console.log("Every product already carries the price from the catalog.");
    return;
  }

  for (const change of changes) console.log(`  ${change.name}: ${change.from || "(empty)"} → ${change.to}`);
  if (!apply) {
    console.log(`\n${changes.length} product(s) would change. Re-run with --apply to write them.`);
    return;
  }

  await prisma.$transaction(
    changes.map((change) =>
      prisma.product.update({ where: { id: change.id }, data: { price: change.to, license: change.to } })
    )
  );
  console.log(`\nUpdated ${changes.length} product(s).`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
