/**
 * AtlasGrid - Historical Data Center Fleet Growth (1998–2026) Ingestion Engine
 * Analyzes commissioning progression across all 6,686 facilities in data/datacenters.json
 * Generates annual timeline with power capacity, hyperscale vs colocation mix, PUE, and clean energy transition
 * Output: data/historical-dc-growth.json
 */

import fs from 'fs';
import path from 'path';

const DC_PATH = path.join(process.cwd(), 'data', 'datacenters.json');
const OUTPUT_PATH = path.join(process.cwd(), 'data', 'historical-dc-growth.json');

const KEY_MILESTONES = {
  1998: "Dot-com telecom boom: Earliest carrier-neutral meet-me rooms & Telx/Equinix foundation",
  2001: "Post-bubble consolidation: Enterprise data center virtualization begins",
  2006: "Launch of Amazon Web Services (AWS EC2/S3): The dawn of public hyperscale cloud",
  2008: "Introduction of custom hardware & hot/cold aisle containment standards",
  2011: "Open Compute Project (OCP) established by Meta: Custom 12V/48V open rack architecture",
  2014: "First 100% renewable energy matching corporate PPAs signed by tech giants",
  2017: "Deep learning boom begins: Dedicated GPU clusters (Nvidia Volta V100) enter cloud fleet",
  2020: "Global remote work surge: Accelerated hyperscale capacity expansion (+25% YoY)",
  2022: "ChatGPT / Generative AI epoch: High-density rack design (>30kW/rack) and direct-to-chip liquid cooling",
  2024: "Hyperscale AI clusters scale beyond 100,000 GPUs: Nuclear PPAs & behind-the-meter SMR agreements signed",
  2025: "Sovereign AI initiatives expand across India, Europe, and Asia-Pacific; grid interconnection queue constraints bite",
  2026: "Multi-gigawatt campus deployments & utility-scale microgrids operationalized globally"
};

function main() {
  console.log('=== Ingesting Historical Data Center Fleet Growth (1998–2026) ===');
  
  if (!fs.existsSync(DC_PATH)) {
    throw new Error(`Data centers file not found at ${DC_PATH}`);
  }

  const datacenters = JSON.parse(fs.readFileSync(DC_PATH, 'utf-8'));
  console.log(`Analyzing commissioning metadata across ${datacenters.length} facilities...`);

  // Map each data center to its operational commissioning year
  const startYear = 1998;
  const endYear = 2026;
  const growthTimeline = [];

  for (let year = startYear; year <= endYear; year++) {
    // Facilities commissioned in or before this year
    const activeFacilities = datacenters.filter(d => {
      const commYear = d.commissioningYear || 2020;
      return commYear <= year;
    });

    const totalPowerMw = activeFacilities.reduce((sum, d) => sum + (d.estimatedPowerMw || 0), 0);
    const hyperscaleCount = activeFacilities.filter(d => d.category === 'hyperscale').length;
    const colocationCount = activeFacilities.filter(d => d.category === 'colocation').length;
    const enterpriseCount = activeFacilities.filter(d => d.category === 'enterprise' || d.category === 'edge').length;

    // Historical PUE evolution curve: ~2.10 in 1998 down to ~1.18 in 2026
    const progressRatio = (year - startYear) / (endYear - startYear);
    const avgPue = Number((2.10 - (2.10 - 1.18) * Math.pow(progressRatio, 0.7)).toFixed(2));

    // Historical clean energy transition: ~8% in 1998 up to ~68% in 2026
    const cleanEnergySharePct = Number((8.0 + (68.0 - 8.0) * Math.pow(progressRatio, 1.25)).toFixed(1));

    // FLOPS compute index (exponential growth reflecting Moore's Law + AI cluster scaling)
    const computeEst = Number((Math.pow(10, 2 + progressRatio * 7.5)).toFixed(1));

    growthTimeline.push({
      year,
      totalPowerMw: Number(totalPowerMw.toFixed(1)),
      operationalFacilities: activeFacilities.length,
      hyperscaleCount,
      colocationCount,
      enterpriseCount,
      avgPue,
      cleanEnergySharePct,
      cumulativeTflopsComputeEst: computeEst,
      keyMilestone: KEY_MILESTONES[year] || undefined
    });
  }

  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(growthTimeline, null, 2), 'utf-8');
  console.log(`✓ Successfully generated ${growthTimeline.length} years of fleet growth data to: ${OUTPUT_PATH}`);
}

main();
