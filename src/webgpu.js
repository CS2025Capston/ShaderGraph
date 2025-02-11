import GUI from 'https://webgpufundamentals.org/3rdparty/muigui-0.x.module.js';
import { mat3, mat4 } from 'https://webgpufundamentals.org/3rdparty/wgpu-matrix.module.js';

export async function initializeWebGPU(canvas) {
    function createFVertices() {
        const positions = [
            // left column
            -50,  75,  15,
            -20,  75,  15,
            -50, -75,  15,
            -20, -75,  15,

            // top rung
            -20,  75,  15,
            50,  75,  15,
            -20,  45,  15,
            50,  45,  15,

            // middle rung
            -20,  15,  15,
            20,  15,  15,
            -20, -15,  15,
            20, -15,  15,

            // left column back
            -50,  75, -15,
            -20,  75, -15,
            -50, -75, -15,
            -20, -75, -15,

            // top rung back
            -20,  75, -15,
            50,  75, -15,
            -20,  45, -15,
            50,  45, -15,

            // middle rung back
            -20,  15, -15,
            20,  15, -15,
            -20, -15, -15,
            20, -15, -15,
        ];

        const indices = [
            0,  2,  1,    2,  3,  1,   // left column
            4,  6,  5,    6,  7,  5,   // top run
            8, 10,  9,   10, 11,  9,   // middle run

            12, 13, 14,   14, 13, 15,   // left column back
            16, 17, 18,   18, 17, 19,   // top run back
            20, 21, 22,   22, 21, 23,   // middle run back

            0,  5, 12,   12,  5, 17,   // top
            5,  7, 17,   17,  7, 19,   // top rung right
            6, 18,  7,   18, 19,  7,   // top rung bottom
            6,  8, 18,   18,  8, 20,   // between top and middle rung
            8,  9, 20,   20,  9, 21,   // middle rung top
            9, 11, 21,   21, 11, 23,   // middle rung right
            10, 22, 11,   22, 23, 11,   // middle rung bottom
            10,  3, 22,   22,  3, 15,   // stem right
            2, 14,  3,   14, 15,  3,   // bottom
            0, 12,  2,   12, 14,  2,   // left
        ];

        const normals = [
                0,   0,   1,  // left column front
                0,   0,   1,  // top rung front
                0,   0,   1,  // middle rung front

                0,   0,  -1,  // left column back
                0,   0,  -1,  // top rung back
                0,   0,  -1,  // middle rung back

                0,   1,   0,  // top
                1,   0,   0,  // top rung right
                0,  -1,   0,  // top rung bottom
                1,   0,   0,  // between top and middle rung
                0,   1,   0,  // middle rung top
                1,   0,   0,  // middle rung right
                0,  -1,   0,  // middle rung bottom
                1,   0,   0,  // stem right
                0,  -1,   0,  // bottom
            -1,   0,   0,  // left
        ];

        const numVertices = indices.length;
        const vertexData = new Float32Array(numVertices * 6); // xyz + normal

        for (let i = 0; i < indices.length; ++i) {
            const positionNdx = indices[i] * 3;
            const position = positions.slice(positionNdx, positionNdx + 3);
            vertexData.set(position, i * 6);

            const quadNdx = (i / 6 | 0) * 3;
            const normal = normals.slice(quadNdx, quadNdx + 3);
            vertexData.set(normal, i * 6 + 3);
        }

        return {
            vertexData,
            numVertices,
        };
    }

    const adapter = await navigator.gpu?.requestAdapter();
    const device = await adapter?.requestDevice();
    if (!device) {
        fail('need a browser that supports WebGPU');
        return;
    }

    // Get a WebGPU context from the canvas and configure it
    const context = canvas.getContext('webgpu');
    const presentationFormat = navigator.gpu.getPreferredCanvasFormat();
    context.configure({
        device,
        format: presentationFormat,
        alphaMode: 'premultiplied',
    });

    const module = device.createShaderModule({
        code: `
        struct Uniforms {
            normalMatrix: mat3x3f,
            worldViewProjection: mat4x4f,
            world: mat4x4f,
            color: vec4f,
            lightPosition: vec3f,
        };

        struct Vertex {
            @location(0) position: vec4f,
            @location(1) normal: vec3f,
        };

        struct VSOutput {
            @builtin(position) position: vec4f,
            @location(0) normal: vec3f,
            @location(1) surfaceToLight: vec3f,
        };

        @group(0) @binding(0) var<uniform> uni: Uniforms;

        @vertex fn vs(vert: Vertex) -> VSOutput {
            var vsOut: VSOutput;
            vsOut.position = uni.worldViewProjection * vert.position;

            // Orient the normals and pass to the fragment shader
            vsOut.normal = uni.normalMatrix * vert.normal;

            // Compute the world position of the surface
            let surfaceWorldPosition = (uni.world * vert.position).xyz;

            // Compute the vector of the surface to the light
            // and pass it to the fragment shader
            vsOut.surfaceToLight = uni.lightPosition - surfaceWorldPosition;

            return vsOut;
        }

        @fragment fn fs(vsOut: VSOutput) -> @location(0) vec4f {
            // Because vsOut.normal is an inter-stage variable 
            // it's interpolated so it will not be a unit vector.
            // Normalizing it will make it a unit vector again
            let normal = normalize(vsOut.normal);

            let surfaceToLightDirection = normalize(vsOut.surfaceToLight);

            // Compute the light by taking the dot product
            // of the normal with the direction to the light
            let light = dot(normal, surfaceToLightDirection);

            // Lets multiply just the color portion (not the alpha)
            // by the light
            let color = uni.color.rgb * light;
            return vec4f(color, uni.color.a);
        }
        `,
    });

    const pipeline = device.createRenderPipeline({
        label: '2 attributes',
        layout: 'auto',
        vertex: {
        module,
        buffers: [
            {
            arrayStride: (3 + 3) * 4, // (3+3) floats 4 bytes each
            attributes: [
                {shaderLocation: 0, offset: 0, format: 'float32x3'},  // position
                {shaderLocation: 1, offset: 12, format: 'float32x3'},  // normal
            ],
            },
        ],
        },
        fragment: {
        module,
        targets: [{ format: presentationFormat }],
        },
        primitive: {
        cullMode: 'back',
        },
        depthStencil: {
        depthWriteEnabled: true,
        depthCompare: 'less',
        format: 'depth24plus',
        },
    });

    const uniformBufferSize = (12 + 16 + 16 + 4 + 4) * 4;
    const uniformBuffer = device.createBuffer({
        label: 'uniforms',
        size: uniformBufferSize,
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });

    const uniformValues = new Float32Array(uniformBufferSize / 4);

    // offsets to the various uniform values in float32 indices
    const kNormalMatrixOffset = 0;
    const kWorldViewProjectionOffset = 12;
    const kWorldOffset = 28;
    const kColorOffset = 44;
    const kLightPositionOffset = 48;

    const normalMatrixValue = uniformValues.subarray(
        kNormalMatrixOffset, kNormalMatrixOffset + 12);
    const worldViewProjectionValue = uniformValues.subarray(
        kWorldViewProjectionOffset, kWorldViewProjectionOffset + 16);
    const worldValue = uniformValues.subarray(
        kWorldOffset, kWorldOffset + 16);
    const colorValue = uniformValues.subarray(kColorOffset, kColorOffset + 4);
    const lightPositionValue =
        uniformValues.subarray(kLightPositionOffset, kLightPositionOffset + 3);

    const bindGroup = device.createBindGroup({
        label: 'bind group for object',
        layout: pipeline.getBindGroupLayout(0),
        entries: [
        { binding: 0, resource: { buffer: uniformBuffer }},
        ],
    });

    const { vertexData, numVertices } = createFVertices();
    const vertexBuffer = device.createBuffer({
        label: 'vertex buffer vertices',
        size: vertexData.byteLength,
        usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
    });
    device.queue.writeBuffer(vertexBuffer, 0, vertexData);

    const renderPassDescriptor = {
        label: 'our basic canvas renderPass',
        colorAttachments: [
        {
            // view: <- to be filled out when we render
            clearValue: [0.3, 0.3, 0.3, 1],
            loadOp: 'clear',
            storeOp: 'store',
        },
        ],
        depthStencilAttachment: {
        // view: <- to be filled out when we render
        depthClearValue: 1.0,
        depthLoadOp: 'clear',
        depthStoreOp: 'store',
        },
    };

    const degToRad = d => d * Math.PI / 180;

    const settings = {
        rotation: degToRad(0),
    };

    const radToDegOptions = { min: -360, max: 360, step: 1, converters: GUI.converters.radToDeg };

    const gui = new GUI();
    gui.onChange(render);
    gui.add(settings, 'rotation', radToDegOptions);

    // settings.rotation = degToRad(120);
    // console.log(settings.rotation);

    let depthTexture;

    function render() {
        // Get the current texture from the canvas context and
        // set it as the texture to render to.
        const canvasTexture = context.getCurrentTexture();
        renderPassDescriptor.colorAttachments[0].view = canvasTexture.createView();

        // If we don't have a depth texture OR if its size is different
        // from the canvasTexture when make a new depth texture
        if (!depthTexture ||
            depthTexture.width !== canvasTexture.width ||
            depthTexture.height !== canvasTexture.height) {
        if (depthTexture) {
            depthTexture.destroy();
        }
        depthTexture = device.createTexture({
            size: [canvasTexture.width, canvasTexture.height],
            format: 'depth24plus',
            usage: GPUTextureUsage.RENDER_ATTACHMENT,
        });
        }
        renderPassDescriptor.depthStencilAttachment.view = depthTexture.createView();

        const encoder = device.createCommandEncoder();
        const pass = encoder.beginRenderPass(renderPassDescriptor);
        pass.setPipeline(pipeline);
        pass.setVertexBuffer(0, vertexBuffer);

        const aspect = canvas.clientWidth / canvas.clientHeight;
        const projection = mat4.perspective(
            degToRad(60),
            aspect,
            1,      // zNear
            2000,   // zFar
        );

        const eye = [100, 150, 200];
        const target = [0, 35, 0];
        const up = [0, 1, 0];

        // Compute a view matrix
        const viewMatrix = mat4.lookAt(eye, target, up);

        // Combine the view and projection matrixes
        const viewProjectionMatrix = mat4.multiply(projection, viewMatrix);

        // Compute a world matrix
        const world = mat4.rotationY(settings.rotation, worldValue);

        // Combine the viewProjection and world matrices
        mat4.multiply(viewProjectionMatrix, world, worldViewProjectionValue);

        // Inverse and transpose it into the worldInverseTranspose value
        mat3.fromMat4(mat4.transpose(mat4.inverse(world)), normalMatrixValue);

        colorValue.set([0.2, 1, 0.2, 1]);  // green
        lightPositionValue.set([-10, 30, 100]);

        // upload the uniform values to the uniform buffer
        device.queue.writeBuffer(uniformBuffer, 0, uniformValues);

        pass.setBindGroup(0, bindGroup);
        pass.draw(numVertices);
        pass.end();

        const commandBuffer = encoder.finish();
        device.queue.submit([commandBuffer]);
    }
    
    render();
}




