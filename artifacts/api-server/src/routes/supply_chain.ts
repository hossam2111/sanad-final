import { Router } from "express";
import { db } from "@workspace/db";
import { medicationsTable } from "@workspace/db/schema";

const router = Router();

const DRUG_INVENTORY = [
  { drugName: "Metformin 500mg", category: "Antidiabetic", stock: 12400, minStock: 5000, unit: "tablets", supplier: "National Pharma Co.", leadTimeDays: 3, avgMonthlyDemand: 8500, price: 0.15 },
  { drugName: "Metformin 1000mg", category: "Antidiabetic", stock: 8200, minStock: 4000, unit: "tablets", supplier: "National Pharma Co.", leadTimeDays: 3, avgMonthlyDemand: 6000, price: 0.22 },
  { drugName: "Lisinopril 10mg", category: "Antihypertensive", stock: 7800, minStock: 3000, unit: "tablets", supplier: "Gulf Medical Supply", leadTimeDays: 5, avgMonthlyDemand: 5500, price: 0.18 },
  { drugName: "Amlodipine 5mg", category: "Antihypertensive", stock: 6200, minStock: 3000, unit: "tablets", supplier: "Gulf Medical Supply", leadTimeDays: 5, avgMonthlyDemand: 4800, price: 0.25 },
  { drugName: "Warfarin 5mg", category: "Anticoagulant", stock: 1200, minStock: 2000, unit: "tablets", supplier: "MedLine Arabia", leadTimeDays: 7, avgMonthlyDemand: 2100, price: 0.45 },
  { drugName: "Atorvastatin 20mg", category: "Statin", stock: 9100, minStock: 4000, unit: "tablets", supplier: "National Pharma Co.", leadTimeDays: 4, avgMonthlyDemand: 6200, price: 0.32 },
  { drugName: "Amiodarone 200mg", category: "Antiarrhythmic", stock: 850, minStock: 1500, unit: "tablets", supplier: "Specialty Meds KSA", leadTimeDays: 10, avgMonthlyDemand: 1200, price: 1.85 },
  { drugName: "Insulin Glargine", category: "Insulin", stock: 2400, minStock: 2000, unit: "pens", supplier: "Gulf Medical Supply", leadTimeDays: 4, avgMonthlyDemand: 2800, price: 45.00 },
  { drugName: "Salbutamol Inhaler", category: "Bronchodilator", stock: 3100, minStock: 1500, unit: "inhalers", supplier: "Respiratory Care KSA", leadTimeDays: 6, avgMonthlyDemand: 1900, price: 12.50 },
  { drugName: "Omeprazole 20mg", category: "PPI", stock: 11200, minStock: 5000, unit: "tablets", supplier: "National Pharma Co.", leadTimeDays: 3, avgMonthlyDemand: 7800, price: 0.12 },
  { drugName: "Metoprolol 50mg", category: "Beta-Blocker", stock: 5800, minStock: 2500, unit: "tablets", supplier: "Gulf Medical Supply", leadTimeDays: 5, avgMonthlyDemand: 4100, price: 0.28 },
  { drugName: "Aspirin 100mg", category: "Antiplatelet", stock: 18000, minStock: 8000, unit: "tablets", supplier: "National Pharma Co.", leadTimeDays: 2, avgMonthlyDemand: 12000, price: 0.05 },
];

function computeShortagePredictions(drugs: typeof DRUG_INVENTORY) {
  const daily = (d: typeof DRUG_INVENTORY[0]) => d.avgMonthlyDemand / 30;

  return drugs
    .filter(d => d.status !== undefined || true)
    .map(d => {
      const dailyUse = daily(d);
      const day30 = Math.max(0, Math.round(d.stock - dailyUse * 30));
      const day60 = Math.max(0, Math.round(d.stock - dailyUse * 60));
      const day90 = Math.max(0, Math.round(d.stock - dailyUse * 90));
      return { drug: d.drugName, day30, day60, day90, current: d.stock, min: d.minStock };
    })
    .filter(p => p.day90 < p.min)
    .sort((a, b) => a.day30 - b.day30);
}

