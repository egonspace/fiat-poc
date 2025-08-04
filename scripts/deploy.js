const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  const constructorArgs = {
    Greeter: ["Hello from deploy script!"], // Greeter 컨트랙트는 문자열 인자 1개가 필요
    YourOtherContract: [42, "0x...someAddress..."], // 다른 컨트랙트의 인자
    // 인자가 없는 컨트랙트는 명시할 필요 없음
  };

  // Hardhat 설정에서 contracts 디렉토리의 경로를 가져옵니다.
  const contractsDir = hre.config.paths.sources;
  console.log(`Scanning for contracts in: ${contractsDir}\n`);

  // contracts 디렉토리의 모든 파일 목록을 동기적으로 읽어옵니다.
  const files = fs.readdirSync(contractsDir);

  // 배포된 컨트랙트 정보를 저장할 객체
  const deployedContracts = {};

  // 각 파일을 순회합니다.
  for (const file of files) {
    // .sol 확장자를 가진 파일만 처리합니다.
    if (file.endsWith(".sol")) {
      const contractName = path.basename(file, ".sol");

      // 특정 컨트랙트(예: Hardhat 기본 제공)를 제외하고 싶을 때 사용
      if (contractName === "Lock") {
        console.log("Skipping Lock.sol...");
        continue;
      }

      try {
        // 컨트랙트 팩토리를 가져옵니다.
        const ContractFactory = await hre.ethers.getContractFactory(contractName);
        
        console.log(`Deploying ${contractName}...`);

        // 컨트랙트를 배포합니다. (생성자 인자가 없는 경우)
        const contract = await ContractFactory.deploy();

        // 배포가 완료될 때까지 기다립니다.
        await contract.waitForDeployment();

        const address = contract.target;
        console.log(`${contractName} deployed to: ${address}\n`);

        // 배포된 컨트랙트 주소를 기록합니다.
        deployedContracts[contractName] = address;

      } catch (error) {
        console.error(`Failed to deploy ${contractName}:`, error);
      }
    }
  }

  console.log("--- All contracts deployed ---");
  console.log(JSON.stringify(deployedContracts, null, 2));
  console.log("----------------------------");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

