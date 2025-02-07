document.addEventListener("DOMContentLoaded", function () {
  const button = document.getElementById("create-container");
  const containerWrapper = document.getElementById("container-wrapper");

  if (!button || !containerWrapper) {
      console.error("필수 요소가 존재하지 않습니다.");
      return;
  }

  button.addEventListener("click", function () {
      // 라디오 버튼 컨테이너 생성
      const node = document.createElement("div");
      node.classList.add("node");

      // 라디오 버튼 목록 생성
      const options = ["옵션 1", "옵션 2", "옵션 3"];
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
      });

      // 드래그 기능 추가
      makeDraggable(node);

      // 컨테이너 추가
      containerWrapper.appendChild(node);
  });

  function makeDraggable(element) {
      let isDragging = false;
      let offsetX = 0, offsetY = 0;

      element.style.position = "absolute"; // 드래그 가능하도록 설정

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
});
