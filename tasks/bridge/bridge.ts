import { task, types } from "hardhat/config";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { getSignerFromArgs } from "../utils/utils";
import { getBridgeApp } from "../../scripts/bridge/env/deployEnv";
import {
    attestToken,
    bridgeStatus,
    completeRemoteAsset,
    completeTransfer,
    createAdapter,
    createWrapped,
    registerChain,
    returnTransfer,
    transferTokens,
    updateServiceFeePolicy,
    upgradeBridge,
} from "../../scripts/bridge/cmd/bridge";
import {
    registerChainNFTBridge,
    completeTransferNFT,
    transferNFT,
    upgradeNFTBridge,
    registerChainMultiTokenBridge,
    completeTransferMultiToken,
    transferMultiToken,
    upgradeMultiTokenBridge,
    transferFeeToken,
    completeTransferFeeToken,
    batchTransferNFT,
    completeBatchTransferNFT,
    batchTransferMultiToken,
    completeBatchTransferMultiToken,
} from "../../scripts/bridge/cmd/nftbridge";

import { chainNameToChainId, fetchVAA } from "./common";
import { getVAA } from "../../scripts/bridge/cmd/common";
import { hexToBytes32 } from "../../scripts/bridge/utils/utils";

task("register-chain", "Register chain with vaa")
    .addParam("vaa", "VAA (Base64 encoded)")
    .addParam("app", "either bridge or nftbridge")
    .addOptionalParam("signer", "signer address.")
    .addOptionalParam("jsonKeyfile", "json key file to sign tx.", undefined, types.inputFile)
    .setAction(async (taskArgs, hre: HardhatRuntimeEnvironment) => {
        const signer = await getSignerFromArgs(taskArgs, hre);
        const chainId = chainNameToChainId(hre.network.name);
        const bridgeAddress = getBridgeApp(chainId, taskArgs.app);
        if (taskArgs.app === "bridge") {
            await registerChain(hre, bridgeAddress, taskArgs.vaa, signer);
        } else if (taskArgs.app === "nftbridge") {
            await registerChainNFTBridge(hre, bridgeAddress, taskArgs.vaa, signer);
        } else if (taskArgs.app === "multitokenbridge") {
            await registerChainMultiTokenBridge(hre, bridgeAddress, taskArgs.vaa, signer);
        }
    });

task("upgrade-bridge", "Upgrade bridge contract.")
    .addParam("vaa", "VAA (Base64 encoded)")
    .addParam("app", "either bridge or nftbridge")
    .addOptionalParam("signer", "signer address.")
    .addOptionalParam("jsonKeyfile", "json key file to sign tx.", undefined, types.inputFile)
    .setAction(async (taskArgs, hre: HardhatRuntimeEnvironment) => {
        const signer = await getSignerFromArgs(taskArgs, hre);
        const chainId = chainNameToChainId(hre.network.name);
        const bridgeAddress = getBridgeApp(chainId, taskArgs.app);
        if (taskArgs.app === "bridge") {
            await upgradeBridge(hre, bridgeAddress, taskArgs.vaa, signer);
        } else if (taskArgs.app === "nftbridge") {
            await upgradeNFTBridge(hre, bridgeAddress, taskArgs.vaa, signer);
        }
    });

task("attest-token", "Attest token info")
    .addParam("tokenAddress", "address of the token to be attested.")
    .addOptionalParam("nonce", "nonce.")
    .addOptionalParam("signer", "signer address.")
    .addOptionalParam("jsonKeyfile", "json key file to sign tx.", undefined, types.inputFile)
    .addOptionalParam("publisherType", "'0' means WH_19, '1' means 'WH_ISK'")
    .setAction(async (taskArgs, hre: HardhatRuntimeEnvironment) => {
        const chainId = chainNameToChainId(hre.network.name);

        const signer = await getSignerFromArgs(taskArgs, hre);
        let nonce: number;
        if (taskArgs.nonce) {
            nonce = taskArgs.nonce;
        } else {
            nonce = Math.floor(Math.random() * 10000);
        }
        const bridgeAddress = getBridgeApp(chainId, "bridge");
        const sequence = await attestToken(hre, bridgeAddress, taskArgs.tokenAddress, nonce, signer);
        if (taskArgs.publisherType) {
            await fetchVAA(3, taskArgs.publisherType, chainId, bridgeAddress, sequence);
        }
    });

