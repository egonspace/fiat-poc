import {HardhatEthersHelpers} from "@nomiclabs/hardhat-ethers/types";
import {SignerWithAddress} from "@nomiclabs/hardhat-ethers/signers";
import {Wallet} from "ethers";

export async function deployGovernance(
  ethers: HardhatEthersHelpers,
  wormhole: string,
  consistencyLevel: number,
  voters: string[],
  proposers: string[],
  required: number,
  minimumVoterCount: number,
  maximumVoterCount: number,
  deployer: SignerWithAddress | Wallet,
) {
  console.log(`=== INPUT ===`);
  console.log(`wormhole: ${wormhole}`);
  console.log(`consistencyLevel: ${consistencyLevel}`);
  console.log(`voters: ${voters}`);
  console.log(`proposers: ${proposers}`);
  console.log(`required: ${required}`);
  console.log(`minimumVoterCount: ${minimumVoterCount}`);
  console.log(`maximumVoterCount: ${maximumVoterCount}`);
  console.log(`=============\n`);

  console.log(`deployer: ${deployer.address}`);

  const govFactory = await ethers.getContractFactory("IskraBridgeGovernance");
    const gov = await govFactory
        // @ts-ignore
    .connect(deployer)
    .deploy(wormhole, consistencyLevel, voters, proposers, required, minimumVoterCount, maximumVoterCount, {
        nonce: ethers.provider.getTransactionCount(deployer.address),
    });
  await gov.deployed();
  await gov.deployTransaction.wait(3);
  console.log(`IskraBridgeGovernance: ${gov.address}`);
}
