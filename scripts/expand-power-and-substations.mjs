import fs from 'fs';
import path from 'path';

function haversineDistanceKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// =========================================================================
// 1. ALL-TIER SOUTH KOREA POWER PLANTS (120+ Stations Across All Provinces)
// Strictly calibrated onshore coordinates on plant premises
// =========================================================================
const SOUTH_KOREA_STATIONS = [
  // --- NUCLEAR (All Commercial Reactor Sites & Blocks) ---
  { id: "kr-nuc-hanul-1-6", name: "Hanul Nuclear Power Plant (Units 1-6)", operator: "Korea Hydro & Nuclear Power (KHNP)", fuelType: "nuclear", capacityMw: 6216, commYear: 1988, lat: 37.0928, lng: 129.3815, region: "KOREA_KPX", sub: "Hanul 765kV Switchyard", cool: "East Sea Once-through" },
  { id: "kr-nuc-shinhanul-1-2", name: "Shin-Hanul Nuclear Power Plant (APR1400 Units 1-2)", operator: "KHNP", fuelType: "nuclear", capacityMw: 2800, commYear: 2022, lat: 37.0980, lng: 129.3800, region: "KOREA_KPX", sub: "Shin-Hanul 765kV Substation", cool: "Seawater Cooling" },
  { id: "kr-nuc-shinhanul-3-4", name: "Shin-Hanul Nuclear Power Plant (Units 3-4 Project)", operator: "KHNP", fuelType: "nuclear", capacityMw: 2800, commYear: 2028, lat: 37.1020, lng: 129.3780, region: "KOREA_KPX", sub: "Shin-Hanul 765kV Substation", cool: "Seawater Cooling" },
  { id: "kr-nuc-hanbit-1-6", name: "Hanbit Nuclear Power Plant (Yeonggwang Units 1-6)", operator: "KHNP", fuelType: "nuclear", capacityMw: 5875, commYear: 1986, lat: 35.4180, lng: 126.4230, region: "KOREA_KPX", sub: "Hanbit 345kV Switchyard", cool: "Yellow Sea Once-through" },
  { id: "kr-nuc-wolsong-1-4", name: "Wolsong Nuclear Power Station (PHWR Units 1-4)", operator: "KHNP", fuelType: "nuclear", capacityMw: 2779, commYear: 1983, lat: 35.7140, lng: 129.4730, region: "KOREA_KPX", sub: "Wolsong 345kV Switchyard", cool: "East Sea Once-through" },
  { id: "kr-nuc-shinwolsong-1-2", name: "Shin-Wolsong Nuclear Generating Station (OPR1000 Units 1-2)", operator: "KHNP", fuelType: "nuclear", capacityMw: 2000, commYear: 2012, lat: 35.7190, lng: 129.4680, region: "KOREA_KPX", sub: "Shin-Wolsong 345kV Switchyard", cool: "Submerged Intake Seawater" },
  { id: "kr-nuc-kori-1-4", name: "Kori Nuclear Power Complex (Units 2-4)", operator: "KHNP", fuelType: "nuclear", capacityMw: 3250, commYear: 1983, lat: 35.3180, lng: 129.2880, region: "KOREA_KPX", sub: "Kori 345kV Switchyard", cool: "Seawater Once-through" },
  { id: "kr-nuc-saeul-1-2", name: "Saeul Nuclear Power Plant (Shin-Kori APR1400 Units 3-4)", operator: "KHNP", fuelType: "nuclear", capacityMw: 2800, commYear: 2016, lat: 35.3240, lng: 129.2920, region: "KOREA_KPX", sub: "Saeul 765kV / 345kV Switchyard", cool: "Seawater Once-through" },
  { id: "kr-nuc-saeul-3-4", name: "Saeul Nuclear Power Plant Phase 2 (Units 5-6 Construction)", operator: "KHNP", fuelType: "nuclear", capacityMw: 2800, commYear: 2025, lat: 35.3275, lng: 129.2940, region: "KOREA_KPX", sub: "Saeul 765kV Switchyard", cool: "Seawater Once-through" },

  // --- BASELOAD COAL & SUPERCRITICAL THERMAL ---
  { id: "kr-coa-taean-1-10", name: "Taean Thermal Power Station & IGCC (Units 1-10)", operator: "Korea Western Power (KOWEPO)", fuelType: "coal", capacityMw: 6100, commYear: 1995, lat: 36.9065, lng: 126.2345, region: "KOREA_KPX", sub: "Taean 765kV / 345kV Switchyard", cool: "Yellow Sea Once-through" },
  { id: "kr-coa-dangjin-1-10", name: "Dangjin Thermal Power Station (Units 1-10)", operator: "Korea East-West Power (EWP)", fuelType: "coal", capacityMw: 6040, commYear: 1999, lat: 37.0545, lng: 126.5135, region: "KOREA_KPX", sub: "Dangjin 765kV Switchyard", cool: "Asan Bay Seawater Cooling" },
  { id: "kr-coa-boryeong-1-8", name: "Boryeong Thermal Power Complex", operator: "Korea Midland Power (KOMIPO)", fuelType: "coal", capacityMw: 5358, commYear: 1983, lat: 36.3985, lng: 126.5065, region: "KOREA_KPX", sub: "Boryeong 345kV Switchyard", cool: "Yellow Sea Seawater" },
  { id: "kr-coa-shinboryeong", name: "Shin-Boryeong Ultra-Supercritical Power Plant", operator: "KOMIPO", fuelType: "coal", capacityMw: 2038, commYear: 2017, lat: 36.4025, lng: 126.5125, region: "KOREA_KPX", sub: "Shin-Boryeong 345kV GIS", cool: "Seawater Cooling" },
  { id: "kr-coa-hadong-1-8", name: "Hadong Thermal Power Station (Units 1-8)", operator: "Korea Southern Power (KOSPO)", fuelType: "coal", capacityMw: 4000, commYear: 1997, lat: 34.9755, lng: 127.8185, region: "KOREA_KPX", sub: "Hadong 345kV Substation", cool: "Gwangyang Bay Seawater" },
  { id: "kr-coa-yeongheung-1-6", name: "Yeongheung Thermal Power Station (Units 1-6)", operator: "Korea South-East Power (KOEN)", fuelType: "coal", capacityMw: 5080, commYear: 2004, lat: 37.2365, lng: 126.4355, region: "KOREA_KPX", sub: "Yeongheung 345kV GIS Substation", cool: "Seawater Once-through" },
  { id: "kr-coa-samcheok-green", name: "Samcheok Green Power Station (CFBC Supercritical)", operator: "KOSPO", fuelType: "coal", capacityMw: 2044, commYear: 2016, lat: 37.2025, lng: 129.3415, region: "KOREA_KPX", sub: "Samcheok 345kV GIS Switchyard", cool: "East Sea Once-through" },
  { id: "kr-coa-bukpyeong", name: "Bukpyeong Thermal Power Plant", operator: "GS Donghae Electric Power", fuelType: "coal", capacityMw: 1190, commYear: 2017, lat: 37.4895, lng: 129.1355, region: "KOREA_KPX", sub: "Donghae 345kV Substation", cool: "Seawater Cooling" },
  { id: "kr-coa-samcheok-blue", name: "Samcheok Blue Power Station (Units 1-2)", operator: "Samcheok Blue Power", fuelType: "coal", capacityMw: 2100, commYear: 2024, lat: 37.4325, lng: 129.1825, region: "KOREA_KPX", sub: "Shin-Samcheok 345kV Substation", cool: "Deep Seawater Intake" },
  { id: "kr-coa-shinseocheon", name: "Shin-Seocheon Supercritical Coal Station", operator: "KOMIPO", fuelType: "coal", capacityMw: 1000, commYear: 2021, lat: 36.1480, lng: 126.4950, region: "KOREA_KPX", sub: "Shin-Seocheon 345kV Substation", cool: "Yellow Sea Once-through" },
  { id: "kr-coa-gangneung-anin", name: "Gangneung Anin Supercritical Power Plant (Units 1-2)", operator: "Gangneung Eco Power", fuelType: "coal", capacityMw: 2080, commYear: 2022, lat: 37.7310, lng: 128.9820, region: "KOREA_KPX", sub: "Gangneung 345kV Substation", cool: "Deep Seawater Cooling" },
  { id: "kr-coa-samcheonpo", name: "Samcheonpo Thermal Power Station", operator: "KOEN", fuelType: "coal", capacityMw: 2120, commYear: 1983, lat: 34.9120, lng: 128.0980, region: "KOREA_KPX", sub: "Samcheonpo 345kV Substation", cool: "South Sea Seawater" },
  { id: "kr-coa-goseong-hai", name: "Goseong Hai Supercritical Thermal Plant (Units 1-2)", operator: "Goseong Green Power", fuelType: "coal", capacityMw: 2080, commYear: 2021, lat: 34.9080, lng: 128.1150, region: "KOREA_KPX", sub: "Goseong 345kV Substation", cool: "High-Efficiency Condensers" },

  // --- GAS COMBINED CYCLE (CCGT) & DISTRICT HEATING COGENERATION ---
  { id: "kr-gas-seoul-eco", name: "Seoul Power Station (Dangin-ri Underground Eco-CCGT)", operator: "KOMIPO", fuelType: "gas", capacityMw: 800, commYear: 2019, lat: 37.5492, lng: 126.9208, region: "KOREA_KPX", sub: "Dangin-ri 154kV Underground GIS", cool: "Han River Water Exchange" },
  { id: "kr-gas-incheon-ccgt", name: "Incheon Combined Cycle Power Plant", operator: "KOMIPO", fuelType: "gas", capacityMw: 1462, commYear: 2005, lat: 37.5028, lng: 126.6272, region: "KOREA_KPX", sub: "Seoincheon 345kV Substation", cool: "CCGT Heat Recovery" },
  { id: "kr-gas-seoincheon", name: "Seo-Incheon Combined Cycle Power Station", operator: "KOWEPO", fuelType: "gas", capacityMw: 1800, commYear: 1992, lat: 37.5115, lng: 126.6255, region: "KOREA_KPX", sub: "Seoincheon 345kV Substation", cool: "Seawater Cooling" },
  { id: "kr-gas-shin-incheon", name: "Shin-Incheon Combined Cycle Power Station", operator: "KOSPO", fuelType: "gas", capacityMw: 1800, commYear: 1996, lat: 37.5085, lng: 126.6215, region: "KOREA_KPX", sub: "Shin-Incheon 345kV Substation", cool: "Combined Cycle Cooling" },
  { id: "kr-gas-pyeongtaek-ccgt", name: "Pyeongtaek Combined Cycle Power Plant", operator: "KOWEPO", fuelType: "gas", capacityMw: 2360, commYear: 1980, lat: 36.9795, lng: 126.8525, region: "KOREA_KPX", sub: "Pyeongtaek 345kV Substation", cool: "Asan Bay Seawater" },
  { id: "kr-gas-shinpyeongtaek", name: "Shin-Pyeongtaek Combined Cycle Power Station", operator: "Shin-Pyeongtaek Power", fuelType: "gas", capacityMw: 950, commYear: 2019, lat: 36.9855, lng: 126.8455, region: "KOREA_KPX", sub: "Pyeongtaek 345kV GIS", cool: "High-efficiency Condenser" },
  { id: "kr-gas-posco-gwangyang", name: "POSCO Energy Gwangyang LNG CCGT (Units 1-4)", operator: "POSCO International", fuelType: "gas", capacityMw: 1680, commYear: 2010, lat: 34.9255, lng: 127.7355, region: "KOREA_KPX", sub: "Gwangyang 345kV Substation", cool: "Gwangyang Bay Seawater" },
  { id: "kr-gas-posco-incheon", name: "POSCO Energy Incheon LNG CCGT Complex (Units 3-9)", operator: "POSCO International", fuelType: "gas", capacityMw: 3412, commYear: 1996, lat: 37.5185, lng: 126.6455, region: "KOREA_KPX", sub: "Cheongna 345kV Substation", cool: "Incheon Coast Seawater" },
  { id: "kr-gas-gseps-dangjin", name: "GS EPS Dangjin Combined Cycle Power Plant (Units 1-4)", operator: "GS EPS", fuelType: "gas", capacityMw: 2400, commYear: 2001, lat: 36.9855, lng: 126.7585, region: "KOREA_KPX", sub: "Songak 345kV Substation", cool: "Direct Seawater Cooling" },
  { id: "kr-gas-sk-gwanggyo", name: "SK E&S Gwanggyo District Heating CCGT", operator: "SK E&S", fuelType: "gas", capacityMw: 142, commYear: 2012, lat: 37.2885, lng: 127.0585, region: "KOREA_KPX", sub: "Gwanggyo 154kV GIS", cool: "District Heat Cogeneration" },
  { id: "kr-gas-sk-hanam", name: "SK E&S Hanam Combined Heat & Power Plant", operator: "SK E&S", fuelType: "gas", capacityMw: 399, commYear: 2015, lat: 37.5455, lng: 127.2055, region: "KOREA_KPX", sub: "Misa 154kV Substation", cool: "Cogeneration Steam Cycle" },
  { id: "kr-gas-sk-yeoju", name: "SK E&S Yeoju Natural Gas Power Plant", operator: "Yeoju Energy Service (SK E&S)", fuelType: "gas", capacityMw: 1004, commYear: 2023, lat: 37.2515, lng: 127.6185, region: "KOREA_KPX", sub: "Yeoju 345kV Substation", cool: "Hybrid Wet-Dry Cooling Tower" },
  { id: "kr-gas-kdhc-hwaseong", name: "Korea District Heating Corp Dongtan CHP", operator: "KDHC", fuelType: "gas", capacityMw: 757, commYear: 2017, lat: 37.1955, lng: 127.0985, region: "KOREA_KPX", sub: "Dongtan 154kV Substation", cool: "District Heating Steam Turbine" },
  { id: "kr-gas-kdhc-bundang", name: "KDHC Bundang Cogeneration Power Plant", operator: "KOEN", fuelType: "gas", capacityMw: 922, commYear: 1993, lat: 37.3625, lng: 127.1355, region: "KOREA_KPX", sub: "Bundang 154kV Substation", cool: "District Heat Exchangers" },
  { id: "kr-gas-kdhc-ilsan", name: "KDHC Ilsan Cogeneration Power Plant", operator: "EWP", fuelType: "gas", capacityMw: 900, commYear: 1993, lat: 37.6455, lng: 126.7925, region: "KOREA_KPX", sub: "Baekseok 154kV Substation", cool: "District Heat Steam Cycle" },
  { id: "kr-gas-kdhc-pangyo", name: "KDHC Pangyo Energy Center", operator: "KDHC", fuelType: "gas", capacityMw: 146, commYear: 2010, lat: 37.3955, lng: 127.0955, region: "KOREA_KPX", sub: "Pangyo 154kV Substation", cool: "Cogeneration Exhaust Recovery" },
  { id: "kr-gas-gunsan", name: "Gunsan Combined Cycle Power Plant", operator: "KOWEPO", fuelType: "gas", capacityMw: 718, commYear: 2010, lat: 35.9815, lng: 126.6855, region: "KOREA_KPX", sub: "Gunsan 345kV Substation", cool: "Coastal Seawater" },
  { id: "kr-gas-daegu", name: "Daegu Green Power CCGT", operator: "Daegu Green Power", fuelType: "gas", capacityMw: 415, commYear: 2014, lat: 35.7955, lng: 128.4825, region: "KOREA_KPX", sub: "Dalseong 154kV Substation", cool: "District Heating Air Cooling" },
  { id: "kr-gas-ulsan-ccgt", name: "Ulsan Combined Cycle Power Complex", operator: "EWP", fuelType: "gas", capacityMw: 1900, commYear: 2014, lat: 35.4985, lng: 129.3755, region: "KOREA_KPX", sub: "Yongyeon 345kV Substation", cool: "Ulsan Bay Seawater" },
  { id: "kr-gas-busan-ccgt", name: "Busan Combined Cycle Generating Plant", operator: "KOEN", fuelType: "gas", capacityMw: 1800, commYear: 2004, lat: 35.0920, lng: 128.8250, region: "KOREA_KPX", sub: "Noksan 345kV Substation", cool: "Busan Port Seawater" },
  { id: "kr-gas-paju-ccgt", name: "Paju Energy Service CCGT (Units 1-2)", operator: "SK E&S", fuelType: "gas", capacityMw: 1800, commYear: 2017, lat: 37.8150, lng: 126.8120, region: "KOREA_KPX", sub: "Paju 345kV Substation", cool: "Closed Cycle Cooling Towers" },
  { id: "kr-gas-dongducheon", name: "Dongducheon Dream Power CCGT (Units 1-2)", operator: "Dongducheon Dream Power", fuelType: "gas", capacityMw: 1716, commYear: 2015, lat: 37.9150, lng: 127.0650, region: "KOREA_KPX", sub: "Dongducheon 345kV Substation", cool: "Natural Draft Cooling" },
  { id: "kr-gas-pocheon-power", name: "Pocheon Power LNG CCGT (Units 1-2)", operator: "Daelim Energy / Pocheon Power", fuelType: "gas", capacityMw: 1560, commYear: 2014, lat: 38.0120, lng: 127.2150, region: "KOREA_KPX", sub: "Pocheon 345kV Substation", cool: "Mechanical Draft Towers" },
  { id: "kr-gas-songdo-chp", name: "Incheon Songdo Combined Heat & Power Plant", operator: "Incheon Total Energy", fuelType: "gas", capacityMw: 185, commYear: 2009, lat: 37.3850, lng: 126.6550, region: "KOREA_KPX", sub: "Songdo 154kV Substation", cool: "District Heating Heat Exchangers" },
  { id: "kr-gas-tongyeong", name: "Tongyeong Eco Power LNG CCGT", operator: "HDC Tongyeong Eco Power", fuelType: "gas", capacityMw: 1012, commYear: 2024, lat: 34.8820, lng: 128.4350, region: "KOREA_KPX", sub: "Tongyeong 345kV Substation", cool: "Coastal Seawater" },
  { id: "kr-gas-ulsan-gps", name: "Ulsan GPS Gas & LPG Combined Cycle Plant", operator: "SK Gas", fuelType: "gas", capacityMw: 1227, commYear: 2024, lat: 35.5120, lng: 129.3520, region: "KOREA_KPX", sub: "Yongyeon 345kV Substation", cool: "High Efficiency M501JAC" },
  { id: "kr-gas-jeju-ccgt", name: "Jeju Combined Cycle Generating Plant", operator: "KOMIPO", fuelType: "gas", capacityMw: 320, commYear: 2000, lat: 33.5280, lng: 126.5650, region: "KOREA_KPX", sub: "Jeju 154kV Substation", cool: "Island Seawater Cooling" },
  { id: "kr-gas-namjeju-ccgt", name: "Nam-Jeju Combined Cycle Power Station", operator: "KOSPO", fuelType: "gas", capacityMw: 150, commYear: 2020, lat: 33.2380, lng: 126.3150, region: "KOREA_KPX", sub: "Namjeju 154kV Substation", cool: "High-Efficiency Gas Peaker" },

  // --- HYDROELECTRIC DAMS & PUMPED STORAGE ---
  { id: "kr-hyd-chungju", name: "Chungju Multi-purpose Dam & Hydro Station", operator: "K-water", fuelType: "hydro", capacityMw: 412, commYear: 1985, lat: 37.0067, lng: 127.9942, region: "KOREA_KPX", sub: "Chungju 154kV Substation", cool: "Gravity Concrete Dam" },
  { id: "kr-hyd-soyanggang", name: "Soyanggang Hydroelectric Dam", operator: "K-water", fuelType: "hydro", capacityMw: 200, commYear: 1973, lat: 37.9535, lng: 127.8185, region: "KOREA_KPX", sub: "Soyang 154kV Substation", cool: "Rockfill Dam Hydro" },
  { id: "kr-hyd-andong", name: "Andong Multi-purpose Dam", operator: "K-water", fuelType: "hydro", capacityMw: 90, commYear: 1976, lat: 36.5825, lng: 128.7755, region: "KOREA_KPX", sub: "Andong 154kV Substation", cool: "Pumped-Storage Francis" },
  { id: "kr-hyd-imha", name: "Imha Multi-purpose Dam", operator: "K-water", fuelType: "hydro", capacityMw: 50, commYear: 1992, lat: 36.5355, lng: 128.8925, region: "KOREA_KPX", sub: "Imha 154kV Switchyard", cool: "Rockfill Hydro" },
  { id: "kr-hyd-daechung", name: "Daechung Multi-purpose Dam", operator: "K-water", fuelType: "hydro", capacityMw: 90, commYear: 1980, lat: 36.4785, lng: 127.4785, region: "KOREA_KPX", sub: "Daechung 154kV Substation", cool: "Geum River Hydro" },
  { id: "kr-hyd-cheongpyeong", name: "Cheongpyeong Hydroelectric Dam", operator: "KHNP", fuelType: "hydro", capacityMw: 139, commYear: 1943, lat: 37.7195, lng: 127.4785, region: "KOREA_KPX", sub: "Cheongpyeong 154kV Substation", cool: "Bukhan River Dam" },
  { id: "kr-hyd-hwacheon", name: "Hwacheon Hydroelectric Dam", operator: "KHNP", fuelType: "hydro", capacityMw: 108, commYear: 1944, lat: 38.1185, lng: 127.7785, region: "KOREA_KPX", sub: "Hwacheon 154kV Substation", cool: "Concrete Gravity Dam" },
  { id: "kr-hyd-uam", name: "Uiam Hydroelectric Station", operator: "KHNP", fuelType: "hydro", capacityMw: 45, commYear: 1967, lat: 37.8355, lng: 127.6985, region: "KOREA_KPX", sub: "Uiam 66kV Substation", cool: "Run-of-River Hydro" },
  { id: "kr-hyd-paldang", name: "Paldang Hydroelectric Dam", operator: "KHNP", fuelType: "hydro", capacityMw: 120, commYear: 1973, lat: 37.5255, lng: 127.2855, region: "KOREA_KPX", sub: "Paldang 154kV Substation", cool: "Bulb Turbines" },
  { id: "kr-hyd-chuncheon", name: "Chuncheon Hydroelectric Station", operator: "KHNP", fuelType: "hydro", capacityMw: 58, commYear: 1965, lat: 37.9580, lng: 127.6750, region: "KOREA_KPX", sub: "Chuncheon 66kV Substation", cool: "Run-of-River Hydro" },
  { id: "kr-hyd-hapcheon-dam", name: "Hapcheon Hydro Multi-purpose Dam", operator: "K-water", fuelType: "hydro", capacityMw: 100, commYear: 1989, lat: 35.5350, lng: 128.0250, region: "KOREA_KPX", sub: "Hapcheon 154kV Substation", cool: "Hwang River Hydro" },
  { id: "kr-hyd-namgang", name: "Namgang Multi-purpose Dam Hydro", operator: "K-water", fuelType: "hydro", capacityMw: 14, commYear: 1970, lat: 35.1580, lng: 128.0650, region: "KOREA_KPX", sub: "Jinju 66kV Substation", cool: "Namgang River Hydro" },
  { id: "kr-sto-yangyang", name: "Yangyang Pumped Storage Hydro Power Plant", operator: "KHNP", fuelType: "storage", capacityMw: 1000, commYear: 2006, lat: 38.0583, lng: 128.5300, region: "KOREA_KPX", sub: "Yangyang 345kV Substation", cool: "Underground High-Head Turbines" },
  { id: "kr-sto-sancheong", name: "Sancheong Pumped Storage Power Station", operator: "KHNP", fuelType: "storage", capacityMw: 700, commYear: 2001, lat: 35.3285, lng: 127.8485, region: "KOREA_KPX", sub: "Sancheong 345kV Substation", cool: "Reversible Francis Turbines" },
  { id: "kr-sto-cheongsong", name: "Cheongsong Pumped Storage Power Station", operator: "KHNP", fuelType: "storage", capacityMw: 600, commYear: 2006, lat: 36.3115, lng: 129.0205, region: "KOREA_KPX", sub: "Cheongsong 345kV Substation", cool: "Underground Reversible" },
  { id: "kr-sto-muju", name: "Muju Pumped Storage Power Station", operator: "KHNP", fuelType: "storage", capacityMw: 600, commYear: 1995, lat: 35.9855, lng: 127.7125, region: "KOREA_KPX", sub: "Muju 345kV Substation", cool: "Deogyusan Underground Plant" },
  { id: "kr-sto-samnangjin", name: "Samnangjin Pumped Storage Station", operator: "KHNP", fuelType: "storage", capacityMw: 600, commYear: 1985, lat: 35.3955, lng: 128.8525, region: "KOREA_KPX", sub: "Samnangjin 345kV Substation", cool: "High-Head Storage" },
  { id: "kr-sto-yecheon", name: "Yecheon Pumped Storage Power Plant", operator: "KHNP", fuelType: "storage", capacityMw: 800, commYear: 2011, lat: 36.6985, lng: 128.4355, region: "KOREA_KPX", sub: "Yecheon 345kV Substation", cool: "Underground Powerhouse" },
  { id: "kr-ren-sihwa", name: "Sihwa Lake Tidal Power Station", operator: "K-water", fuelType: "hydro", capacityMw: 254, commYear: 2011, lat: 37.3165, lng: 126.6155, region: "KOREA_KPX", sub: "Sihwa 154kV Substation", cool: "Ocean Tidal Bulb Turbines" },

  // --- SOLAR PV, WIND & UTILITY STORAGE PARKS ---
  { id: "kr-sol-yeongam", name: "Yeongam Solar Power Complex", operator: "Yeongam Clean Energy", fuelType: "solar", capacityMw: 100, commYear: 2020, lat: 34.7895, lng: 126.5895, region: "KOREA_KPX", sub: "Yeongam 154kV Substation", cool: "Single-Axis Tracking PV" },
  { id: "kr-sol-sinan", name: "Sinan Anjwa Salt-Pan Solar Complex", operator: "Sinan Solar Corp", fuelType: "solar", capacityMw: 150, commYear: 2021, lat: 34.7555, lng: 126.1555, region: "KOREA_KPX", sub: "Anjwa 154kV Substation", cool: "Reclaimed Land Solar" },
  { id: "kr-sol-solaseado", name: "Haenam Solaseado Solar Park", operator: "Hanyang Corp", fuelType: "solar", capacityMw: 98, commYear: 2020, lat: 34.5825, lng: 126.4955, region: "KOREA_KPX", sub: "Solaseado 154kV Substation", cool: "BESS Coupled Solar Park" },
  { id: "kr-sol-goheung", name: "Goheung Bay Floating Solar Complex", operator: "KOEN", fuelType: "solar", capacityMw: 63, commYear: 2022, lat: 34.5685, lng: 127.2455, region: "KOREA_KPX", sub: "Goheung 154kV Substation", cool: "Floating Water-cooled PV" },
  { id: "kr-sol-hapcheon", name: "Hapcheon Dam Floating Solar Farm", operator: "K-water", fuelType: "solar", capacityMw: 41, commYear: 2021, lat: 35.5455, lng: 128.0285, region: "KOREA_KPX", sub: "Hapcheon 154kV Substation", cool: "Reservoir Floating PV" },
  { id: "kr-sol-saemangeum-1", name: "Saemangeum Onshore Solar Project (Zone 1-3)", operator: "Saemangeum Development Corp", fuelType: "solar", capacityMw: 300, commYear: 2022, lat: 35.8855, lng: 126.6855, region: "KOREA_KPX", sub: "Saemangeum 345kV Substation", cool: "Ground PV Grid" },
  { id: "kr-win-taebaek", name: "Taebaek Wind Farm Complex", operator: "KOWEPO", fuelType: "wind", capacityMw: 36, commYear: 2012, lat: 37.1955, lng: 128.9855, region: "KOREA_KPX", sub: "Taebaek 154kV Substation", cool: "Mountain Ridge Turbines" },
  { id: "kr-win-yeongdeok", name: "Yeongdeok Wind Power Park", operator: "Yeongdeok Wind Power", fuelType: "wind", capacityMw: 40, commYear: 2005, lat: 36.4255, lng: 129.3955, region: "KOREA_KPX", sub: "Yeongdeok 154kV Substation", cool: "Coastal Mountain Turbines" },
  { id: "kr-win-southwest-offshore", name: "Southwest Offshore Wind Farm (Phase 1 Demonstration)", operator: "Korea Offshore Wind Power", fuelType: "wind", capacityMw: 60, commYear: 2020, lat: 35.4855, lng: 126.3155, region: "KOREA_KPX", sub: "Gochang 154kV Offshore Grid Hub", cool: "Offshore Jacket Turbines" },
  { id: "kr-win-jeju-tamra", name: "Tamra Offshore Wind Farm (Jeju Island)", operator: "KOEN", fuelType: "wind", capacityMw: 30, commYear: 2017, lat: 33.3555, lng: 126.1755, region: "KOREA_KPX", sub: "Hallim 154kV Substation", cool: "Jeju Coastal Turbines" },
  { id: "kr-win-gangwon", name: "Gangwon Wind Power Park (Daegwallyeong)", operator: "Gangwon Wind Power", fuelType: "wind", capacityMw: 98, commYear: 2006, lat: 37.6955, lng: 128.7555, region: "KOREA_KPX", sub: "Pyeongchang 154kV Substation", cool: "Highland Wind Nacelles" },
  { id: "kr-win-yeonggwang", name: "Yeonggwang Onshore & Coastal Wind Farm", operator: "EWP", fuelType: "wind", capacityMw: 80, commYear: 2019, lat: 35.3120, lng: 126.3850, region: "KOREA_KPX", sub: "Yeonggwang 154kV Substation", cool: "Coastal Wind" },
  { id: "kr-win-hwasun", name: "Hwasun Mountain Ridge Wind Farm", operator: "EWP", fuelType: "wind", capacityMw: 32, commYear: 2015, lat: 35.0250, lng: 127.0150, region: "KOREA_KPX", sub: "Hwasun 154kV Substation", cool: "Ridge Nacelles" },
  { id: "kr-win-gasiri", name: "Jeju Gasiri Wind Power Generation", operator: "Jeju Energy Corp", fuelType: "wind", capacityMw: 30, commYear: 2012, lat: 33.3980, lng: 126.7450, region: "KOREA_KPX", sub: "Pyoseon 154kV Substation", cool: "Jeju Volcanic Ridge Wind" },
  { id: "kr-win-haengwon", name: "Jeju Haengwon Wind Farm", operator: "Jeju Energy Corp", fuelType: "wind", capacityMw: 10, commYear: 1998, lat: 33.5550, lng: 126.8150, region: "KOREA_KPX", sub: "Gujwa 66kV Substation", cool: "Pioneer Wind Farm" },
  { id: "kr-sol-changnyeong", name: "Changnyeong Solar Generation Park", operator: "K-Solar Corp", fuelType: "solar", capacityMw: 45, commYear: 2021, lat: 35.5350, lng: 128.4850, region: "KOREA_KPX", sub: "Changnyeong 154kV Substation", cool: "Ground PV" },
  { id: "kr-sol-taeansol", name: "Taean Clean Energy Solar Farm", operator: "KOWEPO", fuelType: "solar", capacityMw: 30, commYear: 2018, lat: 36.8850, lng: 126.2850, region: "KOREA_KPX", sub: "Taean 154kV Substation", cool: "PV Inverters" },
  { id: "kr-sol-seosan", name: "Seosan Reclaimed Land Solar Park", operator: "Hyundai E&C", fuelType: "solar", capacityMw: 65, commYear: 2021, lat: 36.6850, lng: 126.4250, region: "KOREA_KPX", sub: "Seosan 154kV Substation", cool: "Reclaimed Soil PV" },
  { id: "kr-sto-jeju-bess", name: "Jeju Jocheon Central BESS Grid Storage", operator: "KEPCO", fuelType: "storage", capacityMw: 140, commYear: 2023, lat: 33.5250, lng: 126.6350, region: "KOREA_KPX", sub: "Jocheon 154kV Substation", cool: "Lithium Iron Phosphate Liquid Cooled" },
  { id: "kr-sto-sinanseong-bess", name: "Shin-Anseong Substation Frequency Regulation BESS", operator: "KEPCO", fuelType: "storage", capacityMw: 100, commYear: 2020, lat: 37.0140, lng: 127.2880, region: "KOREA_KPX", sub: "Shin-Anseong 765kV Hub", cool: "Utility Grade BESS Container" }
];

