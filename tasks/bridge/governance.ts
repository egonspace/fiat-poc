import { task, types } from "hardhat/config";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import {
    proposeCreateAdapter,
    proposeCreateWrapped,
    proposeRegisterChain,
    proposeSetVerifier,
    proposeUpdateServiceFeePolicy,
    proposeUpgradeBridge,
} from "../../scripts/bridge/cmd/bridgeGovernance";
import {
    execute,
    governanceStatus,
    proposeAddProposer,
    proposeAddVoter,
    proposeChangeQuorumSize,
    proposeCheckPointTransactionId,
    proposeRemoveProposer,
    proposeRemoveVoter,
    proposeSetGovernanceConsistencyLevel,
    vote,
} from "../../scripts/bridge/cmd/multisig";
import { getBridgeApp, WormholeType } from "../../scripts/bridge/env/deployEnv";
import { getSequence, getVAA } from "../../scripts/bridge/cmd/common";
import {
    attestToken,
    createAdapter,
    createWrapped,
    registerChain,
    updateServiceFeePolicy,
    upgradeBridge,
} from "../../scripts/bridge/cmd/bridge";
import { upgradeWormhole } from "../../scripts/bridge/cmd/wormhole";
import { getSignerFromArgs } from "../utils/utils";
import { fetchVAA } from "./common";

const GOV_PUBLISHER_WORMHOLE_TYPE = WormholeType.WH19;

task("governance-set-verifier", "Propose bridge governance message")
    .addParam("emitterChain", "emitter chain id")
    .addParam("type", "'0' means WH_19, '1' means 'WH_ISK'")
    .addOptionalParam("signer", "signer address.")
    .addOptionalParam("jsonKeyfile", "json key file to sign tx.", undefined, types.inputFile)
    .addFlag("execute", "vote and execute with the signer account(only for test purpose).")
    .setAction(async (taskArgs, hre: HardhatRuntimeEnvironment) => {
        const signer = await getSignerFromArgs(taskArgs, hre);
        const txId = await proposeSetVerifier(hre, taskArgs.emitterChain, taskArgs.type, signer);

        if (taskArgs.execute) {
            await vote(hre, txId, signer);
            await execute(hre, txId, signer);
        }
    });

/**
 * Register Chain
 */
task("governance-register-chain", "Propose bridge governance message")
    .addParam("targetChainId", "wormhole chain id of the target chain.")
    .addParam("chainId", "wormhole chain id of the chain to be registered.")
    .addParam("app", "either bridge or nftbridge or multitokenbridge")
    .addParam(
        "verifierType",
        "wormhole contract type on the target chain to be used to verify message from the chain to be registered. ('0' means WH_19, '1' means 'WH_ISK')"
    )
    .addOptionalParam("signer", "signer address.")
    .addOptionalParam("jsonKeyfile", "json key file to sign tx.", undefined, types.inputFile)
    .addFlag("execute", "vote and execute with the propose account(only for test purpose).")
    .setAction(async (taskArgs, hre: HardhatRuntimeEnvironment) => {
        const signer = await getSignerFromArgs(taskArgs, hre);
        const bridgeAddress = getBridgeApp(taskArgs.chainId, taskArgs.app);
        const txId = await proposeRegisterChain(
            hre,
            taskArgs.targetChainId,
            taskArgs.chainId,
            taskArgs.app,
            bridgeAddress,
            taskArgs.verifierType,
            signer
        );

        if (taskArgs.execute) {
            await vote(hre, txId, signer);
            const receipt = await execute(hre, txId, signer);
            const sequence = getSequence(receipt);
            console.log("Sequence: " + sequence);
            await fetchVAA(
                3,
                GOV_PUBLISHER_WORMHOLE_TYPE,
                parseInt(process.env.BRIDGE_GOVERNANCE_CHAIN!),
                process.env.BRIDGE_GOVERNANCE_CONTRACT!,
                sequence!
            );
        }
    });

/**
 * Upgrade Bridge
 */
task("governance-upgrade-bridge", "Propose bridge upgrade message")
    .addParam("targetChainId", "wormhole chain id of the target chain.")
    .addParam("app", "either bridge or nftbridge")
    .addParam("implementation", "address of the new implementation contract.")
    .addOptionalParam("signer", "signer address.")
    .addOptionalParam("jsonKeyfile", "json key file to sign tx.", undefined, types.inputFile)
    .addFlag("execute", "vote and execute with the propose account(only for test purpose).")
    .setAction(async (taskArgs, hre: HardhatRuntimeEnvironment) => {
        const signer = await getSignerFromArgs(taskArgs, hre);
        const txId = await proposeUpgradeBridge(
            hre,
            taskArgs.targetChainId,
            taskArgs.app,
            taskArgs.implementation,
            signer
        );
        if (taskArgs.execute) {
            await vote(hre, txId, signer);
            const receipt = await execute(hre, txId, signer);
            const sequence = getSequence(receipt);
            console.log("Sequence: " + sequence);
            await fetchVAA(
                3,
                GOV_PUBLISHER_WORMHOLE_TYPE,
                parseInt(process.env.BRIDGE_GOVERNANCE_CHAIN!),
                process.env.BRIDGE_GOVERNANCE_CONTRACT!,
                sequence!
            );
        }
    });

