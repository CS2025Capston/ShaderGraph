async function openFileText(file) {
    return new Promise((resolve, reject) => {
        let reader = new FileReader();

        reader.onload = function (e) {
            // console.log("파일 내용:", e.target.result); // 파일 내용을 콘솔에 출력
            resolve(e.target.result); // 파일 내용 반환
        };

        reader.onerror = function (e) {
            reject(new Error("파일을 읽는 도중 오류 발생"));
        };

        reader.readAsText(file, "UTF-8");
    });
}

export function importObj(button)
{
    async function openFilePicker() {
        try {
            const [fileHandle] = await window.showOpenFilePicker();
            const file = await fileHandle.getFile();

            let fileExtension = file.name.split('.').pop().toLowerCase();

            if (fileExtension !== "obj") {
                alert("확장자명 오류");
            } else {
                let content = await openFileText(file);
                console.log(content);
            }
        } catch (err) {
            console.log('파일 선택이 취소됨', err);
        }
    }

    button.addEventListener("click", openFilePicker);
}