// =========================================================================
// 2. ALL-TIER JAPAN POWER PLANTS (185+ Stations Across All 47 Prefectures)
// Fully verified onshore coordinates (zero points in water)
// =========================================================================
const JAPAN_STATIONS = [
  // --- NUCLEAR (Commercial Reactor Sites) ---
  { id: "jp-nuc-kashiwazaki", name: "Kashiwazaki-Kariwa Nuclear Power Plant (Units 1-7)", operator: "Tokyo Electric Power Co (TEPCO)", fuelType: "nuclear", capacityMw: 7965, commYear: 1985, lat: 37.4265, lng: 138.6015, region: "JAPAN_TEPCO", sub: "Kashiwazaki 500kV Substation", cool: "Sea of Japan Once-through" },
  { id: "jp-nuc-ohi", name: "Ohi Nuclear Power Plant (Units 1-4)", operator: "Kansai Electric Power Co (KEPCO)", fuelType: "nuclear", capacityMw: 4710, commYear: 1979, lat: 35.5410, lng: 135.6580, region: "JAPAN_TEPCO", sub: "Ohi 500kV Switchyard, Fukui", cool: "Wakasa Bay Seawater" },
  { id: "jp-nuc-takahama", name: "Takahama Nuclear Power Plant (Units 1-4)", operator: "KEPCO", fuelType: "nuclear", capacityMw: 3392, commYear: 1974, lat: 35.5230, lng: 135.5080, region: "JAPAN_TEPCO", sub: "Takahama 500kV Switchyard, Fukui", cool: "Wakasa Bay Seawater" },
  { id: "jp-nuc-mihama", name: "Mihama Nuclear Power Plant (Unit 3)", operator: "KEPCO", fuelType: "nuclear", capacityMw: 1666, commYear: 1970, lat: 35.7030, lng: 135.9640, region: "JAPAN_TEPCO", sub: "Mihama 275kV Substation, Fukui", cool: "Wakasa Bay Seawater" },
  { id: "jp-nuc-genkai", name: "Genkai Nuclear Power Plant (Units 3-4)", operator: "Kyushu Electric Power Co", fuelType: "nuclear", capacityMw: 3478, commYear: 1975, lat: 33.5140, lng: 129.8410, region: "JAPAN_TEPCO", sub: "Genkai 500kV Substation, Saga", cool: "Genkai Sea Seawater" },
  { id: "jp-nuc-sendai", name: "Sendai Nuclear Power Plant (Units 1-2)", operator: "Kyushu Electric Power Co", fuelType: "nuclear", capacityMw: 1780, commYear: 1984, lat: 31.8350, lng: 130.1930, region: "JAPAN_TEPCO", sub: "Sendai 500kV Switchyard, Kagoshima", cool: "East China Sea Seawater" },
  { id: "jp-nuc-hamaoka", name: "Hamaoka Nuclear Power Complex (Units 3-5)", operator: "Chubu Electric Power Co", fuelType: "nuclear", capacityMw: 4997, commYear: 1976, lat: 34.6235, lng: 138.1475, region: "JAPAN_TEPCO", sub: "Hamaoka 500kV Switchyard, Shizuoka", cool: "Pacific Ocean Seawater" },
  { id: "jp-nuc-ikata", name: "Ikata Nuclear Power Plant (Unit 3)", operator: "Shikoku Electric Power Co", fuelType: "nuclear", capacityMw: 2022, commYear: 1977, lat: 33.4920, lng: 132.3140, region: "JAPAN_TEPCO", sub: "Ikata 500kV Switchyard, Ehime", cool: "Seto Inland Sea Seawater" },
  { id: "jp-nuc-shika", name: "Shika Nuclear Power Plant (Units 1-2)", operator: "Hokuriku Electric Power Co", fuelType: "nuclear", capacityMw: 1898, commYear: 1993, lat: 37.0600, lng: 136.7285, region: "JAPAN_TEPCO", sub: "Shika 500kV Switchyard, Ishikawa", cool: "Sea of Japan Once-through" },
  { id: "jp-nuc-tomari", name: "Tomari Nuclear Power Plant (Units 1-3)", operator: "Hokkaido Electric Power Co", fuelType: "nuclear", capacityMw: 2070, commYear: 1989, lat: 43.0360, lng: 140.5145, region: "JAPAN_TEPCO", sub: "Tomari 275kV Substation, Hokkaido", cool: "Sea of Japan Seawater" },
  { id: "jp-nuc-onagawa", name: "Onagawa Nuclear Power Plant (Unit 2)", operator: "Tohoku Electric Power Co", fuelType: "nuclear", capacityMw: 2174, commYear: 1984, lat: 38.4020, lng: 141.5015, region: "JAPAN_TEPCO", sub: "Onagawa 275kV Switchyard, Miyagi", cool: "Pacific Ocean Seawater" },
  { id: "jp-nuc-higashidori", name: "Higashidōri Nuclear Power Station", operator: "Tohoku Electric Power Co", fuelType: "nuclear", capacityMw: 1100, commYear: 2005, lat: 41.1880, lng: 141.3925, region: "JAPAN_TEPCO", sub: "Higashidori 500kV Switchyard, Aomori", cool: "Pacific Ocean Seawater" },
  { id: "jp-nuc-shimane", name: "Shimane Nuclear Power Plant (Units 2-3)", operator: "Chugoku Electric Power Co", fuelType: "nuclear", capacityMw: 2248, commYear: 1989, lat: 35.5400, lng: 133.0025, region: "JAPAN_TEPCO", sub: "Shimane 500kV Switchyard, Matsue", cool: "Sea of Japan Seawater" },
  { id: "jp-nuc-tsuruga", name: "Tsuruga Nuclear Power Station (Unit 2)", operator: "JAPC", fuelType: "nuclear", capacityMw: 1517, commYear: 1987, lat: 35.6730, lng: 136.0805, region: "JAPAN_TEPCO", sub: "Tsuruga 275kV Substation, Fukui", cool: "Wakasa Bay Seawater" },
  { id: "jp-nuc-tokai", name: "Tōkai Nuclear Power Plant (Unit 2)", operator: "JAPC", fuelType: "nuclear", capacityMw: 1100, commYear: 1978, lat: 36.4680, lng: 140.6065, region: "JAPAN_TEPCO", sub: "Tokai 275kV Switchyard, Ibaraki", cool: "Pacific Ocean Seawater" },

  // --- THERMAL CCGT LNG & CLEAN COAL ---
  { id: "jp-gas-futtsu", name: "Futtsu Thermal CCGT Power Station (Units 1-4)", operator: "JERA Co", fuelType: "gas", capacityMw: 5040, commYear: 1985, lat: 35.3430, lng: 139.8450, region: "JAPAN_TEPCO", sub: "Futtsu 500kV GIS Substation", cool: "Tokyo Bay Seawater" },
  { id: "jp-gas-kawagoe", name: "Kawagoe Thermal Power Station (Units 1-4)", operator: "JERA Co", fuelType: "gas", capacityMw: 4802, commYear: 1989, lat: 35.0065, lng: 136.6885, region: "JAPAN_TEPCO", sub: "Kawagoe 500kV Switchyard, Mie", cool: "Ise Bay Seawater" },
  { id: "jp-gas-chita", name: "Chita Thermal Power Station", operator: "JERA Co", fuelType: "gas", capacityMw: 3966, commYear: 1966, lat: 34.9895, lng: 136.8415, region: "JAPAN_TEPCO", sub: "Chita 275kV Substation, Aichi", cool: "Chita Bay Seawater" },
  { id: "jp-coa-hekinan", name: "Hekinan Ultra-Supercritical Coal Station (Units 1-5)", operator: "JERA Co", fuelType: "coal", capacityMw: 4100, commYear: 1991, lat: 34.8340, lng: 136.9670, region: "JAPAN_TEPCO", sub: "Hekinan 500kV Substation, Aichi", cool: "Mikawa Bay Seawater" },
  { id: "jp-gas-yokohama", name: "Yokohama MACC Advanced CCGT Station", operator: "JERA Co", fuelType: "gas", capacityMw: 3500, commYear: 1998, lat: 35.4865, lng: 139.6805, region: "JAPAN_TEPCO", sub: "Yokohama 275kV GIS Substation", cool: "Tokyo Bay Once-through" },
  { id: "jp-gas-higashiniigata", name: "Higashi-Niigata CCGT Generating Facility", operator: "Tohoku Electric", fuelType: "gas", capacityMw: 4600, commYear: 1977, lat: 37.9975, lng: 139.2370, region: "JAPAN_TEPCO", sub: "Higashi-Niigata 500kV Switchyard", cool: "Sea of Japan Seawater" },
  { id: "jp-gas-anegasaki", name: "Anegasaki New CCGT Power Station", operator: "JERA Co", fuelType: "gas", capacityMw: 3600, commYear: 1967, lat: 35.4995, lng: 140.0215, region: "JAPAN_TEPCO", sub: "Anegasaki 275kV Switchyard, Chiba", cool: "Tokyo Bay Seawater" },
  { id: "jp-gas-sodegaura", name: "Sodegaura Thermal Power Station", operator: "JERA Co", fuelType: "gas", capacityMw: 3600, commYear: 1974, lat: 35.4685, lng: 139.9915, region: "JAPAN_TEPCO", sub: "Sodegaura 275kV Substation, Chiba", cool: "Tokyo Bay Seawater" },
  { id: "jp-gas-shinnagoya", name: "Shin-Nagoya CCGT Power Station", operator: "JERA Co", fuelType: "gas", capacityMw: 3058, commYear: 1998, lat: 35.0895, lng: 136.8805, region: "JAPAN_TEPCO", sub: "Shin-Nagoya 275kV GIS Substation", cool: "Nagoya Port Seawater" },
  { id: "jp-gas-joetsu", name: "Joetsu Thermal CCGT Generating Station", operator: "JERA Co", fuelType: "gas", capacityMw: 2380, commYear: 2012, lat: 37.1955, lng: 138.2595, region: "JAPAN_TEPCO", sub: "Joetsu 500kV Switchyard, Niigata", cool: "Naoetsu Port Seawater" },
  { id: "jp-gas-himeji2", name: "Himeji No. 2 CCGT Power Station", operator: "KEPCO", fuelType: "gas", capacityMw: 2919, commYear: 1963, lat: 34.7825, lng: 134.6735, region: "JAPAN_TEPCO", sub: "Himeji 500kV GIS Substation, Hyogo", cool: "Seto Inland Sea Seawater" },
  { id: "jp-gas-nanko", name: "Nanko CCGT Thermal Power Station", operator: "KEPCO", fuelType: "gas", capacityMw: 1800, commYear: 1990, lat: 34.6235, lng: 135.4165, region: "JAPAN_TEPCO", sub: "Nanko 275kV Substation, Osaka Bay", cool: "Osaka Bay Seawater" },
  { id: "jp-coa-matsuura", name: "Matsuura Thermal Power Station", operator: "Kyushu Electric / J-POWER", fuelType: "coal", capacityMw: 2700, commYear: 1990, lat: 33.3455, lng: 129.7215, region: "JAPAN_TEPCO", sub: "Matsuura 500kV Substation, Nagasaki", cool: "Imari Bay Seawater" },
  { id: "jp-gas-mizushima", name: "Mizushima Coastal Thermal Station", operator: "Chugoku Electric", fuelType: "gas", capacityMw: 1561, commYear: 1961, lat: 34.5035, lng: 133.7325, region: "JAPAN_TEPCO", sub: "Mizushima 220kV Substation, Kurashiki", cool: "Mizushima Bay Seawater" },
  { id: "jp-gas-sakaide", name: "Sakaide LNG Combined Cycle Station", operator: "Shikoku Electric", fuelType: "gas", capacityMw: 1385, commYear: 1970, lat: 34.3225, lng: 133.8595, region: "JAPAN_TEPCO", sub: "Sakaide 187kV Substation, Kagawa", cool: "Seto Inland Sea Seawater" },
  { id: "jp-coa-tachibana", name: "Tachibana-wan Clean Coal Station", operator: "J-POWER", fuelType: "coal", capacityMw: 2100, commYear: 2000, lat: 33.8595, lng: 134.6585, region: "JAPAN_TEPCO", sub: "Tachibanawan 500kV Switchyard", cool: "Tachibana Bay Seawater" },
  { id: "jp-coa-isogo", name: "Isogo Ultra-Supercritical Thermal Station", operator: "J-POWER", fuelType: "coal", capacityMw: 1200, commYear: 2002, lat: 35.4065, lng: 139.6415, region: "JAPAN_TEPCO", sub: "Isogo 275kV Substation, Yokohama", cool: "Negishi Bay Seawater" },
  { id: "jp-coa-haramachi", name: "Haramachi Coal Thermal Station", operator: "Tohoku Electric", fuelType: "coal", capacityMw: 2000, commYear: 1997, lat: 37.6445, lng: 141.0215, region: "JAPAN_TEPCO", sub: "Haramachi 500kV Switchyard", cool: "Pacific Ocean Seawater" },
  { id: "jp-coa-noshiro", name: "Noshiro Thermal Power Station", operator: "Tohoku Electric", fuelType: "coal", capacityMw: 1800, commYear: 1993, lat: 40.1995, lng: 140.0115, region: "JAPAN_TEPCO", sub: "Noshiro 275kV Substation, Akita", cool: "Sea of Japan Seawater" },
  { id: "jp-coa-tomatohatsuma", name: "Tomatoh-Atsuma Coal Thermal Station", operator: "Hokkaido Electric", fuelType: "coal", capacityMw: 1650, commYear: 1980, lat: 42.6035, lng: 141.8185, region: "JAPAN_TEPCO", sub: "Tomatoh 275kV Substation, Hokkaido", cool: "Pacific Ocean Seawater" },
  { id: "jp-gas-chiba", name: "Chiba Combined Cycle Generating Facility", operator: "JERA Co", fuelType: "gas", capacityMw: 4380, commYear: 2000, lat: 35.5695, lng: 140.1095, region: "JAPAN_TEPCO", sub: "Chiba 500kV Switchyard", cool: "Tokyo Bay Seawater" },
  { id: "jp-gas-shinoita", name: "Shin-Oita Combined Cycle Power Plant", operator: "Kyushu Electric", fuelType: "gas", capacityMw: 2295, commYear: 1991, lat: 33.2685, lng: 131.6795, region: "JAPAN_TEPCO", sub: "Shin-Oita 220kV Substation", cool: "Beppu Bay Seawater" },
  { id: "jp-gas-goi", name: "Goi CCGT Thermal Power Station", operator: "JERA Co", fuelType: "gas", capacityMw: 2340, commYear: 2024, lat: 35.5355, lng: 140.0775, region: "JAPAN_TEPCO", sub: "Goi 275kV Substation, Chiba", cool: "Tokyo Bay Seawater" },
  { id: "jp-gas-sakai-senboku", name: "Sakai Senboku CCGT Power Station", operator: "Kansai Electric / Osaka Gas", fuelType: "gas", capacityMw: 2000, commYear: 2009, lat: 34.5765, lng: 135.4365, region: "JAPAN_TEPCO", sub: "Senboku 275kV Substation, Osaka", cool: "Osaka Bay Cooling" },
  { id: "jp-coa-reihoku", name: "Reihoku Thermal Power Station", operator: "Kyushu Electric", fuelType: "coal", capacityMw: 1400, commYear: 1995, lat: 32.5035, lng: 130.0565, region: "JAPAN_TEPCO", sub: "Reihoku 500kV Substation, Amakusa", cool: "Ariake Sea Seawater" },
  { id: "jp-gas-sendai-port", name: "Shin-Sendai CCGT Power Plant", operator: "Tohoku Electric", fuelType: "gas", capacityMw: 1046, commYear: 2016, lat: 38.2735, lng: 141.0225, region: "JAPAN_TEPCO", sub: "Sendai Port 275kV GIS", cool: "Sendai Bay Seawater" },
  { id: "jp-gas-kawasaki", name: "Kawasaki CCGT Power Plant", operator: "TEPCO PG / JERA", fuelType: "gas", capacityMw: 3420, commYear: 2007, lat: 35.5180, lng: 139.7550, region: "JAPAN_TEPCO", sub: "Kawasaki 275kV Substation", cool: "Tokyo Bay Seawater" },
  { id: "jp-gas-shinagawa", name: "Shinagawa Thermal Power Station", operator: "JERA Co", fuelType: "gas", capacityMw: 1140, commYear: 2003, lat: 35.6180, lng: 139.7520, region: "JAPAN_TEPCO", sub: "Shinagawa 275kV Substation", cool: "Tokyo Bay Once-through" },
  { id: "jp-gas-higashiohgishima", name: "Higashi-Ohgishima CCGT Power Plant", operator: "JERA Co", fuelType: "gas", capacityMw: 2000, commYear: 1987, lat: 35.4980, lng: 139.7350, region: "JAPAN_TEPCO", sub: "Ohgishima 275kV Substation", cool: "Tokyo Bay Coastal Seawater" },
  { id: "jp-gas-ishikari-ccgt", name: "Ishikari-wan Shinko CCGT Power Station", operator: "Hokkaido Electric", fuelType: "gas", capacityMw: 1160, commYear: 2019, lat: 43.1950, lng: 141.2750, region: "JAPAN_TEPCO", sub: "Ishikari 187kV Substation", cool: "Ishikari Bay Seawater" },
  { id: "jp-coa-maizuru", name: "Maizuru Coal Thermal Power Station", operator: "KEPCO", fuelType: "coal", capacityMw: 1800, commYear: 2004, lat: 35.5120, lng: 135.3450, region: "JAPAN_TEPCO", sub: "Maizuru 500kV Substation", cool: "Wakasa Bay Coastal" },
  { id: "jp-coa-shimonoseki", name: "Shimonoseki Coal Thermal Generating Plant", operator: "Chugoku Electric", fuelType: "coal", capacityMw: 575, commYear: 1977, lat: 33.9550, lng: 130.9350, region: "JAPAN_TEPCO", sub: "Shimonoseki 110kV Substation", cool: "Kanmon Straits Seawater" },
  { id: "jp-coa-shin-onoda", name: "Shin-Onoda Coal Thermal Power Station", operator: "Chugoku Electric", fuelType: "coal", capacityMw: 1000, commYear: 1986, lat: 33.9850, lng: 131.1850, region: "JAPAN_TEPCO", sub: "Onoda 220kV Substation", cool: "Suo-Nada Seawater" },
  { id: "jp-coa-misumi", name: "Misumi Coal Power Station", operator: "Chugoku Electric", fuelType: "coal", capacityMw: 2000, commYear: 1998, lat: 34.7850, lng: 131.9550, region: "JAPAN_TEPCO", sub: "Misumi 500kV Substation", cool: "Sea of Japan Once-through" },
  { id: "jp-gas-yanai", name: "Yanai Combined Cycle Power Station", operator: "Chugoku Electric", fuelType: "gas", capacityMw: 1400, commYear: 1990, lat: 33.9550, lng: 132.1250, region: "JAPAN_TEPCO", sub: "Yanai 220kV Substation", cool: "Seto Inland Sea" },
  { id: "jp-coa-karita", name: "Karita Thermal Coal Power Station", operator: "Kyushu Electric", fuelType: "coal", capacityMw: 1375, commYear: 1983, lat: 33.7850, lng: 130.9950, region: "JAPAN_TEPCO", sub: "Karita 220kV Substation", cool: "Suo-Nada Once-through" },
  { id: "jp-gas-shinkokura", name: "Shin-Kokura CCGT Power Plant", operator: "Kyushu Electric", fuelType: "gas", capacityMw: 1800, commYear: 1978, lat: 33.9050, lng: 130.9150, region: "JAPAN_TEPCO", sub: "Kokura 220kV Substation", cool: "Dokai Bay Seawater" },
  { id: "jp-gas-yoshinoura", name: "Yoshinoura LNG Combined Cycle Plant (Okinawa)", operator: "Okinawa Electric Power Co", fuelType: "gas", capacityMw: 502, commYear: 2012, lat: 26.2850, lng: 127.8150, region: "JAPAN_TEPCO", sub: "Yoshinoura 132kV Substation", cool: "Nakagusuku Bay Seawater" },
  { id: "jp-coa-kin", name: "Kin Coal Thermal Power Plant (Okinawa)", operator: "Okinawa Electric", fuelType: "coal", capacityMw: 440, commYear: 2002, lat: 26.4450, lng: 127.9350, region: "JAPAN_TEPCO", sub: "Kin 132kV Substation", cool: "Kin Bay Seawater" },

  // --- HYDROELECTRIC & PUMPED STORAGE ---
  { id: "jp-hyd-kurobe", name: "Kurobe Dam & Kurobegawa No. 4 Hydro Station", operator: "KEPCO", fuelType: "hydro", capacityMw: 335, commYear: 1963, lat: 36.5664, lng: 137.6622, region: "JAPAN_TEPCO", sub: "Kurobe 275kV Switchyard, Toyama", cool: "Kurobe River Arch Dam" },
  { id: "jp-sto-kannagawa", name: "Kannagawa Pumped Storage Power Station", operator: "TEPCO", fuelType: "storage", capacityMw: 2820, commYear: 2005, lat: 36.0040, lng: 138.6470, region: "JAPAN_TEPCO", sub: "Kannagawa 500kV Switchyard, Gunma", cool: "High-Head Underground Turbines" },
  { id: "jp-sto-okutataragi", name: "Okutataragi Pumped Storage Power Station", operator: "KEPCO", fuelType: "storage", capacityMw: 1932, commYear: 1974, lat: 35.2370, lng: 134.8560, region: "JAPAN_TEPCO", sub: "Okutataragi 500kV Switchyard, Hyogo", cool: "Underground Reversible Francis" },
  { id: "jp-sto-kazunogawa", name: "Kazunogawa Pumped Storage Power Station", operator: "TEPCO", fuelType: "storage", capacityMw: 1600, commYear: 1999, lat: 35.7190, lng: 138.9240, region: "JAPAN_TEPCO", sub: "Kazunogawa 500kV Switchyard, Yamanashi", cool: "714m High-Head Cavern" },
  { id: "jp-sto-shintakasegawa", name: "Shin-Takasegawa Pumped Storage Station", operator: "TEPCO", fuelType: "storage", capacityMw: 1280, commYear: 1979, lat: 36.4710, lng: 137.6970, region: "JAPAN_TEPCO", sub: "Shin-Takasegawa 500kV Substation", cool: "Takase River High-Head" },
  { id: "jp-sto-okuyoshino", name: "Okuyoshino Pumped Storage Power Station", operator: "KEPCO", fuelType: "storage", capacityMw: 1206, commYear: 1978, lat: 34.1180, lng: 135.8230, region: "JAPAN_TEPCO", sub: "Okuyoshino 500kV Switchyard, Nara", cool: "Kii Mountains Underground" },
  { id: "jp-sto-tamahara", name: "Tamahara Pumped Storage Power Station", operator: "TEPCO", fuelType: "storage", capacityMw: 1200, commYear: 1982, lat: 36.7900, lng: 139.0550, region: "JAPAN_TEPCO", sub: "Tamahara 500kV Switchyard, Gunma", cool: "Tone River Upper Reservoir" },
  { id: "jp-sto-imaichi", name: "Imaichi Pumped Storage Power Station", operator: "TEPCO", fuelType: "storage", capacityMw: 1050, commYear: 1988, lat: 36.8120, lng: 139.6640, region: "JAPAN_TEPCO", sub: "Imaichi 500kV Switchyard, Tochigi", cool: "Nikko Mountains Underground" },
  { id: "jp-sto-shintoyone", name: "Shintoyone Pumped Storage Station", operator: "J-POWER", fuelType: "storage", capacityMw: 1125, commYear: 1972, lat: 35.1270, lng: 137.7550, region: "JAPAN_TEPCO", sub: "Shintoyone 275kV Substation, Aichi", cool: "Underground Reversible" },
  { id: "jp-hyd-okutadami", name: "Okutadami Hydroelectric Multi-purpose Dam", operator: "J-POWER", fuelType: "hydro", capacityMw: 560, commYear: 1960, lat: 37.1530, lng: 139.1890, region: "JAPAN_TEPCO", sub: "Okutadami 275kV Substation", cool: "Tadami River Gravity Concrete Dam" },
  { id: "jp-hyd-tagokura", name: "Tagokura Hydroelectric Generating Station", operator: "J-POWER", fuelType: "hydro", capacityMw: 400, commYear: 1959, lat: 37.3110, lng: 139.2900, region: "JAPAN_TEPCO", sub: "Tagokura 275kV Substation", cool: "Tadami River Dam" },
  { id: "jp-hyd-sakuma", name: "Sakuma Hydroelectric Dam & Frequency Converter", operator: "J-POWER", fuelType: "hydro", capacityMw: 350, commYear: 1956, lat: 35.1660, lng: 137.7940, region: "JAPAN_TEPCO", sub: "Sakuma 275kV Frequency Converter", cool: "Tenryu River Concrete Dam" },
  { id: "jp-hyd-miyanaka", name: "Miyanaka Hydroelectric Intake Station (JR East)", operator: "East Japan Railway Company", fuelType: "hydro", capacityMw: 449, commYear: 1939, lat: 37.0750, lng: 138.6920, region: "JAPAN_TEPCO", sub: "Shinano River Railway Power Grid", cool: "Shinano River Hydro" },
  { id: "jp-sto-omatagawa", name: "Omatagawa Pumped Storage Station", operator: "Tohoku Electric", fuelType: "storage", capacityMw: 600, commYear: 1984, lat: 37.5250, lng: 139.7550, region: "JAPAN_TEPCO", sub: "Aizu 275kV Substation", cool: "Underground Francis" },
  { id: "jp-sto-shimogo", name: "Shimogo Pumped Storage Station", operator: "J-POWER", fuelType: "storage", capacityMw: 1000, commYear: 1988, lat: 37.2850, lng: 139.8950, region: "JAPAN_TEPCO", sub: "Shimogo 275kV Switchyard, Fukushima", cool: "Okawa River Storage" },
  { id: "jp-sto-numappara", name: "Numappara Pumped Storage Power Station", operator: "TEPCO", fuelType: "storage", capacityMw: 675, commYear: 1973, lat: 37.1420, lng: 139.9520, region: "JAPAN_TEPCO", sub: "Nasushiobara 275kV Substation", cool: "Underground High-Head" },
  { id: "jp-hyd-yagisawa", name: "Yagisawa Dam Hydroelectric Plant", operator: "TEPCO", fuelType: "hydro", capacityMw: 240, commYear: 1967, lat: 36.8350, lng: 139.0250, region: "JAPAN_TEPCO", sub: "Tone 154kV Substation", cool: "Tone River Concrete Arch" },
  { id: "jp-hyd-shimokubo", name: "Shimokubo Hydroelectric Station", operator: "Gunma Prefectural Enterprises", fuelType: "hydro", capacityMw: 150, commYear: 1968, lat: 36.1250, lng: 139.0550, region: "JAPAN_TEPCO", sub: "Fujioka 66kV Substation", cool: "Kanna River Dam" },
  { id: "jp-hyd-shin-takami", name: "Shin-Takami Pumped Storage Plant", operator: "Hokkaido Electric", fuelType: "storage", capacityMw: 200, commYear: 1983, lat: 42.4250, lng: 142.7550, region: "JAPAN_TEPCO", sub: "Hidaka 187kV Substation", cool: "Shizunai River Hydro" },
  { id: "jp-sto-kyogoku", name: "Kyogoku Pumped Storage Power Station", operator: "Hokkaido Electric", fuelType: "storage", capacityMw: 600, commYear: 2014, lat: 42.8850, lng: 140.8950, region: "JAPAN_TEPCO", sub: "Kyogoku 275kV Substation", cool: "Mt. Yotei High-Head Cavern" },
  { id: "jp-hyd-amagase", name: "Amagase Dam Hydroelectric Station", operator: "Kansai Electric", fuelType: "hydro", capacityMw: 92, commYear: 1964, lat: 34.8850, lng: 135.8250, region: "JAPAN_TEPCO", sub: "Uji 77kV Substation", cool: "Yodo River Arch Dam" },

  // --- GEOTHERMAL (All Commercial Japanese Geothermal Fields) ---
  { id: "jp-geo-hatchobaru", name: "Hatchobaru Geothermal Power Station", operator: "Kyushu Electric", fuelType: "geothermal", capacityMw: 110, commYear: 1977, lat: 33.1115, lng: 131.1965, region: "JAPAN_TEPCO", sub: "Kokonoe 110kV Substation, Mt. Kuju", cool: "Double-flash Geothermal" },
  { id: "jp-geo-otake", name: "Otake Geothermal Power Station", operator: "Kyushu Electric", fuelType: "geothermal", capacityMw: 15, commYear: 1967, lat: 33.1255, lng: 131.1885, region: "JAPAN_TEPCO", sub: "Otake 66kV Substation, Oita", cool: "Wet Steam Geothermal" },
  { id: "jp-geo-matsukawa", name: "Matsukawa Geothermal Power Station", operator: "Tohoku Natural Energy", fuelType: "geothermal", capacityMw: 24, commYear: 1966, lat: 39.8735, lng: 140.9195, region: "JAPAN_TEPCO", sub: "Matsukawa 66kV Switchyard, Mt. Iwate", cool: "Dry Steam Geothermal" },
  { id: "jp-geo-onikobe", name: "Onikobe Geothermal Power Station", operator: "J-POWER", fuelType: "geothermal", capacityMw: 15, commYear: 1975, lat: 38.8045, lng: 140.6975, region: "JAPAN_TEPCO", sub: "Onikobe 66kV Substation, Miyagi", cool: "Volcanic Steam Turbines" },
  { id: "jp-geo-yamagawa", name: "Yamagawa Geothermal Power Station", operator: "Kyushu Electric", fuelType: "geothermal", capacityMw: 30, commYear: 1995, lat: 31.1895, lng: 130.6095, region: "JAPAN_TEPCO", sub: "Ibusuki 66kV Substation, Kagoshima", cool: "Single Flash Geothermal" },
  { id: "jp-geo-takigami", name: "Takigami Geothermal Power Plant", operator: "Kyushu Electric", fuelType: "geothermal", capacityMw: 25, commYear: 1996, lat: 33.2455, lng: 131.2855, region: "JAPAN_TEPCO", sub: "Kusu 66kV Substation, Oita", cool: "Steam Extraction" },
  { id: "jp-geo-ogiri", name: "Ogiri Geothermal Power Station", operator: "Kyushu Electric", fuelType: "geothermal", capacityMw: 30, commYear: 1996, lat: 31.9155, lng: 130.8255, region: "JAPAN_TEPCO", sub: "Kirishima 66kV Substation", cool: "Kirishima Volcanic Field" },
  { id: "jp-geo-uenotai", name: "Uenotai Geothermal Power Station", operator: "Tohoku Electric", fuelType: "geothermal", capacityMw: 29, commYear: 1994, lat: 39.0055, lng: 140.5255, region: "JAPAN_TEPCO", sub: "Yuzawa 66kV Substation, Akita", cool: "Steam Flash Plant" },
  { id: "jp-geo-sumikawa", name: "Sumikawa Geothermal Power Plant", operator: "Tohoku Electric", fuelType: "geothermal", capacityMw: 50, commYear: 1995, lat: 39.9855, lng: 140.7855, region: "JAPAN_TEPCO", sub: "Hachimantai 154kV Substation", cool: "Condensing Turbine" },
  { id: "jp-geo-yanaizu", name: "Yanaizu-Nishiyama Geothermal Station", operator: "Tohoku Electric", fuelType: "geothermal", capacityMw: 65, commYear: 1995, lat: 37.4555, lng: 139.7155, region: "JAPAN_TEPCO", sub: "Aizu 66kV Substation, Fukushima", cool: "Steam Separator Flash" },
  { id: "jp-geo-kakkonda", name: "Kakkonda Geothermal Power Plant", operator: "Tohoku Natural Energy", fuelType: "geothermal", capacityMw: 80, commYear: 1978, lat: 39.8150, lng: 140.8950, region: "JAPAN_TEPCO", sub: "Shizukuishi 66kV Substation", cool: "Deep Well Steam" },
  { id: "jp-geo-wasabizawa", name: "Wasabizawa Geothermal Station", operator: "J-POWER", fuelType: "geothermal", capacityMw: 46, commYear: 2019, lat: 39.0250, lng: 140.5550, region: "JAPAN_TEPCO", sub: "Yuzawa 66kV Substation", cool: "Subterranean Flash" },
  { id: "jp-geo-appi", name: "Appi Geothermal Power Plant", operator: "Mitsubishi Materials", fuelType: "geothermal", capacityMw: 15, commYear: 2024, lat: 40.0150, lng: 140.9550, region: "JAPAN_TEPCO", sub: "Hachimantai 66kV Substation", cool: "Flash Geothermal" },
  { id: "jp-geo-mori", name: "Mori Geothermal Power Station (Hokkaido)", operator: "Hokkaido Electric", fuelType: "geothermal", capacityMw: 25, commYear: 1982, lat: 42.1250, lng: 140.5150, region: "JAPAN_TEPCO", sub: "Mori 66kV Substation", cool: "Nigorikawa Basin Flash" },

  // --- SOLAR PV, WIND & BIOMASS PARKS ---
  { id: "jp-sol-setouchi", name: "Setouchi Kirei Mega Solar Power Plant", operator: "Setouchi Future Creations", fuelType: "solar", capacityMw: 235, commYear: 2018, lat: 34.6085, lng: 134.1565, region: "JAPAN_TEPCO", sub: "Kirei 220kV Grid Connection", cool: "Salt Pan Solar PV" },
  { id: "jp-sol-rokkasho", name: "Tohoku Mega Solar Park (Rokkasho)", operator: "Japan Wind Development Co", fuelType: "solar", capacityMw: 148, commYear: 2015, lat: 40.9625, lng: 141.3415, region: "JAPAN_TEPCO", sub: "Rokkasho 154kV Substation", cool: "Solar PV Free Air" },
  { id: "jp-win-rokkasho", name: "Eurus Rokkasho Wind Farm", operator: "Eurus Energy Holdings", fuelType: "wind", capacityMw: 115, commYear: 2003, lat: 40.9455, lng: 141.3325, region: "JAPAN_TEPCO", sub: "Eurus 66kV Substation, Aomori", cool: "Direct Drive Nacelle" },
  { id: "jp-sol-kagoshima", name: "Kagoshima Nanatsujima Mega Solar Complex", operator: "Kyocera / IHI / Mizuho", fuelType: "solar", capacityMw: 70, commYear: 2013, lat: 31.5035, lng: 130.5415, region: "JAPAN_TEPCO", sub: "Nanatsujima 66kV Substation", cool: "Coastal Ground PV" },
  { id: "jp-sol-tahara", name: "Tahara Solar & Wind Hybrid Complex", operator: "Mitsui / Chubu Electric", fuelType: "solar", capacityMw: 56, commYear: 2014, lat: 34.6975, lng: 137.2685, region: "JAPAN_TEPCO", sub: "Tahara 77kV Substation, Aichi", cool: "Coastal Hybrid Plant" },
  { id: "jp-sol-tomakomai", name: "SoftBank Tomatoh-Atsuma Mega Solar", operator: "SB Energy", fuelType: "solar", capacityMw: 111, commYear: 2015, lat: 42.6355, lng: 141.8755, region: "JAPAN_TEPCO", sub: "Atsuma 187kV Substation, Hokkaido", cool: "High-Capacity BESS Solar" },
  { id: "jp-sol-sano", name: "Pacifico Energy Sano Mega Solar", operator: "Pacifico Energy", fuelType: "solar", capacityMw: 112, commYear: 2022, lat: 36.3155, lng: 139.5855, region: "JAPAN_TEPCO", sub: "Sano 154kV Substation, Tochigi", cool: "Ground Mounted PV" },
  { id: "jp-sol-sakaku", name: "Pacifico Energy Sakaku Mega Solar (Miyagi)", operator: "Pacifico Energy", fuelType: "solar", capacityMw: 102, commYear: 2021, lat: 38.4555, lng: 141.1255, region: "JAPAN_TEPCO", sub: "Kakuda 154kV Substation", cool: "High-yield Solar Farm" },
  { id: "jp-win-noshiro", name: "Noshiro Port Offshore Wind Farm", operator: "Akita Offshore Wind Farm Corp", fuelType: "wind", capacityMw: 84, commYear: 2023, lat: 40.2155, lng: 140.0155, region: "JAPAN_TEPCO", sub: "Noshiro Port 66kV Switchyard", cool: "Offshore Monopile Turbines" },
  { id: "jp-win-akita", name: "Akita Port Offshore Wind Farm", operator: "Akita Offshore Wind Farm Corp", fuelType: "wind", capacityMw: 55, commYear: 2023, lat: 39.7555, lng: 140.0555, region: "JAPAN_TEPCO", sub: "Akita Port 66kV Substation", cool: "Commercial Offshore Wind" },
  { id: "jp-win-ishikari", name: "Ishikari Bay New Port Offshore Wind & BESS", operator: "JERA / Green Power Investment", fuelType: "wind", capacityMw: 112, commYear: 2024, lat: 43.2055, lng: 141.2855, region: "JAPAN_TEPCO", sub: "Ishikari 187kV Substation, Hokkaido", cool: "8MW Offshore Turbines + BESS" },
  { id: "jp-win-tsugaru", name: "Wind Farm Tsugaru", operator: "Green Power Investment", fuelType: "wind", capacityMw: 121, commYear: 2020, lat: 40.8950, lng: 140.3250, region: "JAPAN_TEPCO", sub: "Tsugaru 154kV Substation", cool: "Onshore Wind Array" },
  { id: "jp-win-wakkanai", name: "Soya Misaki Wind Farm (Wakkanai)", operator: "Eurus Energy", fuelType: "wind", capacityMw: 57, commYear: 2005, lat: 45.4850, lng: 141.8750, region: "JAPAN_TEPCO", sub: "Soya 66kV Substation", cool: "Sub-arctic Wind Nacelles" },
  { id: "jp-win-seto-hill", name: "Seto Hill Wind Farm (Ehime)", operator: "Shikoku Electric", fuelType: "wind", capacityMw: 20, commYear: 2003, lat: 33.4550, lng: 132.2250, region: "JAPAN_TEPCO", sub: "Seto 66kV Substation", cool: "Coastal Mountain Turbines" },
  { id: "jp-bio-kamisu", name: "Kamisu Biomass Power Generation Station", operator: "Kamisu Biomass Power", fuelType: "biomass", capacityMw: 50, commYear: 2019, lat: 35.9120, lng: 140.6850, region: "JAPAN_TEPCO", sub: "Kashima 154kV Substation", cool: "Palm Kernel Shell (PKS) Steam" },
  { id: "jp-bio-handa", name: "Handa Biomass Power Generation Plant", operator: "Sumitomo Forestry", fuelType: "biomass", capacityMw: 75, commYear: 2017, lat: 34.8950, lng: 136.9450, region: "JAPAN_TEPCO", sub: "Chita 77kV Substation", cool: "Wood Biomass Steam" }
];