/**
 * Asset
 */
task("governance-create-wrapped", "Propose create wrapped message.")
    .addParam("assetMetaVm", "asset meta VAA.")
    .addParam("name", "name of wrapper token.", "")
    .addParam("symbol", "symbol of wrapper token.", "")
    .addParam("targetChainId", "target chain to create wrapped token for the asset.")
    .addOptionalParam("signer", "signer address.")
    .addOptionalParam("jsonKeyfile", "json key file to sign tx.", undefined, types.inputFile)
    .addFlag("execute", "vote and execute with the propose account(only for test purpose).")
    .setAction(async (taskArgs, hre: HardhatRuntimeEnvironment) => {
        const signer = await getSignerFromArgs(taskArgs, hre);
        const txId = await proposeCreateWrapped(
            hre,
            taskArgs.assetMetaVm,
            taskArgs.name,
            taskArgs.symbol,
            taskArgs.targetChainId,
            signer
        );
        if (taskArgs.execute) {
            await vote(hre, txId, signer);
            const receipt = await execute(hre, txId, signer);
            const sequence = getSequence(receipt);
            console.log("Sequence: " + sequence);
            await fetchVAA(
                3,
                GOV_PUBLISHER_WORMHOLE_TYPE,
                parseInt(process.env.BRIDGE_GOVERNANCE_CHAIN!),
                process.env.BRIDGE_GOVERNANCE_CONTRACT!,
                sequence!
            );
        }
    });

task("governance-create-adapter", "Propose create adapter message.")
    .addParam("assetMetaVm", "asset meta VAA.")
    .addParam("targetChainId", "target chain to create wrapped token for the asset.")
    .addParam("tokenAddress", "token to be wrapped with adapter on the target chain.")
    .addOptionalParam("signer", "signer address.")
    .addOptionalParam("jsonKeyfile", "json key file to sign tx.", undefined, types.inputFile)
    .addFlag("execute", "vote and execute with the propose account(only for test purpose).")
    .setAction(async (taskArgs, hre: HardhatRuntimeEnvironment) => {
        const signer = await getSignerFromArgs(taskArgs, hre);
        const txId = await proposeCreateAdapter(
            hre,
            taskArgs.assetMetaVm,
            taskArgs.targetChainId,
            taskArgs.tokenAddress,
            signer
        );
        if (taskArgs.execute) {
            await vote(hre, txId, signer);
            const receipt = await execute(hre, txId, signer);
            const sequence = getSequence(receipt);
            console.log("Sequence: " + sequence);
            await fetchVAA(
                3,
                GOV_PUBLISHER_WORMHOLE_TYPE,
                parseInt(process.env.BRIDGE_GOVERNANCE_CHAIN!),
                process.env.BRIDGE_GOVERNANCE_CONTRACT!,
                sequence!
            );
        }
    });

/**
 * UpdateServiceFeePolicy
 */
task("governance-update-service-fee", "Propose update service fee message.")
    .addParam("targetChainId", "id of the target chain which bridge address belongs to.")
    .addParam("newPolicy", "address of the new policy contract.")
    .addOptionalParam("signer", "signer address.")
    .addOptionalParam("jsonKeyfile", "json key file to sign tx.", undefined, types.inputFile)
    .addFlag("execute", "vote and execute with the propose account(only for test purpose).")
    .setAction(async (taskArgs, hre: HardhatRuntimeEnvironment) => {
        const signer = await getSignerFromArgs(taskArgs, hre);
        const txId = await proposeUpdateServiceFeePolicy(hre, taskArgs.targetChainId, taskArgs.newPolicy, signer);
        if (taskArgs.execute) {
            await vote(hre, txId, signer);
            const receipt = await execute(hre, txId, signer);
            const sequence = getSequence(receipt);
            console.log("Sequence: " + sequence);
            await fetchVAA(
                3,
                GOV_PUBLISHER_WORMHOLE_TYPE,
                parseInt(process.env.BRIDGE_GOVERNANCE_CHAIN!),
                process.env.BRIDGE_GOVERNANCE_CONTRACT!,
                sequence!
            );
        }
    });

/**
 * Governance
 */
task("governance-status", "Show governance status.").setAction(async (taskArgs, hre: HardhatRuntimeEnvironment) =>
    governanceStatus(hre)
);

task("governance-vote", "Vote proposal.")
    .addParam("txId", "transaction id of the proposal.")
    .addOptionalParam("signer", "signer address.")
    .addOptionalParam("jsonKeyfile", "json key file to sign tx.", undefined, types.inputFile)
    .setAction(async (taskArgs, hre: HardhatRuntimeEnvironment) => {
        const signer = await getSignerFromArgs(taskArgs, hre);
        await vote(hre, taskArgs.txId, signer);
    });

