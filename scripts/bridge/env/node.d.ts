declare namespace NodeJS {
    export interface ProcessEnv {
        GOVERNANCE_VOTERS: string;
        GOVERNANCE_PROPOSERS: string;
        QUORUM_SIZE: string;
        MINIMUM_VOTER_COUNT: string;
        MAXIMUM_VOTER_COUNT: string;

        ETHEREUM_FINALITY: string;
        KLAYTN_FINALITY: string;
        BASE_FINALITY: string;

        WORMHOLE19_CORE_GOVERNANCE_CHAIN_ID: string;
        WORMHOLE19_CORE_GOVERNANCE_CONTRACT: string;

        WORMHOLE_ISK_CORE_GOVERNANCE_CHAIN_ID: string;
        WORMHOLE_ISK_CORE_GOVERNANCE_CONTRACT: string;

        WORMHOLE_GUARDIANS: string;
        ETHEREUM_WORMHOLE19_CORE: string;
        KLAYTN_WORMHOLE19_CORE: string;
        BASE_WORMHOLE19_CORE: string;

        ISKRA_GUARDIANS: string;
        ETHEREUM_WORMHOLE_ISK_CORE: string;
        KLAYTN_WORMHOLE_ISK_CORE: string;
        BASE_WORMHOLE_ISK_CORE: string;

        GUARDIAN19_ENDPOINT: string;
        GUARDIAN_ISK_ENDPOINT: string;
        GUARDIAN19_CHAIN_PROXY_AUTH?: string;
        GUARDIAN_ISK_CHAIN_PROXY_AUTH: string;

        BRIDGE_GOVERNANCE_CHAIN: string;
        BRIDGE_GOVERNANCE_CONTRACT: string;

        KLAYTN_BRIDGE_APP: string;
        ETHEREUM_BRIDGE_APP: string;
        BASE_BRIDGE_APP: string;

        KLAYTN_NFTBRIDGE_APP: string;
        ETHEREUM_NFTBRIDGE_APP: string;
        BASE_NFTBRIDGE_APP: string;

        KLAYTN_MULTITOKENBRIDGE_APP: string;
        ETHEREUM_MULTITOKENBRIDGE_APP: string;
        BASE_MULTITOKENBRIDGE_APP: string;

        FEE_COLLECTOR_ADDRESS: string;
        NFT_FEE: string;
        MULTI_TOKEN_FEE: string;

        ETHEREUM_EVM_CHAIN_ID: string;
        KLAYTN_EVM_CHAIN_ID: string;
        BASE_EVM_CHAIN_ID: string;
    }
}
