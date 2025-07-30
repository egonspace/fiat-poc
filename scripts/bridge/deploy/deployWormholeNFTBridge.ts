import {HardhatEthersHelpers} from "@nomiclabs/hardhat-ethers/types";
import {hexToBytes32} from "../utils/utils";
import {BigNumber, Contract, Wallet} from "ethers";
import {validAddress} from "../env/deployEnv";
import {SignerWithAddress} from "@nomiclabs/hardhat-ethers/signers";

export async function deployWormholeNFTBridgeImpl(
    ethers: HardhatEthersHelpers,
    deployer: SignerWithAddress | Wallet,
    version?: number
): Promise<Contract> {
    let contract = "NFTBridgeImplementation";
    if (version) {
        contract = `${contract}V${version}`;
    }
    const bridgeImplFactory = await ethers.getContractFactory(contract);

    // @ts-ignore
    const bridgeImpl = await bridgeImplFactory.connect(deployer).deploy({
        nonce: ethers.provider.getTransactionCount(deployer.address),
    });
    await bridgeImpl.deployed();
    await bridgeImpl.deployTransaction.wait(3);

    console.log(contract + `: ${bridgeImpl.address}`);

    return bridgeImpl;
}

export async function deployWormholeMultiTokenBridgeImpl(
    ethers: HardhatEthersHelpers,
    deployer: SignerWithAddress | Wallet,
    version?: number
): Promise<Contract> {
    let contract = "MultiTokenBridgeImplementation";
    if (version) {
        contract = `${contract}V${version}`;
    }
    const bridgeImplFactory = await ethers.getContractFactory(contract);

    // @ts-ignore
    const bridgeImpl = await bridgeImplFactory.connect(deployer).deploy({
        nonce: ethers.provider.getTransactionCount(deployer.address),
    });
    await bridgeImpl.deployed();
    await bridgeImpl.deployTransaction.wait(3);

    console.log(contract + `: ${bridgeImpl.address}`);

    return bridgeImpl;
}

export async function deployWormholeNFTBridge(
    ethers: HardhatEthersHelpers,
    wormhole: string,
    chainId: number,
    finality: number,
    governanceChainId: number,
    governanceContract: string,
    governanceVerifier: string,
    evmChainId: number,
    deployer: SignerWithAddress | Wallet
) {
    const feeCollector = validAddress(process.env.FEE_COLLECTOR_ADDRESS as string, "fee collector addres.");

    console.log(`\n=== Wormhole Bridge Contract Deployment Input ===`);
    console.log(`wormhole: ${wormhole}`);
    console.log(`chainId: ${chainId}`);
    console.log(`governanceChainId: ${governanceChainId}`);
    console.log(`governanceContract: ${governanceContract}`);
    console.log(`finality: ${finality}`);
    console.log(`governanceVerifier: ${governanceVerifier}`);
    console.log(`feeCollector: ${feeCollector}`);
    console.log(`evmChainId: ${evmChainId}`);
    console.log(`=============\n`);

    console.log(`deployer: ${deployer.address}`);

    const bridgeImpl = await deployWormholeNFTBridgeImpl(ethers, deployer);

    const setupFactory = await ethers.getContractFactory("NFTBridgeSetup");
    // @ts-ignore
    const setup = await setupFactory.connect(deployer).deploy({
        nonce: ethers.provider.getTransactionCount(deployer.address),
    });
    await setup.deployed();
    await setup.deployTransaction.wait(3);
    console.log(`setup: ${setup.address}`);

    const tokenFactory = await ethers.getContractFactory("NFTImplementation");
    // @ts-ignore
    const tokenImpl = await tokenFactory.connect(deployer).deploy({
        nonce: ethers.provider.getTransactionCount(deployer.address),
    });
    await tokenImpl.deployed();
    await tokenImpl.deployTransaction.wait(3);
    console.log(`NFTImpl: ${tokenImpl.address}`);

    const feeTokenFactory = await ethers.getContractFactory("TokenImplementation");
    // @ts-ignore
    const feeTokenImpl = await feeTokenFactory.connect(deployer).deploy({
        nonce: ethers.provider.getTransactionCount(deployer.address),
    });
    await feeTokenImpl.deployed();
    await feeTokenImpl.deployTransaction.wait(3);
    console.log(`FeeTokenImpl: ${feeTokenImpl.address}`);

    const feePolicyFactory = await ethers.getContractFactory("NFTFeePolicy");
    // @ts-ignore
    const feePolicy = await feePolicyFactory.connect(deployer).deploy(
        feeCollector,
        {
            nonce: ethers.provider.getTransactionCount(deployer.address),
        });
    await feePolicy.deployed();
    await feePolicy.deployTransaction.wait(3);
    console.log(`feePolicy: ${feePolicy.address}`);

    const setupData = setup.interface.encodeFunctionData("setup", [
        bridgeImpl.address,
        chainId,
        wormhole,
        governanceChainId,
        hexToBytes32(governanceContract),
        governanceVerifier,
        tokenImpl.address,
        feeTokenImpl.address,
        feePolicy.address,
        finality
    ]);

    const proxyFactory = await ethers.getContractFactory("NFTBridgeEntrypoint");
    // @ts-ignore
    const proxy = await proxyFactory.connect(deployer).deploy(setup.address, setupData, {
        nonce: ethers.provider.getTransactionCount(deployer.address),
    });
    await proxy.deployed();
    await proxy.deployTransaction.wait(3);

    console.log(`wormholeNFTBridge proxy contract: ${proxy.address}`);
    console.log(`Finished deploying wormhole NFT bridge contract!`)

    return proxy;
}

