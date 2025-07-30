const {ethers, upgrades} = require("hardhat");
const {expect} = require("chai");
const {BigNumber} = require("ethers");

async function main() {

  let PioneerNFTStaking, PioneerStakingUnlockRule;
  let staking, isk, nft, unlockRule;
  let owner, pioneerSale, privateUser1, privateUser2, publicUser1, publicUser2, publicUser3, publicUser4, publicUser5;

  [privateUser1, privateUser2, publicUser1, publicUser2, publicUser3, publicUser4, publicUser5, owner, pioneerSale] = await ethers.getSigners();
  PioneerNFTStaking = await ethers.getContractFactory("PioneerNFTStaking");
  PioneerStakingUnlockRule = await ethers.getContractFactory("PioneerStakingUnlockRule");
  const IskraToken = await ethers.getContractFactory("IskraToken");
  const PioneerNFT = await ethers.getContractFactory("PioneerNFT");

  staking = await PioneerNFTStaking.connect(owner).deploy({gasLimit: 9000000});
  await staking.deployed();
  nft = await PioneerNFT.connect(owner).deploy([300, 0, 30, 70], 10, {gasLimit: 9000000});
  await nft.deployed();
  // isk = await IskraToken.connect(owner).deploy("1000000000000000000000000000", {gasLimit: 9000000});
  // await isk.deployed();
  isk = await IskraToken.attach("0x88A9386F7D3fec0d11c08F5d02d7F73704dc82Df");

  const beacon = await upgrades.deployBeacon(PioneerNFTStaking.connect(owner), {gasLimit: 9000000});
  await beacon.deployed();
  const proxy = await upgrades.deployBeaconProxy(beacon, PioneerNFTStaking.connect(owner), [nft.address, isk.address], {gasLimit: 9000000});
  await proxy.deployed();
  staking = PioneerNFTStaking.attach(proxy.address);
  unlockRule = await PioneerStakingUnlockRule.connect(owner).deploy(staking.address, nft.address, 50, 300, 10, 1, {gasLimit: 9000000});
  await unlockRule.deployed();

  expect(await  nft.connect(owner).setMintingListener(unlockRule.address, {gasLimit: 9000000}))
    .emit(nft, "MintingListenerRegistered").withArgs(unlockRule.address);
  await expect(nft.connect(owner).registerPauseExcluded(staking.address, {gasLimit: 9000000})).not.reverted;
  await expect(staking.connect(owner).setRewardUnlockRule(unlockRule.address, {gasLimit: 9000000})).not.reverted;
  await expect(staking.connect(owner).setPioneerSale(pioneerSale.address, {gasLimit: 9000000})).not.reverted;
  // await expect(isk.transfer(staking.address, "400000000000000000000000000", {gasLimit: 9000000})).not.reverted;


  //0xE020A6AEc3e30902A6838C69Cb372357954a4A42
  console.log("const stakingAddr =", "\""+staking.address+"\"");
  console.log("const unlockRuleAddr =", "\""+unlockRule.address+"\"");
  console.log("const nftAddr =", "\""+nft.address+"\"");
  console.log("const iskAddr =", "\""+isk.address+"\"");

  const startTime = Math.floor(+ new Date() / 1000);

  console.log("setStart", staking.interface.encodeFunctionData("setStart",[startTime + 20]))
  await staking.connect(owner).setStart(startTime + 20);

  const rewardRate = BigNumber.from("6341958396752917300");
  let numStakedNFTs = 0;
  let numReferrals = 0;
  let userNumStakedNFTs = {};
  let userNumReferrals = {};
  let userRewards = {};
  userRewards[privateUser1.address] = BigNumber.from(0);
  userRewards[privateUser2.address] = BigNumber.from(0);
  userRewards[publicUser1.address] = BigNumber.from(0);
  userRewards[publicUser2.address] = BigNumber.from(0);
  userRewards[publicUser3.address] = BigNumber.from(0);
  userRewards[publicUser4.address] = BigNumber.from(0);
  userRewards[publicUser5.address] = BigNumber.from(0);

  let tx, receipt;
  console.log("mintPrivateBatch", nft.interface.encodeFunctionData("mintPrivateBatch",[privateUser1.address, 30]))
  tx = await nft.connect(owner).mintPrivateBatch(privateUser1.address, 1, {gasLimit: 9000000});
  receipt = await tx.wait();
  console.log(receipt.transactionHash + " -> "+ (receipt.status===1?"success":"failure"));
  console.log("mintPrivateBatch", nft.interface.encodeFunctionData("mintPrivateBatch",[privateUser2.address, 10]))
  tx = await nft.connect(owner).mintPrivateBatch(privateUser2.address, 39, {gasLimit: 9000000});
  receipt = await tx.wait();
  console.log(receipt.transactionHash + " -> "+ (receipt.status===1?"success":"failure"));

  async function stakeBatch(user, startId, amount) {
    let tokenIds = [];
    for(let i=0; i< amount; i++) {
      tokenIds.push(startId + i);
    }
    const data = staking.interface.encodeFunctionData("stake(address,uint256[])", [ user.address, tokenIds ])

    console.log("approveBatchAndCall "+startId, nft.interface.encodeFunctionData("approveBatchAndCall",[staking.address, tokenIds, data]))
    let tx, receipt;
    tx = await nft.connect(user).approveBatchAndCall(staking.address, tokenIds, data, {gasLimit: 9000000});
    receipt = await tx.wait();
    console.log(receipt.transactionHash + " -> "+ (receipt.status===1?"success":"failure"));
    if (isNaN(userNumStakedNFTs[user.address])) {
      userNumStakedNFTs[user.address] = 0;
    }
    numStakedNFTs += amount;
    userNumStakedNFTs[user.address] += amount;
  }

  async function addReferral(tokenId, buyer, referee) {
    let tx, receipt;
    console.log("addReferral", staking.interface.encodeFunctionData("addReferral",[tokenId, buyer, referee]))
    tx = await staking.connect(pioneerSale).addReferral(tokenId, buyer, referee, {gasLimit: 9000000});
    receipt = await tx.wait();
    console.log(receipt.transactionHash + " -> "+ (receipt.status===1?"success":"failure"));
    numReferrals++;
    userNumReferrals[referee]++;

    if (isNaN(userNumReferrals[referee])) {
      userNumReferrals[referee] = 0;
    }
  }

  await stakeBatch(privateUser1, 1, 1); // token id 1~30
  await stakeBatch(privateUser2, 2, 39); // token id 31~40

  function sleep(sec) {
    return new Promise(resolve => setTimeout(resolve, sec * 1000));
  }

  await sleep(20);

  console.log("initial_reward_rate:", (await staking.getRewardRate()).toString());
  console.log("start_time:", (await staking.start()).toString());
  console.log("half_life:", (await staking.REWARD_HALF_LIFE()).toString());

  let block = await ethers.provider.getBlock("latest");
  console.log("block.number:", block.number);

  let lastUpdated = startTime;
  console.log("mintPrivate", nft.interface.encodeFunctionData("mintPrivate",[publicUser1.address]))
  tx = await nft.connect(owner).mintPrivate(publicUser1.address); // token id 41
  receipt = await tx.wait();
  console.log(receipt.transactionHash + " -> "+ (receipt.status===1?"success":"failure"));

  console.log("mintPrivate 42", nft.interface.encodeFunctionData("mintPrivate",[publicUser2.address]))
  tx = await nft.connect(owner).mintPrivate(publicUser2.address); // token id 42
  receipt = await tx.wait();
  console.log(receipt.transactionHash + " -> "+ (receipt.status===1?"success":"failure"));
  await stakeBatch(publicUser2, 42, 1); // token id 42
  lastUpdated = parseInt(await staking.lastUpdatedAt());

  console.log("mintPrivate 43", nft.interface.encodeFunctionData("mintPrivate",[publicUser3.address]))
  tx = await nft.connect(owner).mintPrivate(publicUser3.address); // token id 43
  receipt = await tx.wait();
  console.log(receipt.transactionHash + " -> "+ (receipt.status===1?"success":"failure"));
  await stakeBatch(publicUser3, 43, 1); // token id 43
  lastUpdated = parseInt(await staking.lastUpdatedAt());

  console.log("mintPrivate 44", nft.interface.encodeFunctionData("mintPrivate",[publicUser4.address]))
  tx = await nft.connect(owner).mintPrivate(publicUser4.address); // token id 44
  receipt = await tx.wait();
  console.log(receipt.transactionHash + " -> "+ (receipt.status===1?"success":"failure"));
  await stakeBatch(publicUser4, 44, 1); // token id 44
  lastUpdated = parseInt(await staking.lastUpdatedAt());

  console.log("mintPrivate 45", nft.interface.encodeFunctionData("mintPrivate",[publicUser5.address]))
  tx = await nft.connect(owner).mintPrivate(publicUser5.address); // token id 45
  receipt = await tx.wait();
  console.log(receipt.transactionHash + " -> "+ (receipt.status===1?"success":"failure"));
  await stakeBatch(publicUser5, 45, 1); // token id 45
  lastUpdated = parseInt(await staking.lastUpdatedAt());

  console.log("mintPrivate", nft.interface.encodeFunctionData("mintPrivate",[publicUser1.address]))
  tx = await nft.connect(owner).mintPrivate(publicUser1.address); // token id 46
  receipt = await tx.wait();
  console.log(receipt.transactionHash + " -> "+ (receipt.status===1?"success":"failure"));
  await addReferral(46, publicUser1.address, publicUser1.address);

  console.log("mintPrivate", nft.interface.encodeFunctionData("mintPrivate",[publicUser2.address]))
  tx = await nft.connect(owner).mintPrivate(publicUser2.address); // token id 47
  receipt = await tx.wait();
  console.log(receipt.transactionHash + " -> "+ (receipt.status===1?"success":"failure"));
  await addReferral(47, publicUser2.address, publicUser3.address);
  await stakeBatch(publicUser2, 47, 1); // token id 47
  lastUpdated = parseInt(await staking.lastUpdatedAt());

  console.log("mintPrivate", nft.interface.encodeFunctionData("mintPrivate",[publicUser3.address]))
  tx = await nft.connect(owner).mintPrivate(publicUser3.address); // token id 48
  receipt = await tx.wait();
  console.log(receipt.transactionHash + " -> "+ (receipt.status===1?"success":"failure"));
  await addReferral(48, publicUser3.address, publicUser3.address);
  await stakeBatch(publicUser3, 48, 1); // token id 48
  lastUpdated = parseInt(await staking.lastUpdatedAt());

  console.log("mintPrivate", nft.interface.encodeFunctionData("mintPrivate",[publicUser4.address]))
  tx = await nft.connect(owner).mintPrivate(publicUser4.address); // token id 49
  receipt = await tx.wait();
  console.log(receipt.transactionHash + " -> "+ (receipt.status===1?"success":"failure"));
  await stakeBatch(publicUser4, 49, 1); // token id 49
  lastUpdated = parseInt(await staking.lastUpdatedAt());

  console.log("mintPrivate", nft.interface.encodeFunctionData("mintPrivate",[publicUser5.address]))
  tx = await nft.connect(owner).mintPrivate(publicUser5.address); // token id 50
  receipt = await tx.wait();
  console.log(receipt.transactionHash + " -> "+ (receipt.status===1?"success":"failure"));
  await stakeBatch(publicUser5, 50, 1); // token id 50
  lastUpdated = parseInt(await staking.lastUpdatedAt());

  console.log("mintPrivate", nft.interface.encodeFunctionData("mintPrivate",[publicUser1.address]))
  tx = await nft.connect(owner).mintPrivate(publicUser1.address, {gasLimit: 9000000}); // token id 51
  expect(tx) // token id 51
    .emit(staking, "UserRewardUpdated")
    .emit(staking, "GlobalPointUpdated")
    .emit(staking, "Unlock")
    .withArgs(1); // token 1 will be unlocked.
  receipt = await tx.wait();
  console.log(receipt.transactionHash + " -> "+ (receipt.status===1?"success":"failure"));
  await addReferral(51, publicUser1.address, publicUser2.address);

  console.log("mintPrivate", nft.interface.encodeFunctionData("mintPrivate",[publicUser2.address]))
  tx = await nft.connect(owner).mintPrivate(publicUser2.address, {gasLimit: 9000000}); // token id 52
  receipt = await tx.wait();
  console.log(receipt.transactionHash + " -> "+ (receipt.status===1?"success":"failure"));
  await addReferral(52, publicUser2.address, publicUser3.address);
  await stakeBatch(publicUser2, 52, 1); // token id 52
  lastUpdated = parseInt(await staking.lastUpdatedAt());

  console.log("mintPrivate", nft.interface.encodeFunctionData("mintPrivate",[publicUser3.address]))
  tx = await nft.connect(owner).mintPrivate(publicUser3.address, {gasLimit: 9000000}); // token id 53
  receipt = await tx.wait();
  console.log(receipt.transactionHash + " -> "+ (receipt.status===1?"success":"failure"));
  await addReferral(53, publicUser3.address, publicUser3.address);
  await stakeBatch(publicUser3, 53, 1); // token id 53
  lastUpdated = parseInt(await staking.lastUpdatedAt());

  console.log("mintPrivate", nft.interface.encodeFunctionData("mintPrivate",[publicUser4.address]))
  tx = await nft.connect(owner).mintPrivate(publicUser4.address, {gasLimit: 9000000}); // token id 54
  receipt = await tx.wait();
  console.log(receipt.transactionHash + " -> "+ (receipt.status===1?"success":"failure"));
  await stakeBatch(publicUser4, 54, 1); // token id 54
  lastUpdated = parseInt(await staking.lastUpdatedAt());

  console.log("mintPrivate", nft.interface.encodeFunctionData("mintPrivate",[publicUser5.address]))
  tx = await nft.connect(owner).mintPrivate(publicUser5.address, {gasLimit: 9000000}); // token id 55
  receipt = await tx.wait();
  console.log(receipt.transactionHash + " -> "+ (receipt.status===1?"success":"failure"));
  await stakeBatch(publicUser5, 55, 1); // token id 55
  lastUpdated = parseInt(await staking.lastUpdatedAt());

  console.log("mintPrivateBatch", nft.interface.encodeFunctionData("mintPrivateBatch",[privateUser2.address, 10]))
  tx = await nft.connect(owner).mintPrivateBatch(privateUser2.address, 40, {gasLimit: 9000000});
  receipt = await tx.wait();
  console.log(receipt.transactionHash + " -> "+ (receipt.status===1?"success":"failure"));

  // const tokenIds = ["41", "46", "51"];
  // const data = staking.interface.encodeFunctionData("stake(address,uint256[])", [ publicUser1.address, tokenIds ]);
  // tx = await nft.connect(publicUser1).approveBatchAndCall(staking.address, tokenIds, data, {gasLimit: 9000000});
  // receipt = await tx.wait();
  // console.log(receipt.transactionHash + " -> "+ (receipt.status===1?"success":"failure"));
  // lastUpdated = parseInt(await staking.lastUpdatedAt());
  // console.log(lastUpdated)

  await sleep(10);

  let userReward = await staking.getUserReward(publicUser1.address);
  console.log(userReward)

  // tx = await staking.connect(publicUser2).claim({gasLimit: 9000000});
  // receipt = await tx.wait();
  // console.log(receipt.transactionHash + " -> "+ (receipt.status===1?"success":"failure"));
  // let balance = await isk.balanceOf(publicUser2.address)
  // console.log(balance)

  const user = privateUser1.address;
  block = await ethers.provider.getBlock("latest");
  console.log("timestamp1:", await block.timestamp);

  console.log("user:", user);
  console.log("totalPoint:", (await staking.totalPoint()).toString());
  console.log("getUserReward:", (await staking.getUserReward(user)).toString());
  console.log("getUserUnlockedReward:", (await staking.getUserUnlockedReward(user)).toString());
  console.log("getUserLockedReward:", (await staking.getUserLockedReward(user)).toString());
  console.log("getUserClaimedReward:", (await staking.getUserClaimedReward(user)).toString());
  console.log("getUserClaimableReward:", (await staking.getUserClaimableReward(user)).toString());

  block = await ethers.provider.getBlock("latest");
  console.log("timestamp2:", await block.timestamp);


}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
