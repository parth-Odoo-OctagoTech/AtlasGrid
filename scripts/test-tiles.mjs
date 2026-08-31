async function testTiles() {
  const urls = [
    "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json",
    "https://a.basemaps.cartocdn.com/dark_all/0/0/0.png",
    "https://tile.openstreetmap.org/0/0/0.png",
    "https://a.basemaps.cartocdn.com/rastertiles/voyager/0/0/0.png"
  ];

  for (const url of urls) {
    try {
      const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } });
      console.log(`URL: ${url} -> Status: ${res.status} ${res.statusText} (${res.headers.get("content-type")})`);
    } catch (err) {
      console.error(`URL: ${url} -> ERROR:`, err.message);
    }
  }
}

testTiles();