export async function deployWormholeMultiTokenBridge(
    ethers: HardhatEthersHelpers,
    wormhole: string,
    chainId: number,
    finality: number,
    governanceChainId: number,
    governanceContract: string,
    governanceVerifier: string,
    evmChainId: number,
    deployer: SignerWithAddress | Wallet
) {
    const feeCollector = validAddress(process.env.FEE_COLLECTOR_ADDRESS as string, "fee collector addres.");

    console.log(`\n=== Wormhole Bridge Contract Deployment Input ===`);
    console.log(`wormhole: ${wormhole}`);
    console.log(`chainId: ${chainId}`);
    console.log(`governanceChainId: ${governanceChainId}`);
    console.log(`governanceContract: ${governanceContract}`);
    console.log(`finality: ${finality}`);
    console.log(`governanceVerifier: ${governanceVerifier}`);
    console.log(`feeCollector: ${feeCollector}`);
    console.log(`evmChainId: ${evmChainId}`);
    console.log(`=============\n`);

    console.log(`deployer: ${deployer.address}`);

    const bridgeImpl = await deployWormholeMultiTokenBridgeImpl(ethers, deployer);

    const setupFactory = await ethers.getContractFactory("NFTBridgeSetup");
    // @ts-ignore
    const setup = await setupFactory.connect(deployer).deploy({
        nonce: ethers.provider.getTransactionCount(deployer.address),
    });
    await setup.deployed();
    await setup.deployTransaction.wait(3);
    console.log(`setup: ${setup.address}`);

    const tokenFactory = await ethers.getContractFactory("MultiTokenImplementation");
    // @ts-ignore
    const tokenImpl = await tokenFactory.connect(deployer).deploy({
        nonce: ethers.provider.getTransactionCount(deployer.address),
    });
    await tokenImpl.deployed();
    await tokenImpl.deployTransaction.wait(3);
    console.log(`MultiTokenImpl: ${tokenImpl.address}`);

    const feeTokenFactory = await ethers.getContractFactory("TokenImplementation");
    // @ts-ignore
    const feeTokenImpl = await feeTokenFactory.connect(deployer).deploy({
        nonce: ethers.provider.getTransactionCount(deployer.address),
    });
    await feeTokenImpl.deployed();
    await feeTokenImpl.deployTransaction.wait(3);
    console.log(`FeeTokenImpl: ${feeTokenImpl.address}`);

    const feePolicyFactory = await ethers.getContractFactory("NFTFeePolicy");
    // @ts-ignore
    const feePolicy = await feePolicyFactory.connect(deployer).deploy(
        feeCollector,
        {
            nonce: ethers.provider.getTransactionCount(deployer.address),
        });
    await feePolicy.deployed();
    await feePolicy.deployTransaction.wait(3);
    console.log(`feePolicy: ${feePolicy.address}`);

    const setupData = setup.interface.encodeFunctionData("setup", [
        bridgeImpl.address,
        chainId,
        wormhole,
        governanceChainId,
        hexToBytes32(governanceContract),
        governanceVerifier,
        tokenImpl.address,
        feeTokenImpl.address,
        feePolicy.address,
        finality
    ]);

    const proxyFactory = await ethers.getContractFactory("NFTBridgeEntrypoint");
    // @ts-ignore
    const proxy = await proxyFactory.connect(deployer).deploy(setup.address, setupData, {
        nonce: ethers.provider.getTransactionCount(deployer.address),
    });
    await proxy.deployed();
    await proxy.deployTransaction.wait(3);

    console.log(`wormholeMultiTokenBridge proxy contract: ${proxy.address}`);
    console.log(`Finished deploying wormhole MultiToken bridge contract!`)

    return proxy;
}
