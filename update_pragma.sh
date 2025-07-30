#!/bin/bash

# 사용법: ./update_pragma.sh <검색할 디렉토리>
# 예시: ./update_pragma.sh ./contracts

# 1. 스크립트 인자로 디렉토리 경로가 주어졌는지 확인합니다.
if [ -z "$1" ]; then
    echo "오류: 검색할 디렉토리 경로를 입력해주세요."
    echo "사용법: $0 <디렉토리 경로>"
    exit 1
fi

# 2. 대상 디렉토리가 실제로 존재하는지 확인합니다.
if [ ! -d "$1" ]; then
    echo "오류: '$1' 디렉토리를 찾을 수 없습니다."
    exit 1
fi

TARGET_DIR=$1
NEW_PRAGMA="pragma solidity ^0.8.0;"

# 3. macOS와 Linux에서 sed 명령어의 호환성을 처리합니다.
# GNU sed (Linux)는 -i 옵션 뒤에 확장자를 붙이지 않아도 됩니다.
# BSD sed (macOS)는 -i 옵션 뒤에 백업 파일 확장자를 명시해야 합니다. ('-i ""'는 백업을 만들지 않겠다는 의미)
SED_INPLACE_CMD="sed -i"
if [[ "$(uname)" == "Darwin" ]]; then
    SED_INPLACE_CMD="sed -i ''"
fi

echo "대상 디렉토리: ${TARGET_DIR}"
echo "변경할 내용: ${NEW_PRAGMA}"
echo "-------------------------------------------"

# 4. find 명령어로 대상 디렉토리 하위의 모든 .sol 파일을 찾습니다.
#    -exec 옵션을 사용해 찾은 각 파일에 대해 sed 명령어를 실행합니다.
#    정규식 '^pragma solidity.*'는 'pragma solidity'로 시작하는 모든 라인을 의미합니다.
find "${TARGET_DIR}" -type f -name "*.sol" -exec $SHELL -c '
    for file do
        echo "Processing: $file"
        '"$SED_INPLACE_CMD"' "s/^pragma solidity.*/'"$NEW_PRAGMA"'/g" "$file"
    done
' {} +

echo "-------------------------------------------"
echo "모든 .sol 파일의 pragma 버전 수정이 완료되었습니다."