// const adapter = await navigator.gpu?.requestAdapter();
// const device = await adapter?.requestDevice();
// if (!device) {
//     fail('need a browser that supports WebGPU');
//     return;
// }

// // Get a WebGPU context from the canvas and configure it
// const context = canvas.getContext('webgpu');
// const presentationFormat = navigator.gpu.getPreferredCanvasFormat();
// context.configure({
//     device,
//     format: presentationFormat,
//     alphaMode: 'premultiplied',
// });

// const module = device.createShaderModule({
//     code: `
//     struct Uniforms {
//         normalMatrix: mat3x3f,
//         worldViewProjection: mat4x4f,
//         world: mat4x4f,
//         color: vec4f,
//         lightPosition: vec3f,
//     };

//     struct Vertex {
//         @location(0) position: vec4f,
//         @location(1) normal: vec3f,
//     };

//     struct VSOutput {
//         @builtin(position) position: vec4f,
//         @location(0) normal: vec3f,
//         @location(1) surfaceToLight: vec3f,
//     };

//     @group(0) @binding(0) var<uniform> uni: Uniforms;

//     @vertex fn vs(vert: Vertex) -> VSOutput {
//         var vsOut: VSOutput;
//         vsOut.position = uni.worldViewProjection * vert.position;

//         // Orient the normals and pass to the fragment shader
//         vsOut.normal = uni.normalMatrix * vert.normal;

