const {ethers, upgrades} = require("hardhat");
const {expect} = require("chai");

async function main() {

  let staking, isk, nft, unlockRule, pioneerSale;
  let owner;

  [owner] = await ethers.getSigners();
  const IskraToken = await ethers.getContractFactory("IskraToken");
  const PioneerNFT = await ethers.getContractFactory("PioneerNFT");
  const PioneerNFTSale = await ethers.getContractFactory("PioneerNFTSale");
  const PioneerNFTSaleGlobalEnv = await ethers.getContractFactory("PioneerNFTSaleGlobalEnv");
  const PioneerNFTStaking = await ethers.getContractFactory("PioneerNFTStaking");

  isk = await IskraToken.connect(owner).deploy("1000000000000000000000000000", {gasLimit: 9000000});
  await isk.deployed();
  // isk = await IskraToken.attach("0x88A9386F7D3fec0d11c08F5d02d7F73704dc82Df");

  nft = await PioneerNFT.connect(owner).deploy([40, 260, 30, 70], 10, {gasLimit: 9000000});
  await nft.deployed();
  // nft = await PioneerNFT.attach("xxx");

  const beacon = await upgrades.deployBeacon(PioneerNFTStaking.connect(owner), {gasLimit: 9000000});
  await beacon.deployed();
  const proxy = await upgrades.deployBeaconProxy(beacon, PioneerNFTStaking.connect(owner), [nft.address, isk.address], {gasLimit: 9000000});
  await proxy.deployed();
  staking = PioneerNFTStaking.attach(proxy.address);

  const env = await PioneerNFTSaleGlobalEnv.connect(owner).deploy({gasLimit: 9000000});

  pioneerSale = await PioneerNFTSale.connect(owner).deploy(env.address, nft.address, staking.address, 41, 60, 1, 1, owner.address, 260, {gasLimit: 9000000});
  await pioneerSale.deployed();
  // pioneerSale = await PioneerNFTSale.attach("xxx");

  await expect(env.setCurrentSale(pioneerSale.address)).not.reverted;


  const PioneerStakingUnlockRule = await ethers.getContractFactory("PioneerStakingUnlockRule");
  unlockRule = await PioneerStakingUnlockRule.connect(owner).deploy(staking.address, nft.address, 50, 300, 10, 1, {gasLimit: 9000000});
  await unlockRule.deployed();

  expect(await  nft.connect(owner).setMintListener(unlockRule.address, {gasLimit: 9000000}))
    .emit(nft, "MintingListenerRegistered").withArgs(unlockRule.address);
  await expect(nft.connect(owner).registerPauseExcluded(staking.address, {gasLimit: 9000000})).not.reverted;
  await expect(staking.connect(owner).setRewardUnlockRule(unlockRule.address, {gasLimit: 9000000})).not.reverted;
  await expect(staking.connect(owner).setPioneerSale(pioneerSale.address, {gasLimit: 9000000})).not.reverted;
  await expect(isk.transfer(staking.address, "400000000000000000000000000", {gasLimit: 9000000})).not.reverted;

  console.log("const saleAddr =", "\""+pioneerSale.address+"\"");
  console.log("const stakingAddr =", "\""+staking.address+"\"");
  console.log("const unlockRuleAddr =", "\""+unlockRule.address+"\"");
  console.log("const nftAddr =", "\""+nft.address+"\"");
  console.log("const iskAddr =", "\""+isk.address+"\"");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
