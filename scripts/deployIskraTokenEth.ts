import { ethers } from "hardhat";
import { BigNumber } from "ethers";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";

function toTokenAmount(amount: number) {
  return BigNumber.from(amount).mul(BigNumber.from(10).pow(18));
}

export async function deployToken(deployer: SignerWithAddress, initialHolder: SignerWithAddress) {
  console.log(`=== INPUT ===`);
  console.log(`deployer: ${deployer.address}`);
  console.log(`initialHolder: ${initialHolder.address}`);
  console.log(`=============\n`);

  const iskraTokenEthFactory = await ethers.getContractFactory("IskraTokenEth");
  const deploymentData = iskraTokenEthFactory.interface.encodeDeploy([
    toTokenAmount(1_000_000_000),
    initialHolder.address,
  ]);
  const estimatedGas = await ethers.provider.estimateGas({ data: deploymentData });
  console.log("estimatedGas: " + estimatedGas);

  // @ts-ignore
  const isk = await iskraTokenEthFactory.connect(deployer).deploy(toTokenAmount(1_000_000_000), initialHolder.address);
  await isk.deployed();
  console.log("IskraTokenEth contract deployed: " + isk.address);

  const supply = await isk.totalSupply();
  console.log("supply: " + supply);
  const balance = await isk.balanceOf(initialHolder.address);
  console.log("balance of initialHolder: " + balance);
}

async function main() {
  const [deployer] = await ethers.getSigners();

  await deployToken(deployer, deployer);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
