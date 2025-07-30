import dotenv from "dotenv";
import path from "path";
import assert from "assert";
import {isHexString, isValidAddress} from "ethereumjs-util";

dotenv.config({ path: path.join(__dirname, `.env.${process.env.NODE_ENV}`) });

export const ETHREUM_CHAIN_ID = 2;
export const KLAYTN_CHAIN_ID = 13;
export const BASE_CHAIN_ID = 30;

const governanceChainId = parseInt(process.env.BRIDGE_GOVERNANCE_CHAIN as string);

export enum WormholeType {
    WH19,
    WH_ISK
}

interface BridgeGovernanceDeployParams {
    wormhole: string;
    consistencyLevel: number;
    voters: string[];
    proposers: string[];
    quorumSize: number;
    minimumVoterCount: number;
    maximumVoterCount: number;
}

interface BridgeDeployParams {
    chainParam: ChainParam,
    bridgeGovernanceParams: BridgeGovernanceParams,
    publisherWormhole: string
}

interface WormholeCoreDeployParams {
    guardians: string[];
    governanceChainId: number;
    governanceContract: string;
}

interface BridgeGovernanceParams {
    governanceChainId: number,
    governanceContract: string,
    governanceVerifierWormhole: string
}

interface ChainParam {
    chainId: number;
    finality: number;
}

const ethereumChainParam: ChainParam = {
    chainId: ETHREUM_CHAIN_ID,
    finality: parseInt(process.env.ETHEREUM_FINALITY as string),
}

const klaytnChainParam: ChainParam = {
    chainId: KLAYTN_CHAIN_ID,
    finality: parseInt(process.env.KLAYTN_FINALITY as string),
}

const baseChainParam: ChainParam = {
    chainId: BASE_CHAIN_ID,
    finality: parseInt(process.env.BASE_FINALITY as string),
}

const ethereumBridgeDeployParam: BridgeDeployParams = {
    chainParam: ethereumChainParam,
    bridgeGovernanceParams: {
        governanceChainId: governanceChainId,
        governanceContract: process.env.BRIDGE_GOVERNANCE_CONTRACT as string,
        governanceVerifierWormhole: process.env.ETHEREUM_WORMHOLE19_CORE as string
    },
    publisherWormhole: process.env.ETHEREUM_WORMHOLE19_CORE as string
}

const klaytnBridgeDeployParam: BridgeDeployParams = {
    chainParam: klaytnChainParam,
    bridgeGovernanceParams: {
        governanceChainId: governanceChainId,
        governanceContract: process.env.BRIDGE_GOVERNANCE_CONTRACT as string,
        governanceVerifierWormhole: process.env.KLAYTN_WORMHOLE19_CORE as string
    },
    publisherWormhole: process.env.KLAYTN_WORMHOLE19_CORE as string
}

const baseBridgeDeployParam: BridgeDeployParams = {
    chainParam: baseChainParam,
    bridgeGovernanceParams: {
        governanceChainId: governanceChainId,
        governanceContract: process.env.BRIDGE_GOVERNANCE_CONTRACT as string,
        governanceVerifierWormhole: process.env.BASE_WORMHOLE19_CORE as string
    },
    publisherWormhole: process.env.BASE_WORMHOLE19_CORE as string
}

export function getChainParam(chainId: number): ChainParam {
    let params: ChainParam;
    if (chainId == ETHREUM_CHAIN_ID) {
        params = ethereumChainParam;
    } else if (chainId == KLAYTN_CHAIN_ID) {
        params = klaytnChainParam;
    } else if (chainId == BASE_CHAIN_ID) {
        params = baseChainParam;
    } else {
        throw Error('invalid chain.');
    }
    assert(params.finality > 0, "invalid params: finality")
    return params;
}