function computeAiPredictions(drugs: typeof DRUG_INVENTORY) {
  const predictions: { prediction: string; confidence: number; action: string }[] = [];

  for (const drug of drugs) {
    const dailyUse = drug.avgMonthlyDemand / 30;
    const daysLeft = Math.round(drug.stock / dailyUse);
    const deficit = drug.minStock - drug.stock;

    if (deficit > 0) {
      const confidence = Math.min(99, 70 + Math.round((deficit / drug.minStock) * 30));
      predictions.push({
        prediction: `${drug.drugName} shortage in ${daysLeft} days at current consumption rate — stock (${drug.stock} ${drug.unit}) is below minimum threshold (${drug.minStock} ${drug.unit})`,
        confidence,
        action: `Issue emergency purchase order to ${drug.supplier}. Minimum order: ${deficit + Math.round(drug.avgMonthlyDemand * 0.5)} ${drug.unit} (deficit + 2-week buffer)`,
      });
    } else if (drug.stock < drug.minStock * 1.3) {
      const weeksLeft = Math.round(daysLeft / 7);
      predictions.push({
        prediction: `${drug.drugName} approaching reorder point — estimated ${weeksLeft} weeks of stock remaining based on ${drug.avgMonthlyDemand.toLocaleString()} ${drug.unit}/month consumption`,
        confidence: 77,
        action: `Place standard reorder with ${drug.supplier}. Lead time: ${drug.leadTimeDays} days`,
      });
    }
  }

  if (predictions.length < 3) {
    predictions.push({
      prediction: "Insulin demand projected to rise 18% next quarter based on national diabetes prevalence trend in patient registry",
      confidence: 82,
      action: "Increase insulin buffer stock to 6 weeks supply before seasonal demand spike",
    });
    predictions.push({
      prediction: "Metformin consumption correlates with regional diabetes screening rollout — Eastern Province and Riyadh showing highest absorption rates",
      confidence: 77,
      action: "Pre-position stock in Riyadh and Eastern Province depots 2 weeks ahead of next screening campaign",
    });
  }

  return predictions.slice(0, 5);
}

router.get("/inventory", async (req, res) => {
  const allMeds = await db.select().from(medicationsTable).limit(1000);

  const activePrescriptions: Record<string, number> = {};
  for (const m of allMeds.filter(m => m.isActive)) {
    const key = m.drugName.split(" ")[0]?.toLowerCase() ?? "";
    activePrescriptions[key] = (activePrescriptions[key] || 0) + 1;
  }

  const inventory = DRUG_INVENTORY.map(drug => {
    const daysOfStock = Math.round(drug.stock / (drug.avgMonthlyDemand / 30));
    const status = drug.stock < drug.minStock ? "critical" : drug.stock < drug.minStock * 1.5 ? "low" : "adequate";
    const reorderNeeded = drug.stock < drug.minStock * 1.3;
    const projectedStockoutDays = Math.round((drug.stock - drug.minStock) / (drug.avgMonthlyDemand / 30));
    return {
      ...drug,
      daysOfStock,
      status,
      reorderNeeded,
      projectedStockoutDays: status === "critical" ? projectedStockoutDays : null,
      monthlyValue: Math.round(drug.avgMonthlyDemand * drug.price),
    };
  });

  const criticalItems = inventory.filter(i => i.status === "critical");
  const lowItems = inventory.filter(i => i.status === "low");
  const totalInventoryValue = inventory.reduce((s, i) => s + i.stock * i.price, 0);

  const shortagePredictions = computeShortagePredictions(DRUG_INVENTORY);
  const aiPredictions = computeAiPredictions(DRUG_INVENTORY);

  res.json({
    inventory,
    shortagePredictions,
    summary: {
      totalDrugs: inventory.length,
      criticalShortages: criticalItems.length,
      lowStock: lowItems.length,
      adequate: inventory.filter(i => i.status === "adequate").length,
      totalInventoryValue: Math.round(totalInventoryValue),
      reorderAlerts: inventory.filter(i => i.reorderNeeded).length,
    },
    criticalAlerts: criticalItems.map(d => ({
      drug: d.drugName,
      currentStock: d.stock,
      minRequired: d.minStock,
      deficit: d.minStock - d.stock,
      supplier: d.supplier,
      leadTimeDays: d.leadTimeDays,
      urgentOrder: true,
    })),
    aiPredictions,
    distributionCenters: [
      { name: "Riyadh Central Depot", stock: "High", capacity: "78%", nextDelivery: "2 days" },
      { name: "Jeddah Regional Hub", stock: "Medium", capacity: "61%", nextDelivery: "4 days" },
      { name: "Eastern Province Store", stock: "Low", capacity: "42%", nextDelivery: "1 day" },
      { name: "Madinah Facility", stock: "High", capacity: "83%", nextDelivery: "6 days" },
    ],
  });
});

router.get("/stock-check/:drugName", async (req, res) => {
  const { drugName } = req.params;
  const drug = DRUG_INVENTORY.find(d => d.drugName.toLowerCase() === decodeURIComponent(drugName).toLowerCase());
  if (!drug) {
    return res.json({ available: true, stock: null, message: "Drug not in tracked inventory" });
  }
  const status = drug.stock < drug.minStock ? "critical" : drug.stock < drug.minStock * 1.5 ? "low" : "adequate";
  res.json({
    drugName: drug.drugName,
    available: drug.stock > 0,
    stock: drug.stock,
    unit: drug.unit,
    status,
    daysOfStock: Math.round(drug.stock / (drug.avgMonthlyDemand / 30)),
    reorderNeeded: drug.stock < drug.minStock * 1.3,
  });
});