//         // Compute the world position of the surface
//         let surfaceWorldPosition = (uni.world * vert.position).xyz;

//         // Compute the vector of the surface to the light
//         // and pass it to the fragment shader
//         vsOut.surfaceToLight = uni.lightPosition - surfaceWorldPosition;

//         return vsOut;
//     }

//     @fragment fn fs(vsOut: VSOutput) -> @location(0) vec4f {
//         // Because vsOut.normal is an inter-stage variable 
//         // it's interpolated so it will not be a unit vector.
//         // Normalizing it will make it a unit vector again
//         let normal = normalize(vsOut.normal);

//         let surfaceToLightDirection = normalize(vsOut.surfaceToLight);

//         // Compute the light by taking the dot product
//         // of the normal with the direction to the light
//         let light = dot(normal, surfaceToLightDirection);

//         // Lets multiply just the color portion (not the alpha)
//         // by the light
//         let color = uni.color.rgb * light;
//         return vec4f(color, uni.color.a);
//     }
//     `,
// });

// const pipeline = device.createRenderPipeline({
//     label: '2 attributes',
//     layout: 'auto',
//     vertex: {
//     module,
//     buffers: [
//         {
//         arrayStride: (3 + 3) * 4, // (3+3) floats 4 bytes each
//         attributes: [
//             {shaderLocation: 0, offset: 0, format: 'float32x3'},  // position
//             {shaderLocation: 1, offset: 12, format: 'float32x3'},  // normal
//         ],
//         },
//     ],
//     },
//     fragment: {
//     module,
//     targets: [{ format: presentationFormat }],
//     },
//     primitive: {
//     cullMode: 'back',
//     },
//     depthStencil: {
//     depthWriteEnabled: true,
//     depthCompare: 'less',
//     format: 'depth24plus',
//     },
// });