export function getBridgeDeployParams(chainId: number): BridgeDeployParams {
    let params: BridgeDeployParams;
    if (chainId == ETHREUM_CHAIN_ID) {
        params = ethereumBridgeDeployParam;
    } else if (chainId == KLAYTN_CHAIN_ID) {
        params = klaytnBridgeDeployParam;
    } else if (chainId == BASE_CHAIN_ID) {
        params = baseBridgeDeployParam;
    } else {
        throw Error('invalid chain.');
    }
    // validate params
    assert(params.chainParam.finality > 0, "invalid params: finality")
    assert(isValidAddress(params.bridgeGovernanceParams.governanceContract), "invalid params: governance contract.");
    assert(isValidAddress(params.bridgeGovernanceParams.governanceVerifierWormhole), "invalid params: verifier wormhole");

    assert(isValidAddress(params.publisherWormhole));
    return params
}

export function getWormholeDeployParams(wormholeType: WormholeType): WormholeCoreDeployParams {
    let governanceChainId: number;
    let governanceContract: string;
    const guardians: string[] = []

    if (wormholeType == WormholeType.WH19) {
        governanceChainId = parseInt(process.env.WORMHOLE19_CORE_GOVERNANCE_CHAIN_ID as string);
        governanceContract = process.env.WORMHOLE19_CORE_GOVERNANCE_CONTRACT as string;
        (process.env.WORMHOLE_GUARDIANS as string).split(",").forEach((g) => guardians.push(g));
    } else if (wormholeType == WormholeType.WH_ISK) {
        governanceChainId = parseInt(process.env.WORMHOLE_ISK_CORE_GOVERNANCE_CHAIN_ID as string);
        governanceContract = process.env.WORMHOLE_ISK_CORE_GOVERNANCE_CONTRACT as string;
        (process.env.ISKRA_GUARDIANS as string).split(",").forEach((g) => guardians.push(g));
    } else {
        throw Error("invalid wormhole type.");
    }

    assert(isHexString(governanceContract), "invalid params: wormhole core governance contract")
    assert(guardians.length > 0, "invalid params: empty guardian");
    for (let g of guardians) {
        assert(isValidAddress(g), "invalid guardian address.");
    }
    return {
        guardians,
        governanceChainId: governanceChainId,
        governanceContract: governanceContract
    }
}

export function getBridgeGovernanceDeployParams(chainId: number): BridgeGovernanceDeployParams {
    let wormhole: string;
    let consistencyLevel: number;

    if (chainId == ETHREUM_CHAIN_ID) {
        wormhole = process.env.ETHEREUM_WORMHOLE19_CORE as string;
        consistencyLevel = parseInt(process.env.ETHEREUM_FINALITY as string)
    } else if (chainId == KLAYTN_CHAIN_ID) {
        wormhole = process.env.KLAYTN_WORMHOLE19_CORE as string;
        consistencyLevel = parseInt(process.env.KLAYTN_FINALITY as string);
    } else {
        throw Error("unsupported chain to install bridge governance.")
    }

    const voters = (process.env.GOVERNANCE_VOTERS as string).split(",")
    for (let v of voters) {
        assert(isValidAddress(v), "invalid params: voter address");
    }
    const proposers = (process.env.GOVERNANCE_PROPOSERS as string).split(",")
    for (let p of proposers) {
        assert(isValidAddress(p), "invalid params: voter address");
    }
    const quorumSize = parseInt(process.env.QUORUM_SIZE as string)
    assert(quorumSize > 0 && quorumSize <= voters.length, "invalid params: quorum size")

    const minimumVoterCount = parseInt(process.env.MINIMUM_VOTER_COUNT as string)
    const maximumVoterCount = parseInt(process.env.MAXIMUM_VOTER_COUNT as string)
    assert(minimumVoterCount > 0 && minimumVoterCount <= voters.length && voters.length <= maximumVoterCount, "invalid params: voter count")
    return {
        wormhole,
        consistencyLevel,
        voters,
        proposers,
        quorumSize,
        minimumVoterCount,
        maximumVoterCount
    }
}

export function getWormhole(chainId: number, type: WormholeType): string {
    if (type == WormholeType.WH19) {
        return getWormhole19(chainId);
    } else if (type == WormholeType.WH_ISK) {
        return getWormholeIsk(chainId);
    } else {
        throw Error("Invalid wormhole type.");
    }
}

