import { task, types } from "hardhat/config";
import {
    getBridgeApp,
    getBridgeDeployParams,
    getBridgeGovernanceDeployParams,
    getChainParam,
    getWormholeDeployParams,
} from "../../scripts/bridge/env/deployEnv";
import { deployGovernance } from "../../scripts/bridge/deploy/deployBridgeGoverance";
import { deployWormholeBridge, deployWormholeBridgeImpl } from "../../scripts/bridge/deploy/deployWormholeBridge";
import {
    deployWormholeMultiTokenBridge,
    deployWormholeNFTBridge,
    deployWormholeNFTBridgeImpl,
} from "../../scripts/bridge/deploy/deployWormholeNFTBridge";
import { deployWormholeBridgeProxy } from "../../scripts/bridge/deploy/deployWormholeBridgeProxy";
import { waitConfirmation, ZERO_ADDRESS } from "../../scripts/bridge/cmd/common";
import { bridgeStatus, wormholeStatus } from "../../scripts/bridge/cmd/bridge";
import { deployWormholeCore, deployWormholeImpl } from "../../scripts/bridge/deploy/deployWormholeCore";
import { getSignerFromArgs } from "../utils/utils";
import { chainNameToChainId } from "./common";
import { ethers } from "hardhat";

task("deploy-bridge-governance", "Deploy bridge governance contract.")
    .addOptionalParam("signer", "signer address.")
    .addOptionalParam("jsonKeyfile", "json key file to sign tx.", undefined, types.inputFile)
    .setAction(async (taskArgs, hre) => {
        const params = getBridgeGovernanceDeployParams(chainNameToChainId(hre.network.name));
        const signer = await getSignerFromArgs(taskArgs, hre);
        await deployGovernance(
            hre.ethers,
            params.wormhole,
            params.consistencyLevel,
            params.voters,
            params.proposers,
            params.quorumSize,
            params.minimumVoterCount,
            params.maximumVoterCount,
            signer
        );
    });

task("deploy-bridge", "Deploy bridge contract on specified chain.")
    .addOptionalParam("signer", "signer address.")
    .addOptionalParam("jsonKeyfile", "json key file to sign tx.", undefined, types.inputFile)
    .addOptionalParam("versionNumber", "implementation version number.", undefined, types.int)
    .setAction(async (taskArgs, hre) => {
        const params = getBridgeDeployParams(chainNameToChainId(hre.network.name));
        const signer = await getSignerFromArgs(taskArgs, hre);
        await deployWormholeBridge(
            hre.ethers,
            params.publisherWormhole,
            params.chainParam.chainId,
            params.chainParam.finality,
            taskArgs.versionNumber,
            params.bridgeGovernanceParams.governanceChainId,
            params.bridgeGovernanceParams.governanceContract,
            params.bridgeGovernanceParams.governanceVerifierWormhole,
            signer
        );
    });

task("deploy-bridge-proxy", "Deploy bridge proxy contract on specified chain.")
    .addOptionalParam("signer", "signer address.")
    .addOptionalParam("jsonKeyfile", "json key file to sign tx.", undefined, types.inputFile)
    .addParam("bridge", "bridge implementation address")
    .addParam("token", "token implementation address")
    .addParam("adapter", "token adapter implementation address")
    .addParam("fee", "fee policy address")
    .setAction(async (taskArgs, hre) => {
        const params = getBridgeDeployParams(chainNameToChainId(hre.network.name));
        const signer = await getSignerFromArgs(taskArgs, hre);
        await deployWormholeBridgeProxy(
            hre.ethers,
            taskArgs.bridge,
            params.publisherWormhole,
            params.chainParam.chainId,
            params.chainParam.finality,
            params.bridgeGovernanceParams.governanceChainId,
            params.bridgeGovernanceParams.governanceContract,
            params.bridgeGovernanceParams.governanceVerifierWormhole,
            taskArgs.token,
            taskArgs.adapter,
            taskArgs.fee,
            signer
        );
    });

