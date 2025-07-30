import axios, {AxiosError, AxiosRequestHeaders} from "axios";
import {hexToBytes32} from "../utils/utils";
import {HardhatRuntimeEnvironment, HttpNetworkConfig} from "hardhat/types";
import {AbiCoder, keccak256, solidityPack} from "ethers/lib/utils";
import {WormholeType} from "../env/deployEnv";
import {getRevertReason} from "../utils/revertReason";

const abiCoder = new AbiCoder();
const LOG_MESSAGE_PUBLISHED_EVENT_SIGNATURE = "0x6eb224fb001ed210e379b335e35efe88672a8ce935d981a6896b27ffdf52a3b2";
export const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

export async function getBridgeFactory(hre: HardhatRuntimeEnvironment): Promise<any> {
    return await hre.ethers.getContractFactory("Bridge", {
        libraries: {
            BridgeUtil: ZERO_ADDRESS
        }
    });
}
export async function waitConfirmation(hre: HardhatRuntimeEnvironment, tx: any): Promise<any> {
    const txHash = tx.hash;
    console.log("Transaction Hash: " + txHash);
    try {
        const receipt = await tx.wait(3);
        return receipt;
    } catch (e: unknown) {
        const networkConfig = hre.network.config as HttpNetworkConfig
        const provider = new hre.ethers.providers.JsonRpcProvider({
            url: networkConfig.url,
            headers: networkConfig.httpHeaders
        });
        const revertReason = await getRevertReason(txHash, provider);
        throw Error("[TX_FAILURE] " + revertReason);
    }
}

export async function getVAA(type: WormholeType, chainId: number, emitterAddress: string, sequence: string, encoding: string = "base64") {
    let response: any;
    let url: string;
    let endpoint: string;
    let authHeader: string | undefined = undefined;
    if (type == WormholeType.WH19) {
        endpoint = process.env.GUARDIAN19_ENDPOINT as string;
        if (process.env.GUARDIAN19_CHAIN_PROXY_AUTH) {
            authHeader = process.env.GUARDIAN19_CHAIN_PROXY_AUTH;
        }
    } else if (type == WormholeType.WH_ISK) {
        endpoint = process.env.GUARDIAN_ISK_ENDPOINT as string;
        authHeader = process.env.GUARDIAN_ISK_CHAIN_PROXY_AUTH;
    } else {
        throw Error("invalid wormhole type.");
    }
    url = `${endpoint}/v1/signed_vaa/${chainId}/${hexToBytes32(emitterAddress).substring(2)}/${sequence}`;
    try {
        const headers: AxiosRequestHeaders = {}
        if (authHeader) {
            headers["Authorization"] = `Basic ${authHeader}`
        }
        response = await axios.get(url, { headers });
    } catch (e: unknown) {
        if (e instanceof AxiosError) {
            console.error(e.message);
            console.log(`Failed to fetch. Request: ${url}`)
        } else {
            console.error(e);
        }
        return;
    }

    let vaa: string;
    if (encoding == "base64") {
        vaa = response.data.vaaBytes;
    } else {
        vaa = base64ToHex(response.data.vaaBytes);
    }
    console.log(vaa);
    return vaa;
}

export function base64ToHex(s: string): string {
    return "0x" + Buffer.from(s, "base64").toString("hex");
}

export async function getTxReceipt(hre: HardhatRuntimeEnvironment, txHash: string) {
    // @ts-ignore
    return await hre.ethers.provider.getTransactionReceipt(txHash);
}

export function parseLogMessagePublished(topics: string[], data: string) {
    const sender = abiCoder.decode(["address"], topics[1])[0];
    const [sequence, nonce, payload, consistencyLevel] = abiCoder.decode(["uint64", "uint32", "bytes", "uint8"], data);
    return { sender, sequence, nonce, payload, consistencyLevel };
}

export function getSequence(receipt: any): string {
    const event = receipt.events.filter((e: any) => e.topics[0] === LOG_MESSAGE_PUBLISHED_EVENT_SIGNATURE)[0];
    const { sequence } = parseLogMessagePublished(event.topics, event.data);
    return sequence as string;
}

function sleep(sec: number) {
    return new Promise(resolve => setTimeout(resolve, sec * 1000));
}

export function parseVAA(
  vaa: string
) {
  if (vaa.startsWith("0x")) {
    vaa = vaa.substring(2);
  }
  let index = 0;

  const version = BigInt("0x" + vaa.substring(index, index + 2));
  index = index + 2;

  const guardianSetIndex = BigInt("0x" + vaa.substring(index, index + 8));
  index = index + 8;

  const signersLen = BigInt("0x" + vaa.substring(index, index + 2));
  index = index + 2;

  const signatures = [];

  for (let i = 0; i < signersLen; i++) {
    const guardianIndex = BigInt("0x" + vaa.substring(index, index + 2));
    index = index + 2;

    const r = "0x" + vaa.substring(index, index + 64);
    index = index + 64;

    const s = "0x" + vaa.substring(index, index + 64);
    index = index + 64;

    const v = BigInt("0x" + vaa.substring(index, index + 2)) + 27n;
    index = index + 2;

    signatures.push([r, s, v, guardianIndex]);
  }

  const body = "0x" + vaa.substring(index);
  const hash = keccak256(solidityPack(["bytes32"], [keccak256(body)]));

  const timestamp = BigInt("0x" + vaa.substring(index, index + 8));
  index = index + 8;

  const nonce = BigInt("0x" + vaa.substring(index, index + 8));
  index = index + 8;

  const emitterChainId = BigInt("0x" + vaa.substring(index, index + 4));
  index = index + 4;

  const emitterAddress = "0x" + vaa.substring(index, index + 64);
  index = index + 64;

  const sequence = BigInt("0x" + vaa.substring(index, index + 16));
  index = index + 16;

  const consistencyLevel = BigInt("0x" + vaa.substring(index, index + 2));
  index = index + 2;

  const payload = "0x" + vaa.substring(index);

  return {
      version,
      timestamp,
      nonce,
      emitterChainId,
      emitterAddress,
      sequence,
      consistencyLevel,
      payload,
      guardianSetIndex,
      signatures,
      hash,
  };
}