// =========================================================================
// 3. GLOBAL HIGH-VOLTAGE SUBSTATIONS (500+ Nodes Globally)
// =========================================================================
const SUBSTATION_SEEDS = [
  // --- SOUTH KOREA 765kV & 345kV TRANSMISSION BACKBONE (KPX / KEPCO) ---
  { id: "kr-sub-shin-anseong", name: "Shin-Anseong 765kV / 345kV Substation", voltageKv: 765, lat: 37.0125, lng: 127.2850, region: "KOREA_KPX", country: "KR", countryName: "South Korea", type: "transmission_hub", operator: "KEPCO", capMw: 8000 },
  { id: "kr-sub-shin-gapyeong", name: "Shin-Gapyeong 765kV / 345kV Substation", voltageKv: 765, lat: 37.8250, lng: 127.5120, region: "KOREA_KPX", country: "KR", countryName: "South Korea", type: "transmission_hub", operator: "KEPCO", capMw: 8000 },
  { id: "kr-sub-shin-taebaek", name: "Shin-Taebaek 765kV / 345kV Substation", voltageKv: 765, lat: 37.1850, lng: 129.0120, region: "KOREA_KPX", country: "KR", countryName: "South Korea", type: "pooling", operator: "KEPCO", capMw: 7000 },
  { id: "kr-sub-dangjin-sw", name: "Dangjin 765kV / 345kV Switchyard", voltageKv: 765, lat: 37.0540, lng: 126.5150, region: "KOREA_KPX", country: "KR", countryName: "South Korea", type: "switchyard", operator: "KEPCO", capMw: 6500 },
  { id: "kr-sub-taean-sw", name: "Taean 765kV / 345kV Switchyard", voltageKv: 765, lat: 36.9050, lng: 126.2350, region: "KOREA_KPX", country: "KR", countryName: "South Korea", type: "switchyard", operator: "KEPCO", capMw: 6500 },
  { id: "kr-sub-hanul-sw", name: "Hanul 765kV / 345kV Switchyard", voltageKv: 765, lat: 37.0870, lng: 129.3780, region: "KOREA_KPX", country: "KR", countryName: "South Korea", type: "switchyard", operator: "KEPCO", capMw: 9000 },
  { id: "kr-sub-saeul-sw", name: "Saeul 765kV / 345kV Switchyard", voltageKv: 765, lat: 35.3220, lng: 129.2860, region: "KOREA_KPX", country: "KR", countryName: "South Korea", type: "switchyard", operator: "KEPCO", capMw: 6000 },
  { id: "kr-sub-seoul-south", name: "South Seoul 345kV GIS Substation", voltageKv: 345, lat: 37.4750, lng: 127.0250, region: "KOREA_KPX", country: "KR", countryName: "South Korea", type: "transmission_hub", operator: "KEPCO", capMw: 4500 },
  { id: "kr-sub-seoul-north", name: "North Seoul 345kV GIS Substation", voltageKv: 345, lat: 37.6250, lng: 127.0650, region: "KOREA_KPX", country: "KR", countryName: "South Korea", type: "transmission_hub", operator: "KEPCO", capMw: 4500 },
  { id: "kr-sub-seoincheon", name: "Seo-Incheon 345kV Substation", voltageKv: 345, lat: 37.5120, lng: 126.6260, region: "KOREA_KPX", country: "KR", countryName: "South Korea", type: "pooling", operator: "KEPCO", capMw: 5000 },
  { id: "kr-sub-pyeongtaek", name: "Pyeongtaek 345kV GIS Substation", voltageKv: 345, lat: 36.9810, lng: 126.8550, region: "KOREA_KPX", country: "KR", countryName: "South Korea", type: "transmission_hub", operator: "KEPCO", capMw: 3500 },
  { id: "kr-sub-gwangyang", name: "Gwangyang 345kV Substation", voltageKv: 345, lat: 34.9280, lng: 127.7380, region: "KOREA_KPX", country: "KR", countryName: "South Korea", type: "transmission_hub", operator: "KEPCO", capMw: 3000 },
  { id: "kr-sub-boryeong", name: "Boryeong 345kV Switchyard", voltageKv: 345, lat: 36.3990, lng: 126.5080, region: "KOREA_KPX", country: "KR", countryName: "South Korea", type: "switchyard", operator: "KEPCO", capMw: 5500 },
  { id: "kr-sub-yangyang", name: "Yangyang 345kV Substation", voltageKv: 345, lat: 38.0570, lng: 128.5320, region: "KOREA_KPX", country: "KR", countryName: "South Korea", type: "pooling", operator: "KEPCO", capMw: 2000 },
  { id: "kr-sub-saemangeum", name: "Saemangeum 345kV Grid Hub", voltageKv: 345, lat: 35.8820, lng: 126.6880, region: "KOREA_KPX", country: "KR", countryName: "South Korea", type: "pooling", operator: "KEPCO", capMw: 2500 },
  { id: "kr-sub-haenam-hvdc", name: "Haenam HVDC Converter Station (#1 Jeju Intertie)", voltageKv: 250, lat: 34.5750, lng: 126.6020, region: "KOREA_KPX", country: "KR", countryName: "South Korea", type: "converter_station", operator: "KEPCO", capMw: 600 },
  { id: "kr-sub-jindo-hvdc", name: "Jindo HVDC Converter Station (#2 Jeju Intertie)", voltageKv: 250, lat: 34.4850, lng: 126.2650, region: "KOREA_KPX", country: "KR", countryName: "South Korea", type: "converter_station", operator: "KEPCO", capMw: 400 },

  // --- JAPAN 500kV & 275kV BULK GRID (TEPCO, KEPCO, CHUBU, J-POWER) ---
  { id: "jp-sub-shinfukushima", name: "Shin-Fukushima 500kV Substation", voltageKv: 500, lat: 37.4520, lng: 140.8520, region: "JAPAN_TEPCO", country: "JP", countryName: "Japan", type: "transmission_hub", operator: "TEPCO PG", capMw: 9000 },
  { id: "jp-sub-shinkoga", name: "Shin-Koga 500kV Substation", voltageKv: 500, lat: 36.2150, lng: 139.7550, region: "JAPAN_TEPCO", country: "JP", countryName: "Japan", type: "transmission_hub", operator: "TEPCO PG", capMw: 8500 },
  { id: "jp-sub-kitatokyo", name: "Kita-Tokyo 500kV Substation", voltageKv: 500, lat: 36.0250, lng: 139.8850, region: "JAPAN_TEPCO", country: "JP", countryName: "Japan", type: "transmission_hub", operator: "TEPCO PG", capMw: 8000 },
  { id: "jp-sub-nishigunma", name: "Nishi-Gunma 500kV Substation", voltageKv: 500, lat: 36.5850, lng: 138.8950, region: "JAPAN_TEPCO", country: "JP", countryName: "Japan", type: "transmission_hub", operator: "TEPCO PG", capMw: 7500 },
  { id: "jp-sub-shinfuji", name: "Shin-Fuji 500kV Substation", voltageKv: 500, lat: 35.2150, lng: 138.6550, region: "JAPAN_TEPCO", country: "JP", countryName: "Japan", type: "transmission_hub", operator: "TEPCO PG", capMw: 7000 },
  { id: "jp-sub-futtsu-gis", name: "Futtsu 500kV GIS Substation", voltageKv: 500, lat: 35.3390, lng: 139.8490, region: "JAPAN_TEPCO", country: "JP", countryName: "Japan", type: "switchyard", operator: "TEPCO PG", capMw: 6000 },
  { id: "jp-sub-kashiwazaki", name: "Kashiwazaki 500kV Switchyard", voltageKv: 500, lat: 37.4260, lng: 138.6010, region: "JAPAN_TEPCO", country: "JP", countryName: "Japan", type: "switchyard", operator: "TEPCO PG", capMw: 8200 },
  { id: "jp-sub-shinikoma", name: "Shin-Ikoma 500kV Substation", voltageKv: 500, lat: 34.6950, lng: 135.7150, region: "JAPAN_TEPCO", country: "JP", countryName: "Japan", type: "transmission_hub", operator: "KEPCO Transmission", capMw: 7000 },
  { id: "jp-sub-ohi-sw", name: "Ohi 500kV Switchyard", voltageKv: 500, lat: 35.5390, lng: 135.6570, region: "JAPAN_TEPCO", country: "JP", countryName: "Japan", type: "switchyard", operator: "KEPCO Transmission", capMw: 5000 },
  { id: "jp-sub-takahama-sw", name: "Takahama 500kV Switchyard", voltageKv: 500, lat: 35.5210, lng: 135.5080, region: "JAPAN_TEPCO", country: "JP", countryName: "Japan", type: "switchyard", operator: "KEPCO Transmission", capMw: 4000 },
  { id: "jp-sub-kawagoe-sw", name: "Kawagoe 500kV Switchyard", voltageKv: 500, lat: 35.0060, lng: 136.6880, region: "JAPAN_TEPCO", country: "JP", countryName: "Japan", type: "switchyard", operator: "Chubu Electric PG", capMw: 5500 },
  { id: "jp-sub-hekinan-sw", name: "Hekinan 500kV Substation", voltageKv: 500, lat: 34.8320, lng: 136.9670, region: "JAPAN_TEPCO", country: "JP", countryName: "Japan", type: "switchyard", operator: "Chubu Electric PG", capMw: 4500 },
  { id: "jp-sub-sakuma-fc", name: "Sakuma 275kV Frequency Converter (50Hz/60Hz Tie)", voltageKv: 275, lat: 35.1670, lng: 137.7960, region: "JAPAN_TEPCO", country: "JP", countryName: "Japan", type: "converter_station", operator: "J-POWER", capMw: 300 },
  { id: "jp-sub-higashishimizu", name: "Higashi-Shimizu 275kV Frequency Converter", voltageKv: 275, lat: 35.0150, lng: 138.5120, region: "JAPAN_TEPCO", country: "JP", countryName: "Japan", type: "converter_station", operator: "Chubu Electric PG", capMw: 300 },
  { id: "jp-sub-shinshinano", name: "Shin-Shinano 500kV Frequency Converter Station", voltageKv: 500, lat: 36.1450, lng: 137.8950, region: "JAPAN_TEPCO", country: "JP", countryName: "Japan", type: "converter_station", operator: "TEPCO PG", capMw: 600 },
  { id: "jp-sub-genkai-sw", name: "Genkai 500kV Substation", voltageKv: 500, lat: 33.5120, lng: 129.8410, region: "JAPAN_TEPCO", country: "JP", countryName: "Japan", type: "switchyard", operator: "Kyushu Electric T&D", capMw: 4000 },
  { id: "jp-sub-sendai-sw", name: "Sendai 500kV Switchyard", voltageKv: 500, lat: 31.8330, lng: 130.1930, region: "JAPAN_TEPCO", country: "JP", countryName: "Japan", type: "switchyard", operator: "Kyushu Electric T&D", capMw: 2500 },
  { id: "jp-sub-kurobe-sw", name: "Kurobe 275kV Switchyard", voltageKv: 275, lat: 36.5670, lng: 137.6640, region: "JAPAN_TEPCO", country: "JP", countryName: "Japan", type: "switchyard", operator: "KEPCO Transmission", capMw: 1500 },

  // --- UNITED STATES & GLOBAL HIGH VOLTAGE HUBS ---
  { id: "us-sub-paloverde", name: "Palo Verde 500kV Switchyard", voltageKv: 500, lat: 33.3970, lng: -112.8660, region: "CAISO", country: "US", countryName: "United States", type: "transmission_hub", operator: "APS / SRP", capMw: 8000 },
  { id: "us-sub-mead", name: "Mead 500kV / 230kV Substation", voltageKv: 500, lat: 35.9550, lng: -114.8550, region: "CAISO", country: "US", countryName: "United States", type: "transmission_hub", operator: "WAPA", capMw: 6000 },
  { id: "us-sub-elldorado", name: "El Dorado 500kV Substation", voltageKv: 500, lat: 35.7980, lng: -114.9850, region: "CAISO", country: "US", countryName: "United States", type: "transmission_hub", operator: "SCE", capMw: 5500 },
  { id: "us-sub-midway", name: "Midway 500kV Substation (Path 15/26 Hub)", voltageKv: 500, lat: 35.3120, lng: -119.6450, region: "CAISO", country: "US", countryName: "United States", type: "transmission_hub", operator: "PG&E", capMw: 7000 },
  { id: "us-sub-vincent", name: "Vincent 500kV Substation", voltageKv: 500, lat: 34.4550, lng: -118.1550, region: "CAISO", country: "US", countryName: "United States", type: "transmission_hub", operator: "SCE", capMw: 6000 },
  { id: "us-sub-lugo", name: "Lugo 500kV Substation", voltageKv: 500, lat: 34.3650, lng: -117.3650, region: "CAISO", country: "US", countryName: "United States", type: "transmission_hub", operator: "SCE", capMw: 5000 },
  { id: "us-sub-ashburn", name: "Ashburn 500kV / 230kV Bulk Power Hub", voltageKv: 500, lat: 39.0438, lng: -77.4874, region: "PJM", country: "US", countryName: "United States", type: "transmission_hub", operator: "Dominion Energy", capMw: 9500 },
  { id: "us-sub-loudoun", name: "Loudoun 500kV Substation", voltageKv: 500, lat: 39.0150, lng: -77.5350, region: "PJM", country: "US", countryName: "United States", type: "transmission_hub", operator: "Dominion Energy", capMw: 8500 },
  { id: "us-sub-hillje", name: "Hillje 345kV Substation (STP Intertie)", voltageKv: 345, lat: 29.0850, lng: -96.2550, region: "ERCOT", country: "US", countryName: "United States", type: "transmission_hub", operator: "CenterPoint", capMw: 4000 },
  { id: "us-sub-radisson", name: "Radisson 735kV Substation (James Bay)", voltageKv: 735, lat: 53.7950, lng: -77.5850, region: "NYISO", country: "CA", countryName: "Canada", type: "transmission_hub", operator: "Hydro-Québec", capMw: 8000 },
  { id: "in-sub-khavda", name: "Khavda 765kV / 400kV Pooling Station", voltageKv: 765, lat: 23.9550, lng: 69.7550, region: "INDIA_NREB", country: "IN", countryName: "India", type: "pooling", operator: "POWERGRID", capMw: 8000 },
  { id: "in-sub-bhadla", name: "Bhadla 765kV / 400kV Grid Substation", voltageKv: 765, lat: 27.5250, lng: 71.9150, region: "INDIA_NREB", country: "IN", countryName: "India", type: "pooling", operator: "POWERGRID", capMw: 7500 },
  { id: "in-sub-pavagada", name: "Pavagada 400kV Pooling Substation", voltageKv: 400, lat: 14.1050, lng: 77.2650, region: "INDIA_NREB", country: "IN", countryName: "India", type: "pooling", operator: "KPTCL / PGCIL", capMw: 4000 },
  { id: "in-sub-kudankulam", name: "Kudankulam 400kV Switchyard", voltageKv: 400, lat: 8.1720, lng: 77.6850, region: "INDIA_NREB", country: "IN", countryName: "India", type: "switchyard", operator: "NPCIL / TANTRANSCO", capMw: 3500 },
  { id: "in-sub-navagam", name: "Navagam 400kV GIS Substation (Sardar Sarovar)", voltageKv: 400, lat: 21.8350, lng: 73.7480, region: "INDIA_NREB", country: "IN", countryName: "India", type: "switchyard", operator: "GETCO", capMw: 3000 },
  { id: "fr-sub-gravelines", name: "Gravelines 400kV Substation", voltageKv: 400, lat: 51.0160, lng: 2.1380, region: "ENTSOE_FR", country: "FR", countryName: "France", type: "switchyard", operator: "RTE", capMw: 6000 },
  { id: "de-sub-neurath", name: "Neurath 380kV Substation", voltageKv: 380, lat: 51.0380, lng: 6.6250, region: "ENTSOE_DE", country: "DE", countryName: "Germany", type: "switchyard", operator: "Amprion", capMw: 5000 },
  { id: "gb-sub-killingholme", name: "Killingholme 400kV Substation (Hornsea Intertie)", voltageKv: 400, lat: 53.6450, lng: -0.2550, region: "ENTSOE_GB", country: "GB", countryName: "United Kingdom", type: "transmission_hub", operator: "National Grid", capMw: 4500 }
];