task("deploy-extension-hub", "Deploy bridge extension hub")
    .addParam("l1ChainId", "l1 chain id")
    .addOptionalParam("signer", "signer address.")
    .addOptionalParam("wallet", "The wallet name to sign this transaction. wallet:add first")
    .addOptionalParam("jsonKeyfile", "json key file to sign tx.", undefined, types.inputFile)
    .setAction(async (taskArgs, hre) => {
        const signer = await getSignerFromArgs(taskArgs, hre);
        const hubFactory = await hre.ethers.getContractFactory("BridgeExtensionHub", signer);
        const hubImpl = await hubFactory.deploy();
        await hubImpl.deployed();
        const chainId = chainNameToChainId(hre.network.name);
        const bridgeAddress = getBridgeApp(chainId, "bridge");
        const proxyFactory = await hre.ethers.getContractFactory(
            "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol:ERC1967Proxy",
            signer
        );
        const hubInitializeData = hubFactory.interface.encodeFunctionData("initialize", [
            taskArgs.l1ChainId,
            bridgeAddress,
        ]);
        const hubProxy = await proxyFactory.deploy(hubImpl.address, hubInitializeData);
        await hubProxy.deployed();

        console.log(`BridgeExtensionHub implementation contract: ${hubImpl.address}`);
        console.log(`BridgeExtensionHub proxy contract: ${hubProxy.address}`);
    });

task("deploy-extension-l1", "Deploy bridge extension l1")
    .addParam("standardBridge", "l1 standard bridge address")
    .addParam("lib", "BridgeUtil address")
    .addOptionalParam("signer", "signer address.")
    .addOptionalParam("wallet", "The wallet name to sign this transaction. wallet:add first")
    .addOptionalParam("jsonKeyfile", "json key file to sign tx.", undefined, types.inputFile)
    .setAction(async (taskArgs, hre) => {
        const signer = await getSignerFromArgs(taskArgs, hre);
        const l1Factory = await hre.ethers.getContractFactory("BridgeExtensionL1", {
            libraries: {
                BridgeUtil: taskArgs.lib,
            },
            signer,
        });
        const l1Impl = await l1Factory.deploy();
        await l1Impl.deployed();
        const chainId = chainNameToChainId(hre.network.name);
        const bridgeAddress = getBridgeApp(chainId, "bridge");
        const proxyFactory = await hre.ethers.getContractFactory(
            "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol:ERC1967Proxy",
            signer
        );
        const l1InitializeData = l1Factory.interface.encodeFunctionData("initialize", [
            taskArgs.standardBridge,
            bridgeAddress,
            200000,
        ]);
        const l1Proxy = await proxyFactory.deploy(l1Impl.address, l1InitializeData);
        await l1Proxy.deployed();

        console.log(`BridgeExtensionL1 implementation contract: ${l1Impl.address}`);
        console.log(`BridgeExtensionL1 proxy contract: ${l1Proxy.address}`);
    });

task("deploy-nftbridge", "Deploy NFT bridge contract on specified chain.")
    .addOptionalParam("signer", "signer address.")
    .addOptionalParam("wallet", "The wallet name to sign this transaction. wallet:add first")
    .addOptionalParam("jsonKeyfile", "json key file to sign tx.", undefined, types.inputFile)
    .setAction(async (taskArgs, hre) => {
        const params = getBridgeDeployParams(chainNameToChainId(hre.network.name));
        const signer = await getSignerFromArgs(taskArgs, hre);
        await deployWormholeNFTBridge(
            hre.ethers,
            params.publisherWormhole,
            params.chainParam.chainId,
            params.chainParam.finality,
            params.bridgeGovernanceParams.governanceChainId,
            params.bridgeGovernanceParams.governanceContract,
            params.bridgeGovernanceParams.governanceVerifierWormhole,
            hre.network.config.chainId as number,
            signer
        );
    });
