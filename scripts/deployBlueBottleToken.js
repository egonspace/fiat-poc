const {ethers} = require("hardhat");
const { BigNumber } = require("ethers");

function toTokenAmount(amount) {
    return BigNumber.from(amount).mul(BigNumber.from(10).pow(18));
}

async function main() {
    const BlueBottleToken = await ethers.getContractFactory("BlueBottleToken");
    const bbt = await BlueBottleToken.deploy(toTokenAmount(1_000_000_000));
    await bbt.deployed();
    console.log("BlueBottleToken contract deployed: " + bbt.address);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