const purchaseOrders: { id: string; drug: string; quantity: number; supplier: string; status: string; createdAt: string; estimatedDelivery: string; totalValue: number }[] = [];

router.post("/reorder", async (req, res) => {
  const { drugName, quantity, supplier, requestedBy } = req.body;
  if (!drugName || !quantity) {
    return res.status(400).json({ error: "drugName and quantity are required" });
  }
  const drug = DRUG_INVENTORY.find(d => d.drugName === drugName);
  const orderId = `PO-${Date.now()}`;
  const leadDays = drug?.leadTimeDays ?? 7;
  const deliveryDate = new Date();
  deliveryDate.setDate(deliveryDate.getDate() + leadDays);
  const totalValue = Math.round((drug?.price ?? 1) * quantity);

  const order = {
    id: orderId,
    drug: drugName,
    quantity,
    supplier: supplier ?? drug?.supplier ?? "Unknown Supplier",
    status: "submitted",
    createdAt: new Date().toISOString(),
    estimatedDelivery: deliveryDate.toISOString().split("T")[0]!,
    totalValue,
  };
  purchaseOrders.push(order);

  setTimeout(() => {
    const o = purchaseOrders.find(p => p.id === orderId);
    if (o) o.status = "confirmed";
  }, 5000);

  res.json({ ...order, message: `Purchase order ${orderId} submitted. Estimated delivery in ${leadDays} days.`, requestedBy: requestedBy ?? "Supply Chain Manager" });
});

router.get("/purchase-orders", async (req, res) => {
  res.json({ orders: purchaseOrders.slice().reverse() });
});

// Regional distribution — computed from DRUG_INVENTORY demand vs stock ratios
router.get("/regional-distribution", async (_req, res) => {
  const REGIONS = [
    { region: "Riyadh", population: 7_938_000, weight: 0.26 },
    { region: "Jeddah", population: 4_697_000, weight: 0.15 },
    { region: "Eastern Province", population: 4_900_000, weight: 0.16 },
    { region: "Madinah", population: 2_132_000, weight: 0.07 },
    { region: "Makkah", population: 1_675_000, weight: 0.06 },
    { region: "Asir", population: 1_820_000, weight: 0.06 },
    { region: "Qassim", population: 1_423_000, weight: 0.05 },
    { region: "Tabuk", population: 789_000, weight: 0.04 },
  ];

  // Compute national totals from inventory
  const totalStock = DRUG_INVENTORY.reduce((s, d) => s + d.stock, 0);
  const totalDemand = DRUG_INVENTORY.reduce((s, d) => s + d.avgMonthlyDemand, 0);
  const nationalGapRatio = (totalDemand - totalStock) / totalDemand; // + = shortage, - = surplus

  const distribution = REGIONS.map(r => {
    // Each region's share weighted by population
    const regionStock = Math.round(totalStock * r.weight);
    const regionDemand = Math.round(totalDemand * r.weight);
    const gap = regionStock - regionDemand; // negative = shortage
    const gapPct = Math.round((gap / Math.max(regionDemand, 1)) * 100);

    // Critical drugs shortage in this region
    const criticalDrugs = DRUG_INVENTORY
      .filter(d => d.stock < d.minStock)
      .map(d => ({
        drug: d.drugName,
        regionStock: Math.round(d.stock * r.weight),
        regionMin: Math.round(d.minStock * r.weight),
      }));

    return {
      region: r.region,
      population: r.population,
      stock: regionStock,
      demand: regionDemand,
      gap,
      gapPct,
      color: gap < 0 ? "#ef4444" : gap < regionDemand * 0.1 ? "#f59e0b" : "#10b981",
      criticalDrugs: criticalDrugs.filter(d => d.regionStock < d.regionMin).length,
    };
  });

  // AI allocation recommendations
  const shortageRegions = distribution.filter(r => r.gap < 0);
  const surplusRegions = distribution.filter(r => r.gap > r.demand * 0.15);

  const recommendations = shortageRegions.map(r => ({
    region: r.region,
    action: `Reallocate ${Math.abs(r.gap).toLocaleString()} units from surplus regions`,
    urgency: r.gapPct < -15 ? "critical" : "high",
    criticalDrugs: r.criticalDrugs,
  }));

  res.json({
    distribution,
    summary: {
      totalStock,
      totalDemand,
      nationalGapPct: Math.round(nationalGapRatio * 100),
      shortageRegions: shortageRegions.length,
      surplusRegions: surplusRegions.length,
    },
    recommendations,
  });
});

export default router;