task("deploy-multitokenbridge", "Deploy MultiToken bridge contract on specified chain.")
    .addOptionalParam("signer", "signer address.")
    .addOptionalParam("wallet", "The wallet name to sign this transaction. wallet:add first")
    .addOptionalParam("jsonKeyfile", "json key file to sign tx.", undefined, types.inputFile)
    .setAction(async (taskArgs, hre) => {
        const params = getBridgeDeployParams(chainNameToChainId(hre.network.name));
        const signer = await getSignerFromArgs(taskArgs, hre);
        await deployWormholeMultiTokenBridge(
            hre.ethers,
            params.publisherWormhole,
            params.chainParam.chainId,
            params.chainParam.finality,
            params.bridgeGovernanceParams.governanceChainId,
            params.bridgeGovernanceParams.governanceContract,
            params.bridgeGovernanceParams.governanceVerifierWormhole,
            hre.network.config.chainId as number,
            signer
        );
    });

task("deploy-bridge-impl", "Deploy bridge impl contract on specified chain for upgrade.")
    .addOptionalParam("versionNumber", "implementation version number.", undefined, types.int)
    .addOptionalParam("signer", "signer address.")
    .addOptionalParam("libAddress", "BridgeUtil lib address.")
    .addOptionalParam("wallet", "The wallet name to sign this transaction. wallet:add first")
    .addOptionalParam("jsonKeyfile", "json key file to sign tx.", undefined, types.inputFile)
    .setAction(async (taskArgs, hre) => {
        const signer = await getSignerFromArgs(taskArgs, hre);
        const bridgeImpl = await deployWormholeBridgeImpl(
            hre.ethers,
            signer,
            taskArgs.versionNumber,
            taskArgs.libAddress
        );
    });

task("deploy-nftbridge-impl", "Deploy nft-bridge impl contract on specified chain for upgrade.")
    .addOptionalParam("versionNumber", "implementation version number.", undefined, types.int)
    .addOptionalParam("signer", "signer address.")
    .addOptionalParam("wallet", "The wallet name to sign this transaction. wallet:add first")
    .addOptionalParam("jsonKeyfile", "json key file to sign tx.", undefined, types.inputFile)
    .setAction(async (taskArgs, hre) => {
        const signer = await getSignerFromArgs(taskArgs, hre);
        await deployWormholeNFTBridgeImpl(hre.ethers, signer, taskArgs.versionNumber);
    });

task("deploy-wormhole", "Deploy wormhole contract on specified chain.")
    .addParam("type", "'0' means WH_19, '1' means 'WH_ISK'")
    .addOptionalParam("signer", "signer address.")
    .addOptionalParam("wallet", "The wallet name to sign this transaction. wallet:add first")
    .addOptionalParam("jsonKeyfile", "json key file to sign tx.", undefined, types.inputFile)
    .setAction(async (taskArgs, hre) => {
        const chainParams = getChainParam(chainNameToChainId(hre.network.name));
        const type = parseInt(taskArgs.type);
        const wormholeCoreParams = getWormholeDeployParams(type);
        const signer = await getSignerFromArgs(taskArgs, hre);
        await deployWormholeCore(
            hre.ethers,
            chainParams.chainId,
            chainParams.finality,
            wormholeCoreParams.guardians,
            wormholeCoreParams.governanceChainId,
            wormholeCoreParams.governanceContract,
            signer
        );
    });

task("deploy-wormhole-impl", "Deploy wormhole impl contract on specified chain for upgrade.")
    .addOptionalParam("signer", "signer address.")
    .addOptionalParam("jsonKeyfile", "json key file to sign tx.", undefined, types.inputFile)
    .setAction(async (taskArgs, hre) => {
        const signer = await getSignerFromArgs(taskArgs, hre);
        const wormholeImpl = await deployWormholeImpl(hre.ethers, signer);
        // execute initialize to confirm target contract
        console.log(
            "Try to call initialize() to confirm the implementation contract.. It might fail since most properties are not set up in impl contract."
        );

        // @ts-ignore
        const initializeTx = await wormholeImpl.connect(signer).initialize();
        await waitConfirmation(hre, initializeTx);

        await wormholeStatus(hre, wormholeImpl.address);
    });
