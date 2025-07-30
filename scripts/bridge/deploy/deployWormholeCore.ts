import {HardhatEthersHelpers} from "@nomiclabs/hardhat-ethers/types";
import {getEvmChainId} from "../env/deployEnv";
import {Contract, Wallet} from "ethers";
import {SignerWithAddress} from "@nomiclabs/hardhat-ethers/signers";

export async function deployWormholeImpl(
  ethers: HardhatEthersHelpers,
  deployer: SignerWithAddress | Wallet
): Promise<Contract> {
    const wormholeImplFactory = await ethers.getContractFactory("Implementation");
    // @ts-ignore
    const wormholeImpl = await wormholeImplFactory.connect(deployer).deploy({
        nonce: ethers.provider.getTransactionCount(deployer.address),
    });
    await wormholeImpl.deployed();
    await wormholeImpl.deployTransaction.wait(3);
    console.log(`wormholeImpl: ${wormholeImpl.address}`);

    return wormholeImpl;
}

export async function deployWormholeCore(
  ethers: HardhatEthersHelpers,
  chainId: number,
  finality: number,
  guardians: string[],
  governanceChainId: number,
  governanceContract: string,
  deployer: SignerWithAddress | Wallet
) {
    const evmChainId = getEvmChainId(chainId);
    console.log(`\n=== Wormhole Core Contract Deployment Input ===`);
    console.log(`guardians: ${guardians}`);
    console.log(`chainId: ${chainId}`);
    console.log(`governanceChainId: ${governanceChainId}`);
    console.log(`governanceContract: ${governanceContract}`);
    console.log(`evmChainId: ${evmChainId}`);
    console.log(`=============\n`);

    console.log(`deployer: ${deployer.address}`);

    const wormholeImpl = await deployWormholeImpl(ethers, deployer);

    const setupFactory = await ethers.getContractFactory("Setup");
    // @ts-ignore
    const setup = await setupFactory.connect(deployer).deploy({
        nonce: ethers.provider.getTransactionCount(deployer.address),
    });
    await setup.deployed()
    await setup.deployTransaction.wait(3);
    console.log(`setup: ${setup.address}`);

    const setupData = setup.interface.encodeFunctionData("setup", [
        wormholeImpl.address,
        guardians,
        chainId,
        governanceChainId,
        governanceContract,
        evmChainId
    ]);

    const proxyFactory = await ethers.getContractFactory("Wormhole");
    // @ts-ignore
    const proxy = await proxyFactory.connect(deployer).deploy(setup.address, setupData, {
        nonce: ethers.provider.getTransactionCount(deployer.address)
    });
    await proxy.deployed();
    await proxy.deployTransaction.wait(3);

    console.log(`wormholeCore proxy contract: ${proxy.address}`);
    console.log(`Finished deploying wormhole core contract!`)

    return proxy;
}