export function getWormhole19(chainId: number) {
    if (chainId == KLAYTN_CHAIN_ID) {
        return validAddress(process.env.KLAYTN_WORMHOLE19_CORE as string, "klaytn wormhole-19 address")
    } else if (chainId == ETHREUM_CHAIN_ID) {
        return validAddress(process.env.ETHEREUM_WORMHOLE19_CORE as string, "ethereum wormhole-19 address")
    } else if (chainId == BASE_CHAIN_ID) {
        return validAddress(process.env.BASE_WORMHOLE19_CORE as string, "base wormhole-19 address")
    } else {
        throw Error("invalid chain.");
    }
}

export function getWormholeIsk(chainId: number) {
    if (chainId == ETHREUM_CHAIN_ID) {
        return validAddress(process.env.ETHEREUM_WORMHOLE_ISK_CORE as string, "ethereum wormhole-isk address");
    } else if (chainId == KLAYTN_CHAIN_ID) {
        return validAddress(process.env.KLAYTN_WORMHOLE_ISK_CORE as string, "klaytn wormhole-isk address")
    } else if (chainId == BASE_CHAIN_ID) {
        return validAddress(process.env.BASE_WORMHOLE_ISK_CORE as string, "base wormhole-isk address")
    } else {
        throw Error("invalid chain.");
    }
}

export function getBridgeApp(chainId: number, app:string) {
    if (app === 'bridge') {
      if (chainId == KLAYTN_CHAIN_ID) {
          return validAddress(process.env.KLAYTN_BRIDGE_APP as string, "klaytn bridge address")
      } else if (chainId == ETHREUM_CHAIN_ID) {
          return validAddress(process.env.ETHEREUM_BRIDGE_APP as string, "ethereum bridge address")
      } else if (chainId == BASE_CHAIN_ID) {
          return validAddress(process.env.BASE_BRIDGE_APP as string, "base bridge address")
      } else {
          throw Error("invalid chain.");
      }
    }
    else if (app === 'nftbridge') {
      if (chainId == KLAYTN_CHAIN_ID) {
          return validAddress(process.env.KLAYTN_NFTBRIDGE_APP as string, "klaytn nft bridge address")
      } else if (chainId == ETHREUM_CHAIN_ID) {
          return validAddress(process.env.ETHEREUM_NFTBRIDGE_APP as string, "ethereum nft bridge address")
      } else if (chainId == BASE_CHAIN_ID) {
          return validAddress(process.env.BASE_NFTBRIDGE_APP as string, "base nft bridge address")
      } else {
          throw Error("invalid chain.");
      }
    }
    else if (app === 'multitokenbridge') {
        if (chainId == KLAYTN_CHAIN_ID) {
            return validAddress(process.env.KLAYTN_MULTITOKENBRIDGE_APP as string, "klaytn multitoken bridge address")
        } else if (chainId == ETHREUM_CHAIN_ID) {
            return validAddress(process.env.ETHEREUM_MULTITOKENBRIDGE_APP as string, "ethereum multitoken bridge address")
        } else if (chainId == BASE_CHAIN_ID) {
            return validAddress(process.env.BASE_MULTITOKENBRIDGE_APP as string, "base multitoken bridge address")
        } else {
            throw Error("invalid chain.");
        }
    }
    else {
        throw Error("invalid app: bridge or nftbridge or multitokenbridge");
    }
}

export function validAddress(addr: string, paramName: string) {
    assert(isValidAddress(addr), "invalid param: " + paramName);
    return addr;
}

export function getEvmChainId(chainId: number): number {
    if (chainId == ETHREUM_CHAIN_ID) {
        return parseInt(process.env.ETHEREUM_EVM_CHAIN_ID as string);
    } else if (chainId == KLAYTN_CHAIN_ID) {
        return parseInt(process.env.KLAYTN_EVM_CHAIN_ID as string);
    } else if (chainId == BASE_CHAIN_ID) {
        return parseInt(process.env.BASE_EVM_CHAIN_ID as string);
    } else {
        throw Error("invalid chain.");
    }
}