task("governance-execute", "Vote proposal.")
    .addParam("txId", "transaction id of the proposal.")
    .addOptionalParam(
        "verifierType",
        "'0' means WH_19, '1' means 'WH_ISK'. If specified, it regards the tx as wormhole message execution and retrieves VAA."
    )
    .addOptionalParam("signer", "signer address.")
    .addOptionalParam("jsonKeyfile", "json key file to sign tx.", undefined, types.inputFile)
    .setAction(async (taskArgs, hre: HardhatRuntimeEnvironment) => {
        const signer = await getSignerFromArgs(taskArgs, hre);
        let isMessagePublishingTx = taskArgs.verifierType != undefined;
        const receipt = await execute(hre, taskArgs.txId, signer);
        if (isMessagePublishingTx) {
            const sequence = getSequence(receipt);
            console.log("Sequence: " + sequence);
            await fetchVAA(
                3,
                taskArgs.verifierType,
                parseInt(process.env.BRIDGE_GOVERNANCE_CHAIN!),
                process.env.BRIDGE_GOVERNANCE_CONTRACT!,
                sequence
            );
        }
    });

task("add-voter", "Propose to add governance voter.")
    .addParam("newVoter", "address of the new voter to be added.")
    .addOptionalParam("signer", "signer address.")
    .addOptionalParam("jsonKeyfile", "json key file to sign tx.", undefined, types.inputFile)
    .setAction(async (taskArgs, hre: HardhatRuntimeEnvironment) => {
        const signer = await getSignerFromArgs(taskArgs, hre);
        await proposeAddVoter(hre, taskArgs.newVoter, signer);
    });

task("remove-voter", "Propose to add governance voter.")
    .addParam("target", "address of the voter to be removed.")
    .addOptionalParam("signer", "signer address.")
    .addOptionalParam("jsonKeyfile", "json key file to sign tx.", undefined, types.inputFile)
    .setAction(async (taskArgs, hre: HardhatRuntimeEnvironment) => {
        const signer = await getSignerFromArgs(taskArgs, hre);
        await proposeRemoveVoter(hre, taskArgs.target, signer);
    });

task("add-proposer", "Propose to add governance voter.")
    .addParam("newProposer", "address of the new proposer to be added.")
    .addOptionalParam("signer", "signer address.")
    .addOptionalParam("jsonKeyfile", "json key file to sign tx.", undefined, types.inputFile)
    .setAction(async (taskArgs, hre: HardhatRuntimeEnvironment) => {
        const signer = await getSignerFromArgs(taskArgs, hre);
        await proposeAddProposer(hre, taskArgs.newProposer, signer);
    });

task("remove-proposer", "Propose to add governance voter.")
    .addParam("target", "address of the proposer to be removed.")
    .addOptionalParam("signer", "signer address.")
    .addOptionalParam("jsonKeyfile", "json key file to sign tx.", undefined, types.inputFile)
    .setAction(async (taskArgs, hre: HardhatRuntimeEnvironment) => {
        const signer = await getSignerFromArgs(taskArgs, hre);
        await proposeRemoveProposer(hre, taskArgs.target, signer);
    });

task("change-quorum-size", "Propose to change governance quorum size.")
    .addParam("required", "required number of votes to form quorum.")
    .addOptionalParam("signer", "signer address.")
    .addOptionalParam("jsonKeyfile", "json key file to sign tx.", undefined, types.inputFile)
    .setAction(async (taskArgs, hre: HardhatRuntimeEnvironment) => {
        const signer = await getSignerFromArgs(taskArgs, hre);
        await proposeChangeQuorumSize(hre, taskArgs.required, signer);
    });

task("checkpoint-txid", "Propose checkpoint transaction id.")
    .addParam("txId", "transaction id to checkpoint.")
    .addOptionalParam("signer", "signer address.")
    .addOptionalParam("jsonKeyfile", "json key file to sign tx.", undefined, types.inputFile)
    .setAction(async (taskArgs, hre: HardhatRuntimeEnvironment) => {
        const signer = await getSignerFromArgs(taskArgs, hre);
        await proposeCheckPointTransactionId(hre, taskArgs.txId, signer);
    });

task("set-governance-consistency-level", "Set consistency level of the governance contract.")
    .addParam("consistencyLevel", "new consistency level value.")
    .addOptionalParam("signer", "signer address.")
    .addOptionalParam("jsonKeyfile", "json key file to sign tx.", undefined, types.inputFile)
    .setAction(async (taskArgs, hre: HardhatRuntimeEnvironment) => {
        const signer = await getSignerFromArgs(taskArgs, hre);
        await proposeSetGovernanceConsistencyLevel(hre, taskArgs.consistencyLevel, signer);
    });

task("gov-vaa", "Get VAA")
    .addParam("sequence", "sequence number of the tx")
    .addOptionalParam("encoding", "'hex' or 'base64'", "base64")
    .setAction((taskArgs, _: HardhatRuntimeEnvironment) =>
        getVAA(
            WormholeType.WH19,
            parseInt(process.env.BRIDGE_GOVERNANCE_CHAIN!),
            process.env.BRIDGE_GOVERNANCE_CONTRACT!,
            taskArgs.sequence,
            taskArgs.encoding
        )
    );