// const uniformBufferSize = (12 + 16 + 16 + 4 + 4) * 4;
// const uniformBuffer = device.createBuffer({
//     label: 'uniforms',
//     size: uniformBufferSize,
//     usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
// });

// const uniformValues = new Float32Array(uniformBufferSize / 4);

// // offsets to the various uniform values in float32 indices
// const kNormalMatrixOffset = 0;
// const kWorldViewProjectionOffset = 12;
// const kWorldOffset = 28;
// const kColorOffset = 44;
// const kLightPositionOffset = 48;

// const normalMatrixValue = uniformValues.subarray(
//     kNormalMatrixOffset, kNormalMatrixOffset + 12);
// const worldViewProjectionValue = uniformValues.subarray(
//     kWorldViewProjectionOffset, kWorldViewProjectionOffset + 16);
// const worldValue = uniformValues.subarray(
//     kWorldOffset, kWorldOffset + 16);
// const colorValue = uniformValues.subarray(kColorOffset, kColorOffset + 4);
// const lightPositionValue =
//     uniformValues.subarray(kLightPositionOffset, kLightPositionOffset + 3);

// const bindGroup = device.createBindGroup({
//     label: 'bind group for object',
//     layout: pipeline.getBindGroupLayout(0),
//     entries: [
//     { binding: 0, resource: { buffer: uniformBuffer }},
//     ],
// });

// const { vertexData, numVertices } = createFVertices();
// const vertexBuffer = device.createBuffer({
//     label: 'vertex buffer vertices',
//     size: vertexData.byteLength,
//     usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
// });
// device.queue.writeBuffer(vertexBuffer, 0, vertexData);

// const renderPassDescriptor = {
//     label: 'our basic canvas renderPass',
//     colorAttachments: [
//     {
//         // view: <- to be filled out when we render
//         clearValue: [0.3, 0.3, 0.3, 1],
//         loadOp: 'clear',
//         storeOp: 'store',
//     },
//     ],
//     depthStencilAttachment: {
//     // view: <- to be filled out when we render
//     depthClearValue: 1.0,
//     depthLoadOp: 'clear',
//     depthStoreOp: 'store',
//     },
// };

// const degToRad = d => d * Math.PI / 180;

// const settings = {
//     rotation: degToRad(0),
// };

// // const radToDegOptions = { min: -360, max: 360, step: 1, converters: GUI.converters.radToDeg };

// // const gui = new GUI();
// // gui.onChange(render);
// // gui.add(settings, 'rotation', radToDegOptions);

// settings.rotation = degToRad(120);
// console.log(settings.rotation);

// let depthTexture;

// function render() {
//     // Get the current texture from the canvas context and
//     // set it as the texture to render to.
//     const canvasTexture = context.getCurrentTexture();
//     renderPassDescriptor.colorAttachments[0].view = canvasTexture.createView();

//     // If we don't have a depth texture OR if its size is different
//     // from the canvasTexture when make a new depth texture
//     if (!depthTexture ||
//         depthTexture.width !== canvasTexture.width ||
//         depthTexture.height !== canvasTexture.height) {
//     if (depthTexture) {
//         depthTexture.destroy();
//     }
//     depthTexture = device.createTexture({
//         size: [canvasTexture.width, canvasTexture.height],
//         format: 'depth24plus',
//         usage: GPUTextureUsage.RENDER_ATTACHMENT,
//     });
//     }
//     renderPassDescriptor.depthStencilAttachment.view = depthTexture.createView();

//     const encoder = device.createCommandEncoder();
//     const pass = encoder.beginRenderPass(renderPassDescriptor);
//     pass.setPipeline(pipeline);
//     pass.setVertexBuffer(0, vertexBuffer);

//     const aspect = canvas.clientWidth / canvas.clientHeight;
//     const projection = mat4.perspective(
//         degToRad(60),
//         aspect,
//         1,      // zNear
//         2000,   // zFar
//     );

