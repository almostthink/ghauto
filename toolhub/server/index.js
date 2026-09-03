import express from "express";
import cors from "cors";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataPath = path.join(__dirname, "data.json");
const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

async function readData() {
  return JSON.parse(await fs.readFile(dataPath, "utf8"));
}
async function writeData(data) {
  await fs.writeFile(dataPath, JSON.stringify(data, null, 2));
}

app.get("/api/products", async (req, res) => {
  const data = await readData();
  const { category, q } = req.query;
  let products = data.products;
  if (category) products = products.filter(p => p.category.toLowerCase() === String(category).toLowerCase());
  if (q) {
    const needle = String(q).toLowerCase();
    products = products.filter(p =>
      [p.name, p.category, p.tag, p.description].join(" ").toLowerCase().includes(needle)
    );
  }
  res.json(products);
});

app.get("/api/products/:id", async (req, res) => {
  const data = await readData();
  const product = data.products.find(p => p.id === req.params.id || p.slug === req.params.id);
  if (!product) return res.status(404).json({ error: "Product not found" });
  res.json(product);
});

app.post("/api/products", async (req, res) => {
  const data = await readData();
  const product = { id: crypto.randomUUID(), ...req.body };
  data.products.unshift(product);
  await writeData(data);
  res.status(201).json(product);
});

app.put("/api/products/:id", async (req, res) => {
  const data = await readData();
  const index = data.products.findIndex(p => p.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: "Product not found" });
  data.products[index] = { ...data.products[index], ...req.body };
  await writeData(data);
  res.json(data.products[index]);
});

app.delete("/api/products/:id", async (req, res) => {
  const data = await readData();
  data.products = data.products.filter(p => p.id !== req.params.id);
  await writeData(data);
  res.status(204).end();
});

app.get("/api/stats", async (_req, res) => {
  const { products } = await readData();
  const totalDownloads = products.reduce((n, p) => n + Number(p.downloads || 0), 0);
  const averageRating = products.length
    ? products.reduce((n, p) => n + Number(p.rating || 0), 0) / products.length
    : 0;
  res.json({
    totalProducts: products.length,
    totalUsers: 50250,
    totalDownloads,
    averageRating: Number(averageRating.toFixed(1)),
    monthlyDownloads: [48, 62, 55, 81, 74, 96, 88, 112, 101, 128, 117, 142],
    countries: [
      ["United States", 28.5], ["India", 15.2], ["Brazil", 8.7],
      ["Germany", 6.3], ["United Kingdom", 4.8], ["France", 3.9], ["Canada", 3.1]
    ]
  });
});

const clientDist = path.resolve(__dirname, "../dist");
app.use(express.static(clientDist));
app.get("*", async (_req, res) => {
  try {
    res.sendFile(path.join(clientDist, "index.html"));
  } catch {
    res.status(404).send("Build the client first.");
  }
});

app.listen(PORT, () => console.log(`ToolHub API running on http://localhost:${PORT}`));
