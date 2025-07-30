# Steps to Deploy Wormhole Contracts
* Use hardhat `task` to deploy contracts
* environment variables are defined in `scripts/bridge/env/.env.[phase]`

### 1. Deploy Bridge Governance Contract
* `phase`: One of `dev` and `prod`
```
$ NODE_ENV=[phase] hardhat deploy-bridge-governance --network [network-name]
```

### 2. Update `BRIDGE_GOVERNANCE_CONTRACT` in `env.[phase]`
* `phase`: One of `dev` and `prod`

### 3. Deploy Bridge Contract & Wormhole Core If Necessary
* `network-name`: One of below options (Should be specified in `HardhatUserConfig.networks`, and added to `getChain()` in `hardhat.config.ts`)
  - `baobab`
  - `cypress`
  - `goerli`
  - `ethereum`
  - `amethyst`
```
$ NODE_ENV=[phase] hardhat deploy-bridge --network [network-name]
```