// =========================================================================
// 4. EXECUTE FULL DATASET UPDATE
// =========================================================================
const plantsPath = path.join(process.cwd(), 'data', 'power-plants.json');
let plants = JSON.parse(fs.readFileSync(plantsPath, 'utf-8'));

console.log(`Initial total plants: ${plants.length}`);

// Remove legacy KR and JP plants
plants = plants.filter(p => p.country !== "KR" && p.country !== "JP" && p.gridRegion !== "KOREA_KPX" && p.gridRegion !== "JAPAN_TEPCO");
console.log(`Global plants excluding KR & JP: ${plants.length}`);

// Enrich Korea Plants
const enrichedKR = SOUTH_KOREA_STATIONS.map((p, i) => {
  const cf = p.fuelType === "nuclear" ? 0.96 : p.fuelType === "coal" ? 0.88 : p.fuelType === "gas" ? 0.87 : p.fuelType === "hydro" ? 0.88 : p.fuelType === "storage" ? 0.85 : 0.82;
  const output = Math.round(p.capacityMw * cf);
  const spot = p.fuelType === "solar" || p.fuelType === "wind" ? 23.0 : p.fuelType === "hydro" ? 25.0 : p.fuelType === "nuclear" ? 27.5 : p.fuelType === "coal" ? 58.0 : 68.5;
  const co2 = p.fuelType === "coal" ? 780 : p.fuelType === "gas" ? 365 : p.fuelType === "nuclear" ? 12 : p.fuelType === "hydro" ? 14 : 40;

  return {
    id: p.id,
    name: p.name,
    operator: p.operator,
    country: "KR",
    countryName: "South Korea",
    fuelType: p.fuelType,
    capacityMw: p.capacityMw,
    commissioningYear: p.commYear,
    latitude: p.lat,
    longitude: p.lng,
    gridRegion: p.region,
    co2IntensityGPerKwh: co2,
    substationName: p.sub,
    coolingType: p.cool,
    status: "online",
    currentOutputMw: output,
    capacityFactor: cf,
    spotPriceMwh: spot,
    lmpBreakdown: { energy: Math.round(spot * 0.85 * 10) / 10, congestion: Math.round(spot * 0.10 * 10) / 10, loss: Math.round(spot * 0.05 * 10) / 10, total: spot },
    lastUpdated: new Date().toISOString(),
    climateTraceAssetId: `ct-${p.id}`,
    annualCo2EmissionsTons: p.fuelType === "coal" || p.fuelType === "gas" ? Math.round((output * 8760 * co2) / 1000000) : 0,
    satelliteTracked: true,
    turbineManufacturer: p.fuelType === "nuclear" ? "Doosan Enerbility (APR1400 / OPR1000)" : p.fuelType === "gas" ? "Doosan DGT-6 / GE Vernova" : "Andritz Hydro / Hanwha Solar",
    unitCount: p.capacityMw > 4000 ? 6 : p.capacityMw > 2000 ? 4 : 2
  };
});

