const Moralis = require("moralis/node");


const serverUrl = "https://wdetopfpy4ri.usemoralis.com:2053/server"; //Moralis Server Url here
const appId = "L1CRfUFFtqF9frxkvkXVZ07MwkdksUXrAWq99gpE"; //Moralis Server App ID here

Moralis.start({ serverUrl, appId });


const resolveLink = (url) => {
    if (!url || !url.includes("ipfs://")) return url;
    return url.replace("ipfs://", "https://gateway.ipfs.io/ipfs/");
  };
  


const collectionAddress = "0xBC4CA0EdA7647A8aB7C2061c2E118A18a936f13D"
const collectionName = "BoredApeYachtClub"


async function generateRarity(){
    const NFTs = await Moralis.Web3API.token.getAllTokenIds({address:collectionAddress});
    // console.log(NFTs.block_number_minted)
    const totalNum = NFTs.total;
    const pageSize = NFTs.page_size;
    // console.log(totalNum);
    // console.log(pageSize);
    let allNFTs = NFTs.result
    // console.log(allNFTs);

    const timer = (ms) => new Promise((res) => setTimeout(res, ms));


    result1 = await Moralis.Web3API.token.getAllTokenIds({chain: "ETH", address: collectionAddress})
    while (result1.next){
        result1 = await result1.next()
        allNFTs = allNFTs.concat(result1.result)
        await timer(6000);
        console.log(allNFTs);
    }

    let metadata = allNFTs.map((e) => JSON.parse(e.metadata).attributes);
    // console.log(metadata[0]);

    let tally = { "TraitCount": {}};

    for (var j = 0; j < metadata.length; j++) {
       
         if (typeof(metadata[j]) !== 'undefined') {

            var nftTraits = metadata[j].map((e) => e.trait_type);
            var nftValues = metadata[j].map((e) => e.value);

            var numOfTraits = nftTraits?.length;

            if (tally.TraitCount[numOfTraits]) {
                tally.TraitCount[numOfTraits]++;
            } else {
                tally.TraitCount[numOfTraits] = 1;
            }

            for(let i=0; i < nftTraits.length; i++){
                let current = nftTraits[i];
                if(tally[current])
                {
                    tally[current].occurance++;
                } else {
                    tally[current] ={occurance: 1};
                }

                let currentValue = nftValues[i];
                if(tally[current][currentValue]) {
                    tally[current][currentValue]++;
                } else{
                  tally[current][currentValue] = 1;
                }  

            } 
  
        }
    }
    // console.log(tally);

    const collectionAttributes = Object.keys(tally);
    let nftArr = [];

    for (var j = 0; j < metadata.length; j++) {
        if (typeof(metadata[j]) !== 'undefined'){
            let current = metadata[j];
            let totalRarity = 0

            for (let i = 0; i < current.length; i++){
                let rarityScore = 1 / (tally [current[i].trait_type] [current[i].value] / totalNum);
                current[i].rarityScore = rarityScore;
                totalRarity+=rarityScore;
             }
             let rarityScoreNumTraits = 1 / (tally.TraitCount[Object.keys(current).length] /totalNum) ;
            current.push({
                trait_type: "TraitCount" ,
                value: Object.keys(current).length,
                rarityScore: rarityScoreNumTraits
            });
            totalRarity+=rarityScoreNumTraits;


            if(current.length < collectionAttributes.length){
                let nftAttribute = current.map((e)=> e.trait_type);
                let absent = collectionAttributes.filter((e) => !nftAttribute.includes(e)
                );

                absent.forEach((type) => {
                    let rarityScoreNull = 1 / ((totalNum - tally[type].occurance) /totalNum); // occurance
                    current.push({
                        trait_type: type,
                        value: null,
                        rarityScore: rarityScoreNull,
                    });
                    totalRarity += rarityScoreNull;
                      console.log(current)
                });
            }

            if (allNFTs[j].metadata) {
                allNFTs[j].metadata = JSON.parse(allNFTs[j].metadata);
                allNFTs[j].image = resolveLink(allNFTs[j].metadata.image);
              } else if (allNFTs[j].token_uri) {
                try {
                  await fetch(allNFTs[j].token_uri)
                    .then((response) => response.json())
                    .then((data) => {
                      allNFTs[j].image = resolveLink(data.image);
                    });
                } catch (error) {
                  console.log(error);
                }
              }

            nftArr.push({
                Attributes:current,
                Rarity:totalRarity,
                token_id: allNFTs[j].token_id,
                image: allNFTs[j].image,
            });

        }
    } 
    // console.log(metadata[0]);
    // console.log(nftArr);
    nftArr.sort((a, b) => b.Rarity - a.Rarity);

    for (let i = 0; i < nftArr.length; i++) {
        nftArr[i].Rank = i + 1;
        const newClass = Moralis.Object.extend(collectionName);
        const newObject = new newClass();

        newObject.set("attributes", nftArr[i].Attributes);
        newObject.set("rarity", nftArr[i].Rarity);
        newObject.set("tokenId", nftArr[i].token_id);
        newObject.set("rank", nftArr[i].Rank);
        newObject.set("image", nftArr[i].image);

        await newObject.save();
        console.log(i);
    }




}

generateRarity()