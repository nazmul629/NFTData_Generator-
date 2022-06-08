const Moralis = require('moralis/node')

const tableNFTAdd = "NFTAddress"
const tableName = "RarityGenerator"
const serverUrl ='https://qais2ihqdvv5.usemoralis.com:2053/server';
const appId = 'cFpCVtf3aTyfNn8ksqyuXlKpuW3XJB19BhXxhRcl';

Moralis.start({ serverUrl, appId });


const resolveLink = (url) => {
  if (!url || !url.includes("ipfs://")) return url;
  return url.replace("ipfs://", "https://gateway.ipfs.io/ipfs/");
};



// const collectionAddress =    "0x1848c33f7e4be33f60b19b23c15671c52896c168"
const collectionAddress = "0xBC4CA0EdA7647A8aB7C2061c2E118A18a936f13D"
// const collectionAddress = "0xDaF7F01B17209BC1e13c8f493263eB48fc7B9250"

const collectionName = "BoredApeYachtClub"

async function generateRarity(){
  const NFTs = await Moralis.Web3API.token.getAllTokenIds({address:collectionAddress});
  // console.log(NFTs);
  const totalNum = NFTs.total;
  const pageSize= NFTs.page_size ;
 // console.log("totalNum",totalNum);
  //console.log(pageSize);
  let allNFTs = NFTs.result;
  //console.log(allNFTs.length);

  const timer = (ms) => new Promise((res) => setTimeout(res, ms));

  result1 = await Moralis.Web3API.token.getAllTokenIds({ address: collectionAddress})
 
  while (result1.next){
      result1 = await result1.next()
      allNFTs = allNFTs.concat(result1.result)
      //console.log(allNFTs)
     // console.log(allNFTs.length)
  }
  

  let metadata = allNFTs.map((e) => JSON.parse(e.metadata).attributes);
  
  //console.log("metadata" , metadata);

  let tally = { TraitCount: {} };

  for (var j = 0; j < metadata.length; j++) {
      if (typeof(metadata[j]) !== 'undefined') {
         
         // console.log("j" ,metadata[j], j);
    var nftTraits = metadata[j].map((e) => e.trait_type);
    var nftValues = metadata[j].map((e) => e.value);
    //console.log("nftTraits" , nftTraits);
    var numOfTraits = nftTraits?.length;
   // console.log("numOfTraits" , numOfTraits);
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
      //---------------------

      let currentValue = nftValues[i];
      if (tally[current][currentValue]) {
        tally[current][currentValue]++;
      } 
      else {
        tally[current][currentValue] = 1;
        }  
      
  
      }
  }

  }
 // let current = metadata.result

   //let current = metadata.result

  

   const collectionAttributes = Object.keys(tally);
   let nftArr =[]
   
   for (let j = 0; j < metadata.length; j++){
      let current = metadata[j];
      let totalRarity = 0;
      if(typeof(current) !== "undefined"){
      //console.log(" current",j, typeof(current));
      //console.log("current",current);

      for (let i = 0; i < current.length; i++) {
        let rarityScore =
          1 / (tally[current[i].trait_type][current[i].value] / totalNum);
        current[i].rarityScore = rarityScore;
        totalRarity += rarityScore;
          
    // console.log("after current",i,typeof(current));
    console.log("Total Reariy  ",rarityScore);


    

    }

      let rarityScoreNumTraits = 1 / (tally.TraitCount[Object.keys(current).length] /totalNum) ;
      current.push({
      trait_type: "TraitCount" ,
      value: Object.keys(current).length,
      rarityScore: rarityScoreNumTraits,
    }); 
      totalRarity +=rarityScoreNumTraits;

      }


    if(typeof(current) !== "undefined"){
      if (current.length < collectionAttributes.length) {
        let nftAttributes = current.map((e) => e.trait_type);
        let absent = collectionAttributes.filter(
          (e) => !nftAttributes.includes(e)
        );

        absent.forEach((type) => {
          let rarityScoreNull = 1 / ((totalNum - tally[type].occurance) / totalNum);

          current.push({
            trait_type: type,
            value: null,
            rarityScore: rarityScoreNull,

          });
       

          totalRarity += rarityScoreNull;
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
          // console.log(error);
        }
      }





      if(typeof(current) !== "undefined"){  
        nftArr.push({
            Attributes:current,
            Rarity:totalRarity,
            token_id: allNFTs[j].token_id,
            image: allNFTs[j].image,
        })};
    }
    
    nftArr.sort((a, b) => b.Rarity - a.Rarity);
    for(let i = 0; i < nftArr.length; i++){
    nftArr[i].Rank = i + 1;
    const newClass = Moralis.Object.extend(tableName) ;
    const newObject = new newClass();
    newObject.set( "name" , collectionName) ;
    newObject.set("address", collectionAddress);
    newObject.set( "attributes" , nftArr[i].Attributes) ;
    newObject.set("rarity", nftArr[i].Rarity);
    newObject.set ("tokenId" ,nftArr[i].token_id) ;
    newObject.set ("rank" ,nftArr[i].Rank) ;
    newObject.set("image", nftArr[i].image) ;
    await newObject.save();
    
    console.log(i)}
    
    const newClass = Moralis.Object.extend(tableNFTAdd) ;
    const NFTContract = new newClass();
    NFTContract.set( "name" , collectionName) ;
    NFTContract.set("address", collectionAddress);         
    }
  }
    generateRarity();
  
