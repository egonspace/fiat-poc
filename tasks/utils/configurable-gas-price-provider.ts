import { ProviderWrapper } from "hardhat/internal/core/providers/wrapper";
import { EthereumProvider, RequestArguments } from "hardhat/types";
import { toHex } from "hardhat/internal/util/bigint";
import { FeeDataFetcher } from "./fee-data-fetcher";
import { BigNumber } from "ethers";

export class ConfigurableGasPriceProvider extends ProviderWrapper {
    constructor(private readonly hardhatProvider: EthereumProvider, private readonly feeDataFetcher: FeeDataFetcher) {
        super(hardhatProvider);
    }

    public async request(args: RequestArguments): Promise<unknown> {
        if (args.method !== "eth_sendTransaction") {
            return this._wrappedProvider.request(args);
        }

        const params = this._getParams(args);

        // TODO: Should we validate this type?
        const tx = params[0];

        if (tx === undefined) {
            return this._wrappedProvider.request(args);
        }

        // We don't need to do anything in these cases
        if (tx.gasPrice !== undefined || (tx.maxFeePerGas !== undefined && tx.maxPriorityFeePerGas !== undefined)) {
            return this._wrappedProvider.request(args);
        }

        const feeData = await this.feeDataFetcher.getSuggestedFeeData(
            tx.gasPrice,
            tx.maxFeePerGas,
            tx.maxPriorityFeePerGas
        );
        if (feeData.maxFeePerGas != null && feeData.maxPriorityFeePerGas != null) {
            tx.maxFeePerGas = this._toHex(feeData.maxFeePerGas);
            tx.maxPriorityFeePerGas = this._toHex(feeData.maxPriorityFeePerGas);
        } else {
            tx.gasPrice = this._toHex(feeData.gasPrice);
        }

        return this._wrappedProvider.request(args);
    }

    private _toHex(value: BigNumber | bigint | number | null | undefined): string | null {
        if (value instanceof BigNumber) {
            return toHex(value.toBigInt());
        } else if (typeof value === "number" || typeof value === "bigint") {
            return toHex(value);
        }
        return null;
    }
}
