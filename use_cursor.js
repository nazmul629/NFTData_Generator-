const Moralis = require("moralis/node");

const serverUrl = "https://wdetopfpy4ri.usemoralis.com:2053/server"; 
const appId = "L1CRfUFFtqF9frxkvkXVZ07MwkdksUXrAWq99gpE"; 



const contractAddress = "0x6728d91abACdbac2f326baa384513a523C21b80a";
async function getAllOwners() {
  await Moralis.start({ serverUrl: serverUrl, appId: appId });
  let cursor = null;
  let NFT = {};

  const timer = (ms) => new Promise((res) => setTimeout(res, ms))

  do {
    const response = await Moralis.Web3API.token.getAllTokenIds({
      address: contractAddress,
      chain: "eth",
      limit: 100,
      cursor: cursor,
    });
    let allNFTs = response.result;
    console.log(
      `Got page ${response.page} of ${Math.ceil(
        response.total / response.page_size
      )}, ${response.total} total`
    );
    for (const NFT of response.result) {
        allNFTs = allNFTs.concat(NFT);
        console.log('inside loop', allNFTs.length);
        await timer(6000);

    }
    cursor = response.cursor;
  } while (cursor != "" && cursor != null);
  console.log("total NFTs:", Object.keys(allNFTs).length);
}

getAllOwners();