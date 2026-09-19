import { DataCenter } from "@/lib/types/data-center";

export const OPERATOR_PORTALS: Record<string, string> = {
  "Amazon Web Services (AWS)": "https://aws.amazon.com/about-aws/global-infrastructure/",
  "Microsoft Azure": "https://azure.microsoft.com/explore/global-infrastructure/",
  "Google Cloud (GCP)": "https://cloud.google.com/about/locations",
  "Meta Hyperscale": "https://datacenters.atmeta.com/",
  "Equinix IBX": "https://www.equinix.com/data-centers",
  "Digital Realty": "https://www.digitalrealty.com/data-centers",
  "NTT Global Data Centers": "https://services.global.ntt/en-us/services-and-solutions/data-center",
  "CyrusOne": "https://cyrusone.com/data-centers/",
  "QTS Data Centers": "https://www.qtsdatacenters.com/",
  "Oracle Cloud (OCI)": "https://www.oracle.com/cloud/data-regions/",
  "Switch SuperNAP": "https://www.switch.com/the-citadel/",
  "Reliance Jio Data Centers": "https://www.jio.com/business/cloud-data-centers",
  "AdaniConnex": "https://www.adaniconnex.com/",
  "STT GDC India": "https://www.sttelemediagdc.in/",
  "STT GDC": "https://www.sttelemediagdc.com/",
  "CtrlS Datacenters": "https://www.ctrls.in/",
  "Yotta Infrastructure": "https://yotta.com/",
  "Nxtra by Airtel": "https://www.nxtra.in/",
  "Sify Technologies": "https://www.sifytechnologies.com/data-centers/",
  "Flexential": "https://www.flexential.com/data-centers",
  "Lumen Technologies": "https://www.lumen.com/en-us/hybrid-cloud/edge-computing.html",
  "Vantage Data Centers": "https://vantage-dc.com/",
  "EdgeConneX": "https://www.edgeconnex.com/",
  "CoreSite": "https://www.coresite.com/",
  "Stack Infrastructure": "https://www.stackinfra.com/",
  "Iron Mountain": "https://www.ironmountain.com/data-centers",
  "Telehouse": "https://www.telehouse.net/",
  "NextDC": "https://www.nextdc.com/",
  "AirTrunk": "https://www.airtrunk.com/",
  "Cologix": "https://cologix.com/",
  "Teraco": "https://www.teraco.co.za/",
  "Pulsant": "https://www.pulsant.com/",
  "Datacenter United": "https://www.datacenterunited.com/",
  "TierPoint": "https://www.tierpoint.com/",
  "Data4": "https://www.data4group.com/",
  "data4": "https://www.data4group.com/",
  "Data4 Italia": "https://www.data4group.com/",
  "atNorth": "https://atnorth.com/",
  "NorthC": "https://www.northcdatacenters.com/",
  "Bouygues Télécom": "https://www.bouyguestelecom-entreprises.fr/",
  "Bouygues Telecom": "https://www.bouyguestelecom-entreprises.fr/",
  "SFR": "https://www.sfrbusiness.fr/",
  "Orange": "https://www.orange-business.com/",
  "Vodafone": "https://www.vodafone.com/business",
  "TIM": "https://www.timbusiness.it/",
  "Aruba s.p.a.": "https://www.datacenter.it/",
  "Turkcell": "https://www.turkcell.com.tr/kurumsal/veri-merkezi",
  "Ncell": "https://www.ncell.com.np/",
  "DataWorld / WorldLink": "https://worldlink.com.np/",
  "National Information Technology Center (NITC)": "https://nitc.gov.np/",
  "Data Hub Nepal": "https://datahubnepal.com/",
  "DishHome (Datalaya)": "https://dishhome.com.np/",
  "Nepal Telecom": "https://ntc.net.np/",
};

/**
 * Returns a direct Google Maps search URL with exact GPS coordinates pin.
 */