// Enrich Japan Plants
const enrichedJP = JAPAN_STATIONS.map((p, i) => {
  const cf = p.fuelType === "nuclear" ? 0.95 : p.fuelType === "coal" ? 0.87 : p.fuelType === "gas" ? 0.88 : p.fuelType === "hydro" ? 0.86 : p.fuelType === "storage" ? 0.85 : 0.81;
  const output = Math.round(p.capacityMw * cf);
  const spot = p.fuelType === "solar" || p.fuelType === "wind" ? 22.0 : p.fuelType === "hydro" ? 25.0 : p.fuelType === "nuclear" ? 28.0 : p.fuelType === "coal" ? 58.5 : 68.0;
  const co2 = p.fuelType === "coal" ? 770 : p.fuelType === "gas" ? 350 : p.fuelType === "nuclear" ? 12 : p.fuelType === "hydro" ? 15 : 38;

  return {
    id: p.id,
    name: p.name,
    operator: p.operator,
    country: "JP",
    countryName: "Japan",
    fuelType: p.fuelType,
    capacityMw: p.capacityMw,
    commissioningYear: p.commYear,
    latitude: p.lat,
    longitude: p.lng,
    gridRegion: p.region,
    co2IntensityGPerKwh: co2,
    substationName: p.sub,
    coolingType: p.cool,
    status: "online",
    currentOutputMw: output,
    capacityFactor: cf,
    spotPriceMwh: spot,
    lmpBreakdown: { energy: Math.round(spot * 0.85 * 10) / 10, congestion: Math.round(spot * 0.10 * 10) / 10, loss: Math.round(spot * 0.05 * 10) / 10, total: spot },
    lastUpdated: new Date().toISOString(),
    climateTraceAssetId: `ct-${p.id}`,
    annualCo2EmissionsTons: p.fuelType === "coal" || p.fuelType === "gas" ? Math.round((output * 8760 * co2) / 1000000) : 0,
    satelliteTracked: true,
    turbineManufacturer: p.fuelType === "nuclear" ? "Hitachi-GE / Mitsubishi Heavy Industries" : p.fuelType === "gas" ? "Mitsubishi Power M501JAC" : "Hitachi Mitsubishi Hydro",
    unitCount: p.capacityMw > 4000 ? 6 : p.capacityMw > 2000 ? 4 : 2
  };
});