task("create-wrapped", "Create wrapped token.")
    .addParam("vaa", "VAA (Base64 encoded)")
    .addOptionalParam("signer", "signer address.")
    .addOptionalParam("nonce", "nonce.")
    .addOptionalParam("jsonKeyfile", "json key file to sign tx.", undefined, types.inputFile)
    .setAction(async (taskArgs, hre: HardhatRuntimeEnvironment) => {
        const signer = await getSignerFromArgs(taskArgs, hre);
        const chainId = chainNameToChainId(hre.network.name);
        const bridgeAddress = getBridgeApp(chainId, "bridge");
        let nonce: number;
        if (taskArgs.nonce) {
            nonce = taskArgs.nonce;
        } else {
            nonce = Math.floor(Math.random() * 10000);
        }
        const sequence = await createWrapped(hre, bridgeAddress, nonce, taskArgs.vaa, signer);
        await fetchVAA(3, 0, chainId, bridgeAddress, sequence);
    });

task("create-adapter", "Create wrapped token adapter.")
    .addParam("vaa", "VAA (Base64 encoded)")
    .addParam("init", "initial amount")
    .addOptionalParam("signer", "signer address.")
    .addOptionalParam("nonce", "nonce.")
    .addOptionalParam("jsonKeyfile", "json key file to sign tx.", undefined, types.inputFile)
    .setAction(async (taskArgs, hre: HardhatRuntimeEnvironment) => {
        const signer = await getSignerFromArgs(taskArgs, hre);
        const chainId = chainNameToChainId(hre.network.name);
        const bridgeAddress = getBridgeApp(chainId, "bridge");
        let nonce: number;
        if (taskArgs.nonce) {
            nonce = taskArgs.nonce;
        } else {
            nonce = Math.floor(Math.random() * 10000);
        }
        const sequence = await createAdapter(hre, bridgeAddress, taskArgs.init, nonce, taskArgs.vaa, signer);
        await fetchVAA(3, 0, chainId, bridgeAddress, sequence);
    });

task("complete-remote-asset", "Complete remote asset")
    .addParam("vaa", "VAA (Base64 encoded)")
    .addOptionalParam("signer", "signer address.")
    .addOptionalParam("wallet", "signer wallet name")
    .addOptionalParam("jsonKeyfile", "json key file to sign tx.", undefined, types.inputFile)
    .setAction(async (taskArgs, hre: HardhatRuntimeEnvironment) => {
        const signer = await getSignerFromArgs(taskArgs, hre);
        const chainId = chainNameToChainId(hre.network.name);
        const bridgeAddress = getBridgeApp(chainId, "bridge");
        await completeRemoteAsset(hre, bridgeAddress, taskArgs.vaa, signer);
    });

task("update-service-fee", "update service fee of the bridge contract.")
    .addParam("vaa", "VAA (Base64 encoded)")
    .addOptionalParam("signer", "signer address.")
    .addOptionalParam("jsonKeyfile", "json key file to sign tx.", undefined, types.inputFile)
    .setAction(async (taskArgs, hre: HardhatRuntimeEnvironment) => {
        const signer = await getSignerFromArgs(taskArgs, hre);
        const chainId = chainNameToChainId(hre.network.name);
        const bridgeAddress = getBridgeApp(chainId, "bridge");
        await updateServiceFeePolicy(hre, bridgeAddress, taskArgs.vaa, signer);
    });

task("bridge-vaa", "Get VAA")
    .addParam("sequence", "sequence number of the tx")
    .addParam("type", "'0' means WH_19, '1' means 'WH_ISK'")
    .addOptionalParam("encoding", "'hex' or 'base64'", "base64")
    .setAction(async (taskArgs, hre: HardhatRuntimeEnvironment) => {
        const chainId = chainNameToChainId(hre.network.name);
        const bridgeAddress = getBridgeApp(chainId, "bridge");
        await getVAA(taskArgs.type, chainId, bridgeAddress, taskArgs.sequence, taskArgs.encoding);
    });

/**
 * Bridge Transfer
 */
