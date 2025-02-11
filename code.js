import { setupResizeAndDrag } from "./src/resizeCanvas.js";
import { initializeWebGPU } from "./src/webgpu.js";
import { createGraph } from "./src/shaderGraph.js";
import { importObj } from "./src/objList.js";

async function main() {
    const leftCanvas = document.getElementById("left-container");
    const rightCanvas = document.getElementById("right-canvas");
    const divider = document.getElementById("divider");
    const menuButtons = document.querySelectorAll(".menu-button");

    leftCanvas.style.flex = "50%";
    rightCanvas.style.flex = "50%";
    setupResizeAndDrag(leftCanvas, rightCanvas, divider, menuButtons);

    initializeWebGPU(rightCanvas);

    const importButton = document.getElementById("import-button");
    importObj(importButton);

    const button = document.getElementById("create-container");
    const containerWrapper = document.getElementById("container-wrapper");
    
    createGraph(button, containerWrapper);
}

document.addEventListener("DOMContentLoaded", main);