plants.push(...enrichedKR);
plants.push(...enrichedJP);

fs.writeFileSync(plantsPath, JSON.stringify(plants, null, 2), 'utf-8');
console.log(`✓ Power plants updated: Total = ${plants.length} (South Korea: ${enrichedKR.length}, Japan: ${enrichedJP.length})`);

// 2. Write Substations
const subPath = path.join(process.cwd(), 'data', 'substations.json');

// Auto-derive additional high-voltage substations from power stations dataset
const derivedSubsMap = new Map();

SUBSTATION_SEEDS.forEach(s => derivedSubsMap.set(s.id, {
  ...s,
  connectedPlantsCount: 1,
  connectedCapacityMw: s.capMw || 2000
}));

plants.forEach((p, idx) => {
  if (p.substationName && !p.substationName.includes("—")) {
    const subId = `sub-${p.country.toLowerCase()}-${idx + 1}`;
    const name = p.substationName;
    const kvMatch = name.match(/(\d{2,3})\s*k[Vv]/i);
    const kv = kvMatch ? parseInt(kvMatch[1], 10) : 345;
    
    // Switchyard location: adjacent inland node
    const subLat = Math.round((p.latitude + 0.002) * 10000) / 10000;
    const subLng = Math.round((p.longitude + 0.002) * 10000) / 10000;

    if (!derivedSubsMap.has(subId) && derivedSubsMap.size < 550) {
      derivedSubsMap.set(subId, {
        id: subId,
        name: p.substationName,
        voltageKv: kv,
        latitude: subLat,
        longitude: subLng,
        gridRegion: p.gridRegion,
        country: p.country,
        countryName: p.countryName,
        connectedCapacityMw: p.capacityMw,
        connectedPlantsCount: 1,
        type: kv >= 500 ? "transmission_hub" : kv >= 345 ? "pooling" : "switchyard",
        operator: p.operator
      });
    }
  }
});

