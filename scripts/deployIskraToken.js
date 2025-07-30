const {ethers} = require("hardhat");
const { BigNumber } = require("ethers");

function toTokenAmount(amount) {
    return BigNumber.from(amount).mul(BigNumber.from(10).pow(18));
}

async function main() {
    const IskraToken = await ethers.getContractFactory("IskraToken");
    const isk = await IskraToken.deploy(toTokenAmount(1_000_000_000));
    await isk.deployed();
    console.log("IskraToken contract deployed: " + isk.address);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