task("transfer", "bridge transfer token.")
    .addParam("token", "token address to transfer")
    .addParam("amount", "amount to send")
    .addParam("toChain", "recipient chain id.")
    .addParam("to", "recipient address.")
    .addParam("arbiterFee", "arbiter fee.")
    .addOptionalParam("serviceFee", "service fee. use calculated fee if not specified.")
    .addOptionalParam("nonce", "nonce.")
    .addOptionalParam("signer", "signer address.")
    .addOptionalParam("wallet", "signer wallet name")
    .addOptionalParam("jsonKeyfile", "json key file to sign tx.", undefined, types.inputFile)
    .addOptionalParam("publisherType", "'0' means WH_19, '1' means 'WH_ISK'")
    .addFlag("approve", "execute erc20 approve tx.")
    .setAction(async (taskArgs, hre: HardhatRuntimeEnvironment) => {
        const bridgeAddress = getBridgeApp(chainNameToChainId(hre.network.name), "bridge");
        const signer = await getSignerFromArgs(taskArgs, hre);

        let nonce: number;
        if (taskArgs.nonce) {
            nonce = taskArgs.nonce;
        } else {
            nonce = Math.floor(Math.random() * 10000);
        }
        const sequence = await transferTokens(
            hre,
            bridgeAddress,
            taskArgs.token,
            taskArgs.amount,
            signer,
            taskArgs.toChain,
            hexToBytes32(taskArgs.to),
            nonce,
            taskArgs.approve,
            taskArgs.arbiterFee,
            taskArgs.serviceFee
        );
        if (taskArgs.publisherType) {
            await fetchVAA(3, taskArgs.publisherType, chainNameToChainId(hre.network.name), bridgeAddress, sequence);
        }
    });

task("complete-transfer", "Complete transfer on to chain.")
    .addParam("vaa", "VAA (Base64 encoded)")
    .addOptionalParam("signer", "signer address.")
    .addOptionalParam("wallet", "signer wallet name")
    .addOptionalParam("jsonKeyfile", "json key file to sign tx.", undefined, types.inputFile)
    .setAction(async (taskArgs, hre: HardhatRuntimeEnvironment) => {
        const signer = await getSignerFromArgs(taskArgs, hre);
        const chainId = chainNameToChainId(hre.network.name);
        const bridgeAddress = getBridgeApp(chainId, "bridge");
        await completeTransfer(hre, bridgeAddress, taskArgs.vaa, signer);
    });

task("return-transfer", "bridge transfer token.")
    .addParam("vaa", "VAA (Base64 encoded)")
    .addParam("to", "recipient address.")
    .addParam("arbiterFee", "arbiter fee.")
    .addOptionalParam("feeDecimals", "fee decimals.")
    .addOptionalParam("nonce", "nonce.")
    .addOptionalParam("signer", "signer address.")
    .addOptionalParam("wallet", "signer wallet name")
    .addOptionalParam("jsonKeyfile", "json key file to sign tx.", undefined, types.inputFile)
    .addOptionalParam("publisherType", "'0' means WH_19, '1' means 'WH_ISK'")
    .setAction(async (taskArgs, hre: HardhatRuntimeEnvironment) => {
        const bridgeAddress = getBridgeApp(chainNameToChainId(hre.network.name), "bridge");
        const signer = await getSignerFromArgs(taskArgs, hre);

        let nonce: number;
        if (taskArgs.nonce) {
            nonce = taskArgs.nonce;
        } else {
            nonce = Math.floor(Math.random() * 10000);
        }
        const sequence = await returnTransfer(
            hre,
            bridgeAddress,
            taskArgs.vaa,
            hexToBytes32(taskArgs.to),
            taskArgs.arbiterFee,
            nonce,
            signer,
            taskArgs.feeDecimals
        );
        if (taskArgs.publisherType) {
            await fetchVAA(3, taskArgs.publisherType, chainNameToChainId(hre.network.name), bridgeAddress, sequence);
        }
    });

task("bridge-status", "Get status of the bridge contract.").setAction(
    async (taskArgs, hre: HardhatRuntimeEnvironment) => {
        const bridgeAddress = getBridgeApp(chainNameToChainId(hre.network.name), "bridge");
        await bridgeStatus(hre, bridgeAddress);
    }
);