//     const eye = [100, 150, 200];
//     const target = [0, 35, 0];
//     const up = [0, 1, 0];

//     // Compute a view matrix
//     const viewMatrix = mat4.lookAt(eye, target, up);

//     // Combine the view and projection matrixes
//     const viewProjectionMatrix = mat4.multiply(projection, viewMatrix);

//     // Compute a world matrix
//     const world = mat4.rotationY(settings.rotation, worldValue);

//     // Combine the viewProjection and world matrices
//     mat4.multiply(viewProjectionMatrix, world, worldViewProjectionValue);

//     // Inverse and transpose it into the worldInverseTranspose value
//     mat3.fromMat4(mat4.transpose(mat4.inverse(world)), normalMatrixValue);

//     colorValue.set([0.2, 1, 0.2, 1]);  // green
//     lightPositionValue.set([-10, 30, 100]);

//     // upload the uniform values to the uniform buffer
//     device.queue.writeBuffer(uniformBuffer, 0, uniformValues);

//     pass.setBindGroup(0, bindGroup);
//     pass.draw(numVertices);
//     pass.end();

//     const commandBuffer = encoder.finish();
//     device.queue.submit([commandBuffer]);
// }

// render();

// export class webgpuInstance {
//     constructor(canvas) 
//     {
//         this.canvas = canvas;
//     }

//     createFVertices() {
//         const positions = [
//             // left column
//             -50,  75,  15,
//             -20,  75,  15,
//             -50, -75,  15,
//             -20, -75,  15,

//             // top rung
//             -20,  75,  15,
//             50,  75,  15,
//             -20,  45,  15,
//             50,  45,  15,

//             // middle rung
//             -20,  15,  15,
//             20,  15,  15,
//             -20, -15,  15,
//             20, -15,  15,

//             // left column back
//             -50,  75, -15,
//             -20,  75, -15,
//             -50, -75, -15,
//             -20, -75, -15,

//             // top rung back
//             -20,  75, -15,
//             50,  75, -15,
//             -20,  45, -15,
//             50,  45, -15,

//             // middle rung back
//             -20,  15, -15,
//             20,  15, -15,
//             -20, -15, -15,
//             20, -15, -15,
//         ];

//         const indices = [
//             0,  2,  1,    2,  3,  1,   // left column
//             4,  6,  5,    6,  7,  5,   // top run
//             8, 10,  9,   10, 11,  9,   // middle run

//             12, 13, 14,   14, 13, 15,   // left column back
//             16, 17, 18,   18, 17, 19,   // top run back
//             20, 21, 22,   22, 21, 23,   // middle run back

//             0,  5, 12,   12,  5, 17,   // top
//             5,  7, 17,   17,  7, 19,   // top rung right
//             6, 18,  7,   18, 19,  7,   // top rung bottom
//             6,  8, 18,   18,  8, 20,   // between top and middle rung
//             8,  9, 20,   20,  9, 21,   // middle rung top
//             9, 11, 21,   21, 11, 23,   // middle rung right
//             10, 22, 11,   22, 23, 11,   // middle rung bottom
//             10,  3, 22,   22,  3, 15,   // stem right
//             2, 14,  3,   14, 15,  3,   // bottom
//             0, 12,  2,   12, 14,  2,   // left
//         ];

//         const normals = [
//                 0,   0,   1,  // left column front
//                 0,   0,   1,  // top rung front
//                 0,   0,   1,  // middle rung front

//                 0,   0,  -1,  // left column back
//                 0,   0,  -1,  // top rung back
//                 0,   0,  -1,  // middle rung back

//                 0,   1,   0,  // top
//                 1,   0,   0,  // top rung right
//                 0,  -1,   0,  // top rung bottom
//                 1,   0,   0,  // between top and middle rung
//                 0,   1,   0,  // middle rung top
//                 1,   0,   0,  // middle rung right
//                 0,  -1,   0,  // middle rung bottom
//                 1,   0,   0,  // stem right
//                 0,  -1,   0,  // bottom
//             -1,   0,   0,  // left
//         ];

//         const numVertices = indices.length;
//         const vertexData = new Float32Array(numVertices * 6); // xyz + normal

//         for (let i = 0; i < indices.length; ++i) {
//             const positionNdx = indices[i] * 3;
//             const position = positions.slice(positionNdx, positionNdx + 3);
//             vertexData.set(position, i * 6);

//             const quadNdx = (i / 6 | 0) * 3;
//             const normal = normals.slice(quadNdx, quadNdx + 3);
//             vertexData.set(normal, i * 6 + 3);
//         }

//         return {
//             vertexData,
//             numVertices,
//         };
//     }
// }