import { FeeData } from "@ethersproject/providers";
import { EIP1193Provider } from "hardhat/src/types";
import { BigNumber } from "ethers";

export class FeeDataFetcher {
    // See eth_feeHistory for an explanation of what this means
    public static readonly EIP1559_REWARD_PERCENTILE: number = 50;

    private _nodeHasFeeHistory?: boolean;
    private _nodeSupportsEIP1559?: boolean;

    constructor(
        private readonly provider: EIP1193Provider,
        private readonly config: {
            gasPrice: bigint | null;
            maxFeePerGas: bigint | null;
            maxPriorityFeePerGas: bigint | null;
        }
    ) {}

    public async getSuggestedFeeData(
        desiredGasPrice: number | bigint | string | BigNumber | null | undefined,
        desiredMaxFeePerGas: number | bigint | string | BigNumber | null | undefined,
        desiredMaxPriorityFeePerGas: number | bigint | string | BigNumber | null | undefined
    ): Promise<FeeData> {
        let gasPrice: bigint | null = this._toBigIntOrNull(desiredGasPrice);
        let maxFeePerGas: bigint | null = this._toBigIntOrNull(desiredMaxFeePerGas);
        let maxPriorityFeePerGas: bigint | null = this._toBigIntOrNull(desiredMaxPriorityFeePerGas);
        let lastBaseFeePerGas: bigint | null = null;

        if (this._nodeSupportsEIP1559 !== false) {
            const block = (await this.provider.request({
                method: "eth_getBlockByNumber",
                params: ["latest", false],
            })) as any;

            if (block.baseFeePerGas) {
                lastBaseFeePerGas = BigInt(block.baseFeePerGas);
                this._nodeSupportsEIP1559 = true;
            }
        }

        let feeData = this._evaluateResult(gasPrice, maxFeePerGas, maxPriorityFeePerGas, lastBaseFeePerGas);
        if (feeData != null) {
            return feeData;
        }

        if (gasPrice == null) {
            gasPrice = this.config.gasPrice;
        }
        if (maxFeePerGas == null) {
            maxFeePerGas = this.config.maxFeePerGas;
        }
        if (maxPriorityFeePerGas == null) {
            maxPriorityFeePerGas = this.config.maxPriorityFeePerGas;
        }

        feeData = this._evaluateResult(gasPrice, maxFeePerGas, maxPriorityFeePerGas, lastBaseFeePerGas);
        if (feeData != null) {
            return feeData;
        }

        if (gasPrice == null) {
            gasPrice = await this._getGasPrice();
        }

        if (this._nodeSupportsEIP1559) {
            if (maxPriorityFeePerGas == null) {
                maxPriorityFeePerGas = 0n;
                if (this._nodeHasFeeHistory !== false) {
                    const historicalReward = await this._getHistoricalReward();
                    if (historicalReward != null) {
                        maxPriorityFeePerGas = historicalReward;
                        this._nodeHasFeeHistory = true;
                    } else {
                        this._nodeHasFeeHistory = false;
                    }
                }
            }

            if (maxFeePerGas == null) {
                maxFeePerGas = (lastBaseFeePerGas! * 10n) / 8n + maxPriorityFeePerGas;
            }

            if (maxPriorityFeePerGas == 0n) {
                maxPriorityFeePerGas = maxFeePerGas;
            }
        }

        return this._evaluateResult(gasPrice, maxFeePerGas, maxPriorityFeePerGas, lastBaseFeePerGas)!;
    }

    private async _getGasPrice(): Promise<bigint> {
        const response = (await this.provider.request({
            method: "eth_gasPrice",
        })) as string;

        return BigInt(response);
    }

    private async _getHistoricalReward(): Promise<bigint | null> {
        try {
            const response = (await this.provider.request({
                method: "eth_feeHistory",
                params: ["0x10", "latest", [FeeDataFetcher.EIP1559_REWARD_PERCENTILE]],
            })) as { baseFeePerGas: string[]; reward: string[][] };

            const rewards = response.reward
                .map((strRewards: string[]) => {
                    const rewards = strRewards
                        .map((strReward: string) => BigInt(strReward))
                        .filter((value) => value > 0n);
                    const sum = rewards.reduce((sum: bigint, value: bigint) => sum + value, 0n);
                    return rewards.length > 0 ? sum / BigInt(rewards.length) : 0n;
                })
                .filter((value) => value > 0n);

            const sum = rewards.reduce((sum: bigint, value: bigint) => sum + value, 0n);
            const avgReward = rewards.length > 0 ? sum / BigInt(rewards.length) : 0n;
            return avgReward;
        } catch (e) {
            console.warn(e);
            return null;
        }
    }

    private _toBigIntOrNull(value: number | bigint | BigNumber | string | null | undefined): bigint | null {
        if (typeof value === "number") {
            return BigInt(value);
        }
        if (typeof value === "bigint") {
            return value;
        }
        if (value instanceof BigNumber) {
            return value.toBigInt();
        }
        if (typeof value === "string") {
            return BigNumber.from(value).toBigInt();
        }
        return null;
    }

    private _toBigNumber(value: bigint | number | null | undefined): BigNumber | null {
        if (typeof value === "bigint") {
            return BigNumber.from(value);
        } else if (typeof value === "number") {
            return BigNumber.from(value);
        }
        return null;
    }

    private _evaluateResult(
        gasPrice: bigint | null,
        maxFeePerGas: bigint | null,
        maxPriorityFeePerGas: bigint | null,
        lastBaseFeePerGas: bigint | null
    ): FeeData | null {
        if (maxFeePerGas != null && maxPriorityFeePerGas != null && this._nodeSupportsEIP1559) {
            return {
                gasPrice: null,
                lastBaseFeePerGas: this._toBigNumber(lastBaseFeePerGas),
                maxFeePerGas: this._toBigNumber(maxFeePerGas),
                maxPriorityFeePerGas: this._toBigNumber(maxPriorityFeePerGas),
            };
        }
        if (gasPrice != null) {
            return {
                gasPrice: this._toBigNumber(gasPrice),
                lastBaseFeePerGas: this._toBigNumber(lastBaseFeePerGas),
                maxFeePerGas: null,
                maxPriorityFeePerGas: null,
            };
        }
        return null;
    }
}