task("outstanding-bridged")
    .addParam("tokenAddress", "address of the origin token.")
    .setAction(async (taskArgs, hre: HardhatRuntimeEnvironment) => {
        const bridgeImplFactory = await hre.ethers.getContractFactory("BridgeImplementation");
        const bridgeAddress = getBridgeApp(chainNameToChainId(hre.network.name), "bridge");
        const impl = bridgeImplFactory.attach(bridgeAddress);

        const amount = await impl.outstandingBridged(taskArgs.tokenAddress);
        console.log("Outstanding Bridged Amount: " + amount);
    });

/**
 * NFTBridge Transfer
 */
task("transfer-nft", "bridge transfer a NFT")
    .addParam("token", "token address to transfer")
    .addParam("id", "token ID to transfer")
    .addParam("toChain", "recipient chain id.")
    .addParam("to", "recipient address.")
    .addParam("fee", "arbiter fee")
    .addOptionalParam("nonce", "nonce.")
    .addOptionalParam("signer", "signer address.")
    .addOptionalParam("wallet", "signer wallet name")
    .addOptionalParam("jsonKeyfile", "json key file to sign tx.", undefined, types.inputFile)
    .addOptionalParam("publisherType", "'0' means WH_19, '1' means 'WH_ISK'")
    .addFlag("approve", "execute erc721 approve tx.")
    .setAction(async (taskArgs, hre: HardhatRuntimeEnvironment) => {
        const bridgeAddress = getBridgeApp(chainNameToChainId(hre.network.name), "nftbridge");
        const signer = await getSignerFromArgs(taskArgs, hre);

        let nonce: number;
        if (taskArgs.nonce) {
            nonce = taskArgs.nonce;
        } else {
            nonce = Math.floor(Math.random() * 10000);
        }
        const sequence = await transferNFT(
            hre,
            bridgeAddress,
            taskArgs.token,
            taskArgs.id,
            signer,
            taskArgs.toChain,
            hexToBytes32(taskArgs.to),
            taskArgs.fee,
            nonce,
            taskArgs.approve
        );
        if (taskArgs.publisherType) {
            await fetchVAA(3, taskArgs.publisherType, chainNameToChainId(hre.network.name), bridgeAddress, sequence);
        }
    });

task("batch-transfer-nft", "bridge transfer a NFT")
    .addParam("token", "token address to transfer")
    .addParam("ids", "ids to batch transfer; comma separated")
    .addParam("toChain", "recipient chain id.")
    .addParam("to", "recipient address.")
    .addParam("fee", "arbiter fee")
    .addOptionalParam("nonce", "nonce.")
    .addOptionalParam("signer", "signer address.")
    .addOptionalParam("wallet", "signer wallet name")
    .addOptionalParam("jsonKeyfile", "json key file to sign tx.", undefined, types.inputFile)
    .addOptionalParam("publisherType", "'0' means WH_19, '1' means 'WH_ISK'")
    .addFlag("approve", "execute erc721 approve tx.")
    .setAction(async (taskArgs, hre: HardhatRuntimeEnvironment) => {
        const bridgeAddress = getBridgeApp(chainNameToChainId(hre.network.name), "nftbridge");
        const signer = await getSignerFromArgs(taskArgs, hre);

        let nonce: number;
        if (taskArgs.nonce) {
            nonce = taskArgs.nonce;
        } else {
            nonce = Math.floor(Math.random() * 10000);
        }
        let ids = taskArgs.ids.split(",");
        const sequence = await batchTransferNFT(
            hre,
            bridgeAddress,
            taskArgs.token,
            ids,
            signer,
            taskArgs.toChain,
            hexToBytes32(taskArgs.to),
            taskArgs.fee,
            nonce,
            taskArgs.approve
        );
        if (taskArgs.publisherType) {
            await fetchVAA(3, taskArgs.publisherType, chainNameToChainId(hre.network.name), bridgeAddress, sequence);
        }
    });