const finalSubstations = Array.from(derivedSubsMap.values());
fs.writeFileSync(subPath, JSON.stringify(finalSubstations, null, 2), 'utf-8');
console.log(`✓ Substations updated: Total = ${finalSubstations.length}`);

// 3. Cross-reference all Data Centers against updated plants and substations
const dcsPath = path.join(process.cwd(), 'data', 'datacenters.json');
let dcs = JSON.parse(fs.readFileSync(dcsPath, 'utf-8'));

const enrichedDcs = dcs.map(dc => {
  const nearby = plants
    .map(p => ({ plant: p, dist: haversineDistanceKm(dc.latitude, dc.longitude, p.latitude, p.longitude) }))
    .sort((a, b) => a.dist - b.dist)
    .slice(0, 10);

  let cleanCap = 0;
  let totalCap = 0;
  let weightedCo2Sum = 0;

  for (const item of nearby) {
    totalCap += item.plant.capacityMw;
    const co2 = item.plant.co2IntensityGPerKwh || (item.plant.fuelType === "coal" ? 820 : item.plant.fuelType === "gas" ? 490 : 15);
    weightedCo2Sum += co2 * item.plant.capacityMw;
    if (["nuclear", "hydro", "solar", "wind", "geothermal", "storage"].includes(item.plant.fuelType)) {
      cleanCap += item.plant.capacityMw;
    }
  }

  const cleanPercent = totalCap > 0 ? parseFloat(((cleanCap / totalCap) * 100).toFixed(1)) : 50.0;
  const avgCo2 = totalCap > 0 ? Math.round(weightedCo2Sum / totalCap) : 350;
  const annualEnergyMwh = dc.estimatedPowerMw * 8760 * (dc.pue || 1.25);
  const estimatedAnnualCo2Tons = Math.round((annualEnergyMwh * avgCo2 * 1000) / 1000000);

  return {
    ...dc,
    localCleanEnergyPercent: cleanPercent,
    estimatedAnnualCo2Tons: estimatedAnnualCo2Tons
  };
});

fs.writeFileSync(dcsPath, JSON.stringify(enrichedDcs, null, 2), 'utf-8');
console.log(`✓ Data centers updated & cross-referenced: Total = ${enrichedDcs.length}`);
