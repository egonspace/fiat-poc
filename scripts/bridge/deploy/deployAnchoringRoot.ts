import {HardhatEthersHelpers} from "@nomiclabs/hardhat-ethers/types";
import {upgrades} from "hardhat";

export async function deployAnchoringRoot(
  ethers: HardhatEthersHelpers,
  wormhole: string,
  targetChainId: number,
  anchoringPeriod: number,
) {
  console.log(`=== INPUT ===`);
  console.log(`wormhole: ${wormhole}`);
  console.log(`targetChainId: ${targetChainId}`);
  console.log(`anchoringPeriod: ${anchoringPeriod}`);
  console.log(`=============\n`);

  const [deployer] = await ethers.getSigners();
  console.log(`deployer: ${deployer.address}`);

  const anchoringImplementationFactory = await ethers.getContractFactory("AnchoringImplementation");
  // @ts-ignore
  const anchoringImplementation = await anchoringImplementationFactory.connect(deployer).deploy();
  
  const anchoringSetupFactory = await ethers.getContractFactory("AnchoringSetup");
  const setup = await anchoringSetupFactory.deploy();
  await setup.deployed();
  
  const anchoringProxyFactory = await ethers.getContractFactory("ERC1967Proxy");
  const setupData = setup.interface.encodeFunctionData("setup", [
        anchoringImplementation.address,
        wormhole,
        targetChainId,
        anchoringPeriod,
  ]);
  const anchoringProxy = await anchoringProxyFactory.deploy(setup.address, setupData);
  await anchoringProxy.deployed();

  console.log(`Anchoring proxy contract: ${anchoringProxy.address}`);
  return anchoringProxy;
}
