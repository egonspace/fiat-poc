require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config(); // .env 파일의 환경변수를 로드합니다.

require("./tasks/deploy");
require("./tasks/call");
require("./tasks/check-code");

const { twemixRpc, PRIVATE_KEY } = process.env;

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.14",
  networks: {
    hardhat: {
      chainId: 1112
    },
    twemix: {
      url: twemixRpc || "",
      accounts: PRIVATE_KEY ? [PRIVATE_KEY] : [],
      chainId: 1112
    }
  }
};
