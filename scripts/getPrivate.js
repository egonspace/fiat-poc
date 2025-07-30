const Web3 = require('web3');
const fs = require('fs/promises');
const path = require('path');

// Web3 인스턴스 생성 (네트워크 연결 불필요)
const web3 = new Web3();

/**
 * 메인 실행 함수 (IIFE - 즉시 실행 함수 표현)
 */
(async () => {
  // --- 1. 명령줄 인자 파싱 ---
  // process.argv는 [ 'node', 'decrypt-cli.js', 'arg1', 'arg2', ... ] 형태의 배열입니다.
  const args = process.argv.slice(2); // 'node'와 'script.js'를 제외한 실제 인자들

  if (args.length < 2) {
    console.error('사용법: node decrypt-cli.js <keystore_file_path> <password>');
    console.error('예시: node decrypt-cli.js ./keystore/UTC--... mySecretPassword');
    process.exit(1); // 에러 코드 1로 종료
  }

  const keystoreFilePath = args[0];
  const password = args[1];

  console.log(`키스토어 파일 경로: ${keystoreFilePath}`);
  
  try {
    // --- 2. 키스토어 파일 읽기 ---
    // 상대 경로, 절대 경로 모두 처리하기 위해 path.resolve 사용
    const resolvedPath = path.resolve(keystoreFilePath);
    const keystoreJsonString = await fs.readFile(resolvedPath, 'utf8');
    const keystoreJsonObject = JSON.parse(keystoreJsonString);

    // --- 3. 계정 복호화 ---
    console.log('파일 로드 성공. 비밀번호로 복호화를 시도합니다...');
    const decryptedAccount = web3.eth.accounts.decrypt(keystoreJsonObject, password);

    // --- 4. 결과 출력 ---
    console.log('\n=====================================');
    console.log('✅ 계정 복호화 성공!');
    console.log('=====================================');
    console.log('주소 (Address):', decryptedAccount.address);
    console.log('개인 키 (Private Key):', decryptedAccount.privateKey);
    console.log('=====================================');

  } catch (error) {
    console.error('\n=====================================');
    console.error('❌ 처리 중 오류가 발생했습니다.');
    console.error('=====================================');

    // 에러 종류에 따라 더 친절한 메시지 제공
    if (error.code === 'ENOENT') {
      console.error(`에러: 파일을 찾을 수 없습니다. 경로를 확인하세요: ${keystoreFilePath}`);
    } else if (error instanceof SyntaxError) {
      console.error('에러: 파일이 유효한 JSON 형식이 아닙니다.');
    } else if (error.message.includes('Key derivation failed')) {
      console.error('에러: 비밀번호가 틀린 것 같습니다.');
    } else {
      console.error('알 수 없는 에러:', error.message);
    }
    process.exit(1);
  }
})();
