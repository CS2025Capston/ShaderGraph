/*
왼쪽 캔버스용 JS

createGraph(leftCanvas, containerWrapper) : 캔버스 클릭 이벤트 지정
*/

export function createGraph(leftCanvas, containerWrapper)
{

        const button = document.getElementById("create-node");
        leftCanvas.addEventListener("contextmenu", function(event){ // 왼쪽 캔버스 (그래프영역) 우클릭시
        event.preventDefault();  // 기존 우클릭메뉴 안보이게
        showCanvasDropdown(event, button); // 우클릭시 드롭다운 메뉴를 보여줌
        });

        button.addEventListener("click", function () {
        button.style.display = "none";
            
            
        // 라디오 버튼 컨테이너 생성
        const node = document.createElement("div");
        node.classList.add("node");
    
        // 라디오 버튼 목록 생성
        const options = ["X :", "Y :", "Z :"];
        options.forEach((option, index) => {
            const nodeItem = document.createElement("div");
            nodeItem.classList.add("radio-item");
    
            const radioInput = document.createElement("input");
            radioInput.type = "radio";
            radioInput.id = `radio${index + 1}`;
            radioInput.name = `radio-group-${Date.now()}`; // 고유한 그룹명 부여
    
            const radioLabel = document.createElement("label");
            radioLabel.htmlFor = radioInput.id;
            radioLabel.textContent = option;
    
            nodeItem.appendChild(radioInput);
            nodeItem.appendChild(radioLabel);
            node.appendChild(nodeItem);

            makeDraggable(node);
            
        });
        containerWrapper.appendChild(node);
    });
}


function showCanvasDropdown(event, button) {
    button.style.display = "block";
    button.style.top = event.clientY + "px";
    button.style.left = event.clientX + "px";
}

function makeDraggable(element) {
    let isDragging = false;
    let offsetX = 0, offsetY = 0;

    element.addEventListener("mousedown", function (event) {
        isDragging = true;
        offsetX = event.clientX - element.getBoundingClientRect().left;
        offsetY = event.clientY - element.getBoundingClientRect().top;
        element.style.zIndex = 1000; // 드래그 시 가장 위로
    });

    document.addEventListener("mousemove", function (event) {
        if (!isDragging) return;
        element.style.left = event.clientX - offsetX + "px";
        element.style.top = event.clientY - offsetY + "px";
    });

    document.addEventListener("mouseup", function () {
        isDragging = false;
        element.style.zIndex = "auto"; // 드래그 종료 후 원래대로
    });
}