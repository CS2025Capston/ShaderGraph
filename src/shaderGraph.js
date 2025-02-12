/*
왼쪽 캔버스용 JS

createGraph(leftCanvas, containerWrapper) : 캔버스 클릭 이벤트 지정
createNode(nodeName) : 노드 틀 만들기
*/

export function createGraph(leftCanvas, containerWrapper)
{
        const drop1 = createDropdown(containerWrapper);

        leftCanvas.addEventListener("contextmenu", function(event){ // 왼쪽 캔버스 (그래프영역) 우클릭시
            event.preventDefault();  // 기존 우클릭메뉴 안보이게
            showCanvasDropdown(event, drop1, containerWrapper); // 우클릭시 드롭다운 메뉴를 보여줌
        });  
}

function createDropdown(containerWrapper){
    const dropmenu = document.createElement("div");
    dropmenu.classList.add("leftDropdown");
     
    const options = ["vec3 노드 추가", "object 노드 추가", "3번메뉴", "4번메뉴"];
    options.forEach((option, index) => {
        const button = document.createElement("button");
        button.classList.add("leftDropdown-item");
        button.textContent = option;
        
        button.addEventListener("click", function () {
            dropmenu.style.display = "none";

            switch (index) {
                case 0: 
                    createNode_vec3(containerWrapper);
                    break;

                case 1: 
                    createNode_object(containerWrapper);
                    break;

                default:
                    break;
            }
        });
        dropmenu.appendChild(button);
    });
    return dropmenu;
}

function showCanvasDropdown(event, dropmenu, containerWrapper) {
    containerWrapper.appendChild(dropmenu);
    dropmenu.style.display = "block";
    
    dropmenu.style.top = event.clientY - 40 + "px";
    dropmenu.style.left = event.clientX + "px";
}

/* NODES----------------------------------------------------------------------------------------------------------------*/

// 기본 노드 틀 만들기
function createNode(nodeName){
    const node = document.createElement("div");
    node.classList.add(nodeName);

    const topLabel = document.createElement("div"); // 맨 위에 들어가는 검은 라벨
    topLabel.classList.add("nodeToplabel");

    const label = document.createElement("label");
    label.textContent = nodeName;
    label.style.height = 20+"px";
    label.style.width = 80 + "%";
    label.style.color = "white";

    const radio = document.createElement("input");
    radio.type = "radio";
    radio.style.width = 20+"%";
    radio.style.height = 20+"px";
    radio.style.backgroundColor = "black";

    topLabel.appendChild(label);
    topLabel.appendChild(radio);
    node.appendChild(topLabel);

    return node;
}

// vec3 노드
function createNode_vec3(containerWrapper){
     const node = createNode("vec3");
     
     const options = ["X :", "Y :", "Z :"];
     options.forEach((option, index) => {
         const nodeItem = document.createElement("div");
         nodeItem.classList.add("node-item");
 
         const radioInput = document.createElement("input");
         radioInput.type = "radio";
         radioInput.id = `radio${index + 1}`;
         radioInput.name = `radio-group-${Date.now()}`; // 고유한 그룹명 부여
 
         const radioLabel = document.createElement("label");
         //radioLabel.htmlFor = radioInput.id;
         radioLabel.textContent = option;

         const vec3Input = document.createElement("textarea");
         vec3Input.style.height = 20+"px";
         vec3Input.style.width = 70+"px";
         
         nodeItem.appendChild(radioLabel);
         nodeItem.appendChild(vec3Input);
         nodeItem.appendChild(radioInput);
         node.appendChild(nodeItem);

         makeDraggable(node);

         containerWrapper.appendChild(node);
        }
    );
}

function createNode_object(containerWrapper){
    const node = createNode("object");
    
    const options = [];

    makeDraggable(node);
    containerWrapper.appendChild(node);

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