export function getGoogleMapsUrl(dc: { latitude: number; longitude: number; name?: string }): string {
  return `https://www.google.com/maps/search/?api=1&query=${dc.latitude},${dc.longitude}`;
}

/**
 * Returns a Google Earth 3D satellite view URL.
 */
export function getGoogleEarthUrl(dc: { latitude: number; longitude: number }): string {
  return `https://earth.google.com/web/search/${dc.latitude},${dc.longitude}`;
}

/**
 * Returns the best available official website for the facility or its operator.
 */
export function getOfficialWebsite(dc: {
  website?: string | null;
  operator: string;
  name: string;
}): {
  url: string;
  label: string;
  isDirect: boolean;
  domain: string;
} {
  if (dc.website && typeof dc.website === "string" && dc.website.startsWith("http")) {
    try {
      const urlObj = new URL(dc.website);
      return {
        url: dc.website,
        label: "Facility Official Website",
        isDirect: true,
        domain: urlObj.hostname.replace(/^www\./, ""),
      };
    } catch {
      return {
        url: dc.website,
        label: "Facility Official Website",
        isDirect: true,
        domain: dc.website,
      };
    }
  }

  const portal = OPERATOR_PORTALS[dc.operator];
  if (portal) {
    try {
      const urlObj = new URL(portal);
      return {
        url: portal,
        label: `${dc.operator} Infrastructure Portal`,
        isDirect: false,
        domain: urlObj.hostname.replace(/^www\./, ""),
      };
    } catch {
      return {
        url: portal,
        label: `${dc.operator} Infrastructure Portal`,
        isDirect: false,
        domain: portal,
      };
    }
  }

  // Fallback search
  const query = `${dc.name} ${dc.operator} official website`;
  return {
    url: `https://www.google.com/search?q=${encodeURIComponent(query)}`,
    label: "Search Operator Website",
    isDirect: false,
    domain: "google.com/search",
  };
}

/**
 * Returns the authoritative primary source reference where the data center was cataloged.
 */
export function getPrimarySourceReference(dc: {
  peeringDbId?: number;
  osmId?: number;
  name: string;
  operator: string;
}): {
  sourceName: string;
  label: string;
  url: string;
  badge: string;
  type: "peeringdb" | "osm" | "web";
  description: string;
} {
  if (dc.peeringDbId && typeof dc.peeringDbId === "number") {
    return {
      sourceName: "PeeringDB Global Registry",
      label: `PeeringDB Fac #${dc.peeringDbId}`,
      url: `https://www.peeringdb.com/fac/${dc.peeringDbId}`,
      badge: "Authoritative Directory",
      type: "peeringdb",
      description: "Public directory listing facility specs, ASN carriers, and IXP interconnects.",
    };
  }

  if (dc.osmId && typeof dc.osmId === "number") {
    const isWay = dc.osmId > 0;
    const absId = Math.abs(dc.osmId);
    return {
      sourceName: "OpenStreetMap Geospatial Feature",
      label: `OSM ${isWay ? "Way" : "Node"} #${absId}`,
      url: `https://www.openstreetmap.org/${isWay ? "way" : "node"}/${absId}`,
      badge: "Geospatial Footprint",
      type: "osm",
      description: "Global open spatial database record mapping physical building footprint.",
    };
  }

  const query = `${dc.name} ${dc.operator} data center technical specifications`;
  return {
    sourceName: "Web Documentation & Specs",
    label: "Google Specifications Search",
    url: `https://www.google.com/search?q=${encodeURIComponent(query)}`,
    badge: "Web Reference",
    type: "web",
    description: "Search engineering specifications, data sheets, and news online.",
  };
}

/**
 * Returns a web search URL for full online technical specifications and intelligence.
 */
export function getWebSearchUrl(dc: { name: string; operator: string; countryName?: string; country?: string }): string {
  return `https://www.google.com/search?q=${encodeURIComponent(`${dc.name} ${dc.operator} data center technical specifications`)}`;
}
