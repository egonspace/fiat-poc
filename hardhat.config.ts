import "dotenv/config";
import yargs from "yargs/yargs";

import "@nomiclabs/hardhat-waffle";
import "@openzeppelin/hardhat-upgrades";
import { extendEnvironment, task } from "hardhat/config";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { BackwardsCompatibilityProviderAdapter } from "hardhat/internal/core/providers/backwards-compatibility";

import "hardhat-abi-exporter";
import "hardhat-gas-reporter";
import { removeConsoleLog } from "hardhat-preprocessor";
import "hardhat-contract-sizer";

import "./tasks/bridge/bridge";
import "./tasks/bridge/common";
import "./tasks/bridge/deploy";
import "./tasks/bridge/governance";
import "./tasks/bridge/token";
import "./tasks/bridge/wormhole";
import "./tasks/common/abi";
import "./tasks/common/call";
import "./tasks/common/deploy";
import "./tasks/common/upgrades";
import "./tasks/klayswap/klayswap";
import "./tasks/mkp/mkp";
import "./tasks/pnft/pnft";
import "./tasks/staking/staking";
import "./tasks/vesting/vesting";
import "./tasks/wallet/wallet";
import { ConfigurableGasPriceProvider } from "./tasks/utils/configurable-gas-price-provider";
import { FeeDataFetcher } from "./tasks/utils/fee-data-fetcher";
import "./tasks/utils/flatten";
import { createProviderProxy } from "./tasks/utils/provider-proxy";
import "./tasks/utils/storage-layout";

task("accounts", "Prints the list of accounts", async (taskArgs, hre) => {
    const accounts = await hre.ethers.getSigners();

    for (const account of accounts) {
        console.log(account.address);
    }
});

const argv = yargs()
    .env("")
    .options({
        ethereumRpc: {
            type: "string",
            default: "https://ethereum-mainnet.g.allthatnode.com/full/evm/205d701686044a35ab76d98201ee4c73",
        },
        goerliRpc: {
            type: "string",
            default: "https://eth-goerli.public.blastapi.io",
        },
        cypressRpc: {
            type: "string",
            default: "https://public-en-cypress.klaytn.net",
        },
        baobabRpc: {
            type: "string",
            default: "https://api.baobab.klaytn.net:8651",
        },
        baseRpc: {
            type: "string",
            default: "https://mainnet.base.org",
        },
        arbitrumRpc: {
            type: "string",
            default: "https://arbiscan.io",
        },
        baseGoerliRpc: {
            type: "string",
            default: "https://goerli.base.org",
        },
        mnemonic: {
            type: "string",
            default: "donkey tunnel music romance other cluster magic custom author deputy swap impulse",
        },
    })
    .parseSync();

/** @type import('hardhat/config').HardhatUserConfig */

module.exports = {
   preprocess: {
        eachLine: removeConsoleLog((hre: HardhatRuntimeEnvironment) => {
            return (
                !hre.network.name.includes("hardhat") &&
                !hre.network.name.includes("local") &&
                !hre.network.name.includes("test")
            );
        }),
    },
    solidity: {
        version: "0.8.14",
        settings: {
            optimizer: {
                enabled: true,
            },
            outputSelection: {
                "*": {
                    "*": ["storageLayout"],
                },
            },
        },
    },
    networks: {
        hardhat: {
            allowUnlimitedContractSize: true,
            blockGasLimit: 100000000,
        },
        ethereum: {
            url: argv.ethereumRpc,
            networkId: 1,
            accounts: {
                mnemonic: argv.mnemonic,
                path: "m/44'/60'/0'/1",
            },
        },
        goerli: {
            url: argv.goerliRpc,
            networkId: 5,
            accounts: {
                mnemonic: argv.mnemonic,
            },
        },
        cypress: {
            url: argv.cypressRpc,
            networkId: 8217,
            accounts: {
                mnemonic: argv.mnemonic,
                path: "m/44'/60'/0'/1",
            },
        },
        baobab: {
            url: argv.baobabRpc,
            networkId: 1001,
            accounts: {
                mnemonic: argv.mnemonic,
            },
        },
        baseGoerli: {
            url: argv.baseGoerliRpc,
            networkId: 84531,
            accounts: {
                mnemonic: argv.mnemonic,
            },
            maxPriorityFeePerGas: 100
        },
        base: {
            url: argv.baseRpc,
            networkId: 8453,
            accounts: {
                mnemonic: argv.mnemonic,
                path: "m/44'/60'/0'/1",
            },
            maxPriorityFeePerGas: 100
        },
        arbitrum: {
            url: argv.arbitrumRpc,
            networkId: 42161,
            accounts: {
                mnemonic: argv.mnemonic,
                path: "m/44'/60'/0'/1",
            },
            maxPriorityFeePerGas: 100
        },
        wemix: {
            url: argv.wemixRpc,
            networkId: 1111,
            accounts: {
                mnemonic: argv.mnemonic,
                path: "m/44'/60'/0'/1",
            },
        },
        twemix: {
            url: argv.twemixRpc,
            networkId: 1112,
            accounts: {
                mnemonic: argv.mnemonic,
                path: "m/44'/60'/0'/1",
            },
        },
        devnet: {
            url: argv.devnetRpc,
            networkId: 1113,
            accounts: {
                mnemonic: argv.mnemonic,
                path: "m/44'/60'/0'/1",
            },
        },
        local: {
            url: argv.localRpc,
            networkId: 1111,
            accounts: {
                mnemonic: argv.mnemonic,
                path: "m/44'/60'/0'/1",
            },
        },
        avalanche: { 
            url: argv.avalancheRpc,
            networkId: 43114,
            accounts: {
                mnemonic: argv.mnemonic,
                path: "m/44'/60'/0'/1",
            },
        }
    },
    abiExporter: {
        path: "abis",
        clear: true,
        flat: true,
        only: [
            "Iskra",
            "Pioneer",
            "MultiSigWallet",
            "MarketPlace",
            "GameContractManager",
            "TestToken",
            "StakingToken",
            "gamification",
            "Launchpad",
            "IGOVesting",
            "InitialGameOffering",
            "CheckIO",
            "Bridge",
            "NFTBridge",
            "Revenue",
            "CheckIO",
            "Revealer",
            "Distributor",
            "ThreeStepCheckoutAutoDecimals",
            "IWormhole",
            "QuestWallRewardAgent",
            "SettlerNFT",
            "Gov",
            "GovChecker",
            "GovImp",
            "NCPExit",
            "NCPExitImp",
            "Registry",
            "StakingImp"
        ],
        except: ["mock"],
        spacing: 2,
        pretty: false,
    },
    gasReporter: {
        enabled: true,
    },

};
