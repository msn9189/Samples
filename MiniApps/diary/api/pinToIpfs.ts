import pinataSDK from "@pinata/sdk";

// Environment variables for Pinata API 
const PINATA_KEY = process.env.PINATA_API_KEY;
const PINATA_SECRET = process.env.PINATA_API_SECRET;

if (!PINATA_KEY || !PINATA_SECRET) {
    console.warn("Pinata keys not set in enviroment variables"); // Warn if API keys are missing
}

// Initialize Pinata SDK if keys are available, otherwise null
const pinata = PINATA_KEY && PINATA_SECRET ? new pinataSDK(PINATA_KEY, PINATA_SECRET) : null;

export default async function handler(req: any, res: any) {
  // Handle incoming HTTP requests
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" }); // Return 405 if method is not POST
    return;
  }

  try {
    const { memory } = req.body ?? {}; // Extract 'memory' from request body, default to undefined if not present.
    if (!memory || typeof memory !== "string") {
      res.status(400).json({ error: "Invalid body: 'memory' required" }); // Return 400 if memory is invalid or missing
      return;
    }

    if (!pinata) {
      res.status(500).json({ error: "Pinata not configured on server" }); // Return 500 if Pinata is not defined.
      return;
    }

    // Pin JSON to IPFS (you can change to pinFileToIPFS or other endpoint if prefer)
    const result = await pinata.pinJSONToIPFS({
      memory, // The memory text to pin
      timestamp: new Date().toISOString(), // Add current timestamp to the pinned data
    });

    // result.IpfsHash contains CID
    res.status(200).json({ IpfsHash: result.IpfsHash }); // Retunr 200 with the IPFS hash (CID)
  } catch (err: any) {
    console.error("pinToIpfs error:", err);  // Log any errors that occur during pinning
    res.status(500).json({ error: err?.message ?? "Unknown error" }); // Return 500 with error message
  }
}