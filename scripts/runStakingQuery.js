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

  const stakingAddr = "0xedb26ec8567ff985323174343058a5f44fac2623"
  const unlockRuleAddr = "0x626b806E5520b9F737F2e8B61444BDe2F56d357d"
  const nftAddr = "0xc2c275854c1f03bae2ba91355ebb5e3c379c4ef1"
  const iskAddr = "0x88A9386F7D3fec0d11c08F5d02d7F73704dc82Df"

  staking = await PioneerNFTStaking.attach(stakingAddr);
  nft = await PioneerNFT.attach(nftAddr);
  isk = await IskraToken.attach(iskAddr);
  unlockRule = await PioneerStakingUnlockRule.attach(unlockRuleAddr);

  //0xE020A6AEc3e30902A6838C69Cb372357954a4A42
  console.log("staking:", staking.address);
  console.log("unlockRule:", unlockRule.address);
  console.log("nft:", nft.address);
  console.log("isk:", isk.address);
  // console.log("nft.mintingListener:", await nft.mintingListener());
  // console.log("unlockRule.address:", unlockRule.address);
  // console.log("unlockRule.mintNotifier:", await unlockRule.mintNotifier());
  // console.log("nft.address:", nft.address);
  // console.log("unlockRule.stakingPool:", await unlockRule.stakingPool());
  // console.log("staking.address:", staking.address);
  // let tx = await unlockRule.onTokenMinted("0", "2", {gasLimit: 9000000});
  // let receipt = await tx.wait();
  // console.log("unlockRule.onTokenMinted:", receipt);

  console.log("initial_reward_rate:", (await staking.getRewardRate()).toString());
  console.log("rewardPerPoint:", (await staking.rewardPerPoint()).toString());
  console.log("lastUpdatedAt:", (await staking.lastUpdatedAt()).toString());
  console.log("totalPoint:", (await staking.totalPoint()).toString());
  console.log("start_time:", (await staking.start()).toString());
  // console.log("half_life:", (await staking.rewardHalfLife()).toString());
  // console.log("ownerOf:", (await staking.ownerOf(1)).toString());


  const user = "0x118aC8936191c014b3f4ED8D04eE0a6C2bdE0d56";
  let block = await ethers.provider.getBlock("latest");
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
