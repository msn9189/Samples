import pinataSDK from "@pinata/sdk";

const PINATA_KEY = process.env.PINATA_API_KEY;
const PINATA_SECRET = process.env.PINATA_API_SECRET;

if (!PINATA_KEY || !PINATA_SECRET) {
    console.warn("Pinata keys not set in enviroment variables");
}

const pinata = PINATA_KEY && PINATA_SECRET ? new pinataSDK(PINATA_KEY, PINATA_SECRET) : null;

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  try {
    const { memory } = req.body ?? {};
    if (!memory || typeof memory !== "string") {
      res.status(400).json({ error: "Invalid body: 'memory' required" });
      return;
    }

    if (!pinata) {
      res.status(500).json({ error: "Pinata not configured on server" });
      return;
    }

    // Pin JSON to IPFS (you can change to pinFileToIPFS or other endpoint if prefer)
    const result = await pinata.pinJSONToIPFS({
      memory,
      timestamp: new Date().toISOString(),
    });

    // result.IpfsHash contains CID
    res.status(200).json({ IpfsHash: result.IpfsHash });
  } catch (err: any) {
    console.error("pinToIpfs error:", err);
    res.status(500).json({ error: err?.message ?? "Unknown error" });
  }
}