task("complete-transfer-nft", "Complete transfer on to chain.")
    .addParam("vaa", "VAA (Base64 encoded)")
    .addOptionalParam("signer", "signer address.")
    .addOptionalParam("wallet", "signer wallet name")
    .addOptionalParam("jsonKeyfile", "json key file to sign tx.", undefined, types.inputFile)
    .setAction(async (taskArgs, hre: HardhatRuntimeEnvironment) => {
        const signer = await getSignerFromArgs(taskArgs, hre);
        const chainId = chainNameToChainId(hre.network.name);
        const bridgeAddress = getBridgeApp(chainId, "nftbridge");
        await completeTransferNFT(hre, bridgeAddress, taskArgs.vaa, signer);
    });

task("complete-batch-transfer-nft", "Complete transfer on to chain.")
    .addParam("vaa", "VAA (Base64 encoded)")
    .addOptionalParam("signer", "signer address.")
    .addOptionalParam("wallet", "signer wallet name")
    .addOptionalParam("jsonKeyfile", "json key file to sign tx.", undefined, types.inputFile)
    .setAction(async (taskArgs, hre: HardhatRuntimeEnvironment) => {
        const signer = await getSignerFromArgs(taskArgs, hre);
        const chainId = chainNameToChainId(hre.network.name);
        const bridgeAddress = getBridgeApp(chainId, "nftbridge");
        await completeBatchTransferNFT(hre, bridgeAddress, taskArgs.vaa, signer);
    });

task("transfer-fee-token", "bridge transfer fee token")
    .addParam("app", "nftbridge or multitokenbridge")
    .addParam("toChain", "recipient chain id.")
    .addParam("to", "recipient address.")
    .addOptionalParam("nonce", "nonce.")
    .addOptionalParam("signer", "signer address.")
    .addOptionalParam("wallet", "signer wallet name")
    .addOptionalParam("jsonKeyfile", "json key file to sign tx.", undefined, types.inputFile)
    .addOptionalParam("publisherType", "'0' means WH_19, '1' means 'WH_ISK'")
    .setAction(async (taskArgs, hre: HardhatRuntimeEnvironment) => {
        const bridgeAddress = getBridgeApp(chainNameToChainId(hre.network.name), taskArgs.app);
        const signer = await getSignerFromArgs(taskArgs, hre);

        let nonce: number;
        if (taskArgs.nonce) {
            nonce = taskArgs.nonce;
        } else {
            nonce = Math.floor(Math.random() * 10000);
        }
        const sequence = await transferFeeToken(
            hre,
            bridgeAddress,
            taskArgs.toChain,
            signer,
            hexToBytes32(taskArgs.to),
            nonce
        );
        if (taskArgs.publisherType) {
            await fetchVAA(3, taskArgs.publisherType, chainNameToChainId(hre.network.name), bridgeAddress, sequence);
        }
    });

task("complete-transfer-fee-token", "Complete transfer on to chain.")
    .addParam("app", "nftbridge or multitokenbridge")
    .addParam("vaa", "VAA (Base64 encoded)")
    .addOptionalParam("signer", "signer address.")
    .addOptionalParam("wallet", "signer wallet name")
    .addOptionalParam("jsonKeyfile", "json key file to sign tx.", undefined, types.inputFile)
    .setAction(async (taskArgs, hre: HardhatRuntimeEnvironment) => {
        const signer = await getSignerFromArgs(taskArgs, hre);
        const chainId = chainNameToChainId(hre.network.name);
        const bridgeAddress = getBridgeApp(chainId, taskArgs.app);
        await completeTransferFeeToken(hre, bridgeAddress, taskArgs.vaa, signer);
    });

/**
 * MultiTokenBridge Transfer
 */
