// Import Hardhat's ethers for contract interaction.
const { ethers, vars } = require("hardhat");

// Import uploadToIPFS function from the uploadToIPFS.js.
const { uploadToIPFS } = require("./uploadToIPFS");

// main function accepts memoryText as input.
async function main(memoryText) {
  // Define contract address and Infura credentials.
  const contractAddress = "0x5df26eAa1753cf24Ead918b3372Be1f0C517dDE9"; // Replace with deployed address.

  // Get Pinata credentials with Hardhat vars.
  const pinataApiKey = await vars.get("PINATA_API_KEY");
  const pinataSecretApiKey = await vars.get("PINATA_API_SECRET");

  // Upload metadata to IPFS and get hash.
  const ipfsHash = await uploadToIPFS(
    memoryText,
    pinataApiKey,
    pinataSecretApiKey
  );
  console.log("IPFS Hash:", ipfsHash);

  // Get contract factory and attach to deployed contract.
  const DiaryNFT = await ethers.getContractFactory("DiaryNFT");
  const diaryNFT = await DiaryNFT.attach(contractAddress);

  // Log current tokenIds.
  console.log("Current tokenIds:", (await diaryNFT.tokenIds()).toString());

  // call mintDiary to mint NFT to msg.sender with ipfshash.
  const tx = await diaryNFT.mintDiary(ipfsHash);

  // wait for transaction and get receipt.
  const receipt = await tx.wait();

  // Find DiaryMinted event and log token Id.
  const diaryMintedEvent = receipt.events.find(
    (e) => e.event === "DiaryMinted"
  );
  console.log(
    "Minted NFT, Token ID:",
    diaryMintedEvent.args.tokenId.toString()
  );

  // log updated tokenIds
  console.log("Updated tokenIds:", (await diaryNFT.tokenIds()).toString());
}

// Execute script with memoryText from command-line argument or default.
const memoryText = process.argv[2] || "Sample diary entry"; // Use first argument or default.
main(memoryText).catch(console.error);
