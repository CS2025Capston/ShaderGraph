export function setupResizeAndDrag(leftCanvas, rightCanvas, divider, menuButtons) {
    let isDragging = false;

    function resizeCanvas() {
        leftCanvas.width = leftCanvas.clientWidth;
        leftCanvas.height = leftCanvas.clientHeight;
        rightCanvas.width = rightCanvas.clientWidth;
        rightCanvas.height = rightCanvas.clientHeight;
    }

    function startDragging() {
        isDragging = true;
        document.body.style.cursor = "ew-resize";
    }

    function stopDragging() {
        isDragging = false;
        document.body.style.cursor = "default";
    }

    function dragDivider(e) {
        if (!isDragging) return;

        let newLeftWidth = e.clientX;
        let newRightWidth = window.innerWidth - e.clientX - divider.offsetWidth;

        if (newLeftWidth < 100 || newRightWidth < 100) return;

        leftCanvas.style.flex = `0 0 ${newLeftWidth}px`;
        rightCanvas.style.flex = `0 0 ${newRightWidth}px`;

        resizeCanvas();
    }

    function toggleDropdown(event) {
        event.stopPropagation(); // 다른 곳 클릭 시 닫히지 않도록 방지

        const dropdown = event.target.nextElementSibling;

        // 모든 드롭다운을 닫음
        document.querySelectorAll(".dropdown").forEach(menu => {
            if (menu !== dropdown) {
                menu.style.display = "none";
            }
        });

        // 현재 버튼의 드롭다운만 토글
        dropdown.style.display = dropdown.style.display === "block" ? "none" : "block";
    }

    function closeDropdown(event) {
        if (!event.target.closest(".menu-item")) {
            document.querySelectorAll(".dropdown").forEach(menu => {
                menu.style.display = "none";
            });
        }
    }

    function clearCanvas(canvasId) {
        const canvas = document.getElementById(canvasId);
        const ctx = canvas.getContext("2d");
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    }

    // 각 메뉴 버튼에 이벤트 추가
    menuButtons.forEach(button => {
        button.addEventListener("click", toggleDropdown);
    });

    // 다른 곳 클릭하면 드롭다운 닫기
    document.addEventListener("click", closeDropdown);

    // 이벤트 리스너 등록
    divider.addEventListener("mousedown", startDragging);
    document.addEventListener("mousemove", dragDivider);
    document.addEventListener("mouseup", stopDragging);
    window.addEventListener("resize", resizeCanvas);

    // 초기 실행
    resizeCanvas();
}