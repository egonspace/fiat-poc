import { ethers } from "ethers";
import { EthereumProvider } from "hardhat/types";
import { FeeDataFetcher } from "./fee-data-fetcher";

export class EthersProviderWrapper extends ethers.providers.JsonRpcProvider {
    constructor(private readonly hardhatProvider: EthereumProvider, private readonly feeDataFetcher: FeeDataFetcher) {
        super();
    }

    public async send(method: string, params: any): Promise<any> {
        const result = await this.hardhatProvider.send(method, params);

        // We replicate ethers' behavior.
        this.emit("debug", {
            action: "send",
            request: {
                id: 42,
                jsonrpc: "2.0",
                method,
                params,
            },
            response: result,
            provider: this,
        });

        return result;
    }

    public toJSON() {
        return "<WrappedHardhatProvider>";
    }

    public async getFeeData(): Promise<ethers.providers.FeeData> {
        return await this.feeDataFetcher.getSuggestedFeeData(null, null, null);
    }
}