task("transfer-multitoken", "bridge transfer a multitoken")
    .addParam("token", "token address to transfer")
    .addParam("id", "token ID to transfer")
    .addParam("amount", "amount to transfer")
    .addParam("toChain", "recipient chain id.")
    .addParam("to", "recipient address.")
    .addParam("fee", "arbiter fee")
    .addOptionalParam("nonce", "nonce.")
    .addOptionalParam("signer", "signer address.")
    .addOptionalParam("wallet", "signer wallet name")
    .addOptionalParam("jsonKeyfile", "json key file to sign tx.", undefined, types.inputFile)
    .addOptionalParam("publisherType", "'0' means WH_19, '1' means 'WH_ISK'")
    .addFlag("approve", "execute erc721 approve tx.")
    .setAction(async (taskArgs, hre: HardhatRuntimeEnvironment) => {
        const bridgeAddress = getBridgeApp(chainNameToChainId(hre.network.name), "multitokenbridge");
        const signer = await getSignerFromArgs(taskArgs, hre);

        let nonce: number;
        if (taskArgs.nonce) {
            nonce = taskArgs.nonce;
        } else {
            nonce = Math.floor(Math.random() * 10000);
        }
        const sequence = await transferMultiToken(
            hre,
            bridgeAddress,
            taskArgs.token,
            taskArgs.id,
            taskArgs.amount,
            signer,
            taskArgs.toChain,
            hexToBytes32(taskArgs.to),
            taskArgs.fee,
            nonce,
            taskArgs.approve
        );
        if (taskArgs.publisherType) {
            await fetchVAA(3, taskArgs.publisherType, chainNameToChainId(hre.network.name), bridgeAddress, sequence);
        }
    });

task("batch-transfer-multitoken", "bridge batch transfer a multitoken")
    .addParam("token", "token address to transfer")
    .addParam("ids", "token IDs to transfer; comma separated")
    .addParam("amounts", "amounts to transfer; comma separated")
    .addParam("toChain", "recipient chain id.")
    .addParam("to", "recipient address.")
    .addParam("fee", "arbiter fee")
    .addOptionalParam("nonce", "nonce.")
    .addOptionalParam("signer", "signer address.")
    .addOptionalParam("wallet", "signer wallet name")
    .addOptionalParam("jsonKeyfile", "json key file to sign tx.", undefined, types.inputFile)
    .addOptionalParam("publisherType", "'0' means WH_19, '1' means 'WH_ISK'")
    .addFlag("approve", "execute erc721 approve tx.")
    .setAction(async (taskArgs, hre: HardhatRuntimeEnvironment) => {
        const bridgeAddress = getBridgeApp(chainNameToChainId(hre.network.name), "multitokenbridge");
        const signer = await getSignerFromArgs(taskArgs, hre);

        let nonce: number;
        if (taskArgs.nonce) {
            nonce = taskArgs.nonce;
        } else {
            nonce = Math.floor(Math.random() * 10000);
        }
        const sequence = await batchTransferMultiToken(
            hre,
            bridgeAddress,
            taskArgs.token,
            taskArgs.ids.split(","),
            taskArgs.amounts.split(","),
            signer,
            taskArgs.toChain,
            hexToBytes32(taskArgs.to),
            taskArgs.fee,
            nonce,
            taskArgs.approve
        );
        if (taskArgs.publisherType) {
            await fetchVAA(3, taskArgs.publisherType, chainNameToChainId(hre.network.name), bridgeAddress, sequence);
        }
    });

task("complete-transfer-multitoken", "Complete transfer on to chain.")
    .addParam("vaa", "VAA (Base64 encoded)")
    .addOptionalParam("signer", "signer address.")
    .addOptionalParam("wallet", "signer wallet name")
    .addOptionalParam("jsonKeyfile", "json key file to sign tx.", undefined, types.inputFile)
    .setAction(async (taskArgs, hre: HardhatRuntimeEnvironment) => {
        const signer = await getSignerFromArgs(taskArgs, hre);
        const chainId = chainNameToChainId(hre.network.name);
        const bridgeAddress = getBridgeApp(chainId, "multitokenbridge");
        await completeTransferMultiToken(hre, bridgeAddress, taskArgs.vaa, signer);
    });

task("complete-batch-transfer-multitoken", "Complete transfer on to chain.")
    .addParam("vaa", "VAA (Base64 encoded)")
    .addOptionalParam("signer", "signer address.")
    .addOptionalParam("wallet", "signer wallet name")
    .addOptionalParam("jsonKeyfile", "json key file to sign tx.", undefined, types.inputFile)
    .setAction(async (taskArgs, hre: HardhatRuntimeEnvironment) => {
        const signer = await getSignerFromArgs(taskArgs, hre);
        const chainId = chainNameToChainId(hre.network.name);
        const bridgeAddress = getBridgeApp(chainId, "multitokenbridge");
        await completeBatchTransferMultiToken(hre, bridgeAddress, taskArgs.vaa, signer);
    });
