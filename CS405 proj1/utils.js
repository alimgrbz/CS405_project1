function multiplyMatrices(matrixA, matrixB) {
    var result = [];

    for (var i = 0; i < 4; i++) {
        result[i] = [];
        for (var j = 0; j < 4; j++) {
            var sum = 0;
            for (var k = 0; k < 4; k++) {
                sum += matrixA[i * 4 + k] * matrixB[k * 4 + j];
            }
            result[i][j] = sum;
        }
    }

    // Flatten the result array
    return result.reduce((a, b) => a.concat(b), []);
}
function createIdentityMatrix() {
    return new Float32Array([
        1, 0, 0, 0,
        0, 1, 0, 0,
        0, 0, 1, 0,
        0, 0, 0, 1
    ]);
}
function createScaleMatrix(scale_x, scale_y, scale_z) {
    return new Float32Array([
        scale_x, 0, 0, 0,
        0, scale_y, 0, 0,
        0, 0, scale_z, 0,
        0, 0, 0, 1
    ]);
}

function createTranslationMatrix(x_amount, y_amount, z_amount) {
    return new Float32Array([
        1, 0, 0, x_amount,
        0, 1, 0, y_amount,
        0, 0, 1, z_amount,
        0, 0, 0, 1
    ]);
}

function createRotationMatrix_Z(radian) {
    return new Float32Array([
        Math.cos(radian), -Math.sin(radian), 0, 0,
        Math.sin(radian), Math.cos(radian), 0, 0,
        0, 0, 1, 0,
        0, 0, 0, 1
    ])
}

function createRotationMatrix_X(radian) {
    return new Float32Array([
        1, 0, 0, 0,
        0, Math.cos(radian), -Math.sin(radian), 0,
        0, Math.sin(radian), Math.cos(radian), 0,
        0, 0, 0, 1
    ])
}

function createRotationMatrix_Y(radian) {
    return new Float32Array([
        Math.cos(radian), 0, Math.sin(radian), 0,
        0, 1, 0, 0,
        -Math.sin(radian), 0, Math.cos(radian), 0,
        0, 0, 0, 1
    ])
}

function getTransposeMatrix(matrix) {
    return new Float32Array([
        matrix[0], matrix[4], matrix[8], matrix[12],
        matrix[1], matrix[5], matrix[9], matrix[13],
        matrix[2], matrix[6], matrix[10], matrix[14],
        matrix[3], matrix[7], matrix[11], matrix[15]
    ]);
}

const vertexShaderSource = `
attribute vec3 position;
attribute vec3 normal; // Normal vector for lighting

uniform mat4 modelViewMatrix;
uniform mat4 projectionMatrix;
uniform mat4 normalMatrix;

uniform vec3 lightDirection;

varying vec3 vNormal;
varying vec3 vLightDirection;

void main() {
    vNormal = vec3(normalMatrix * vec4(normal, 0.0));
    vLightDirection = lightDirection;

    gl_Position = vec4(position, 1.0) * projectionMatrix * modelViewMatrix; 
}

`

const fragmentShaderSource = `
precision mediump float;

uniform vec3 ambientColor;
uniform vec3 diffuseColor;
uniform vec3 specularColor;
uniform float shininess;

varying vec3 vNormal;
varying vec3 vLightDirection;

void main() {
    vec3 normal = normalize(vNormal);
    vec3 lightDir = normalize(vLightDirection);
    
    // Ambient component
    vec3 ambient = ambientColor;

    // Diffuse component
    float diff = max(dot(normal, lightDir), 0.0);
    vec3 diffuse = diff * diffuseColor;

    // Specular component (view-dependent)
    vec3 viewDir = vec3(0.0, 0.0, 1.0); // Assuming the view direction is along the z-axis
    vec3 reflectDir = reflect(-lightDir, normal);
    float spec = pow(max(dot(viewDir, reflectDir), 0.0), shininess);
    vec3 specular = spec * specularColor;

    gl_FragColor = vec4(ambient + diffuse + specular, 1.0);
}

`

/**
 * @WARNING DO NOT CHANGE ANYTHING ABOVE THIS LINE
 */



/**
 * 
 * @TASK1 Calculate the model view matrix by using the chatGPT
 */
function GetChatGPTModelViewMatrix(){
    const transformationMatrix = new Float32Array([
        0.25, 0.38729833, 0.55901699, 0.3,
        -0.125, 0.61237244, -0.61237244, -0.25,
        -0.4330127, -0.5, 0.75, 0,
        0, 0, 0, 1
    ]);
    return getTransposeMatrix(transformationMatrix)
}


/**
 * 
 * @TASK2 Calculate the model view matrix by using the given 
 * transformation methods and required transformation parameters
 * stated in transformation-prompt.txt
 */
function getModelViewMatrix() {
    let modelViewMatrix = createIdentityMatrix();

    const translationMatrix = createTranslationMatrix(0.3, -0.25, 0); // Apply translation
    const rotationXMatrix = createRotationMatrix_X(Math.PI / 3); // Apply rotation around X-axis
    const rotationYMatrix = createRotationMatrix_Y(-Math.PI / 6); // Apply rotation around Y-axis
    const scaleMatrix = createScaleMatrix(0.5, 0.5, 0.5); // Apply scaling

    // Combine the transformations
    modelViewMatrix = multiplyMatrices(modelViewMatrix, translationMatrix);
    modelViewMatrix = multiplyMatrices(modelViewMatrix, rotationXMatrix);
    modelViewMatrix = multiplyMatrices(modelViewMatrix, rotationYMatrix);
    modelViewMatrix = multiplyMatrices(modelViewMatrix, scaleMatrix);

    return modelViewMatrix;
}


/**
 * 
 * @TASK3 Ask CHAT-GPT to animate the transformation calculated in 
 * task2 infinitely with a period of 10 seconds. 
 * First 5 seconds, the cube should transform from its initial 
 * position to the target position.
 * The next 5 seconds, the cube should return to its initial position.
 */
function getPeriodicMovement(startTime) {
    const period = 10; // Total period in seconds
    const halfPeriod = period / 2; // Half period in seconds

    return (currentTime) => {
        // Calculate the time elapsed since the animation started
        const elapsedTime = (currentTime - startTime) % period;

        // If within the first 5 seconds, interpolate from initial to target position
        if (elapsedTime <= halfPeriod) {
            const t = elapsedTime / halfPeriod; // Interpolation factor (0 to 1)
            
            // Interpolate translation
            const translationX = 0.3 * t;
            const translationY = -0.25 * t;
            
            // Interpolate scaling
            const scaleX = 0.5 + 0.5 * t;
            const scaleY = 0.5 + 0.5 * t;
            
            // Interpolate rotation
            const rotationX = (30 * t) * (Math.PI / 180); // Convert degrees to radians
            const rotationY = (45 * t) * (Math.PI / 180);
            const rotationZ = (60 * t) * (Math.PI / 180);

            // Create transformation matrices
            const translationMatrix = new Float32Array([
                1, 0, 0, translationX,
                0, 1, 0, translationY,
                0, 0, 1, 0,
                0, 0, 0, 1
            ]);

            const scalingMatrix = new Float32Array([
                scaleX, 0, 0, 0,
                0, scaleY, 0, 0,
                0, 0, 1, 0,
                0, 0, 0, 1
            ]);

            const rotationMatrixX = new Float32Array([
                1, 0, 0, 0,
                0, Math.cos(rotationX), -Math.sin(rotationX), 0,
                0, Math.sin(rotationX), Math.cos(rotationX), 0,
                0, 0, 0, 1
            ]);

            const rotationMatrixY = new Float32Array([
                Math.cos(rotationY), 0, Math.sin(rotationY), 0,
                0, 1, 0, 0,
                -Math.sin(rotationY), 0, Math.cos(rotationY), 0,
                0, 0, 0, 1
            ]);

            const rotationMatrixZ = new Float32Array([
                Math.cos(rotationZ), -Math.sin(rotationZ), 0, 0,
                Math.sin(rotationZ), Math.cos(rotationZ), 0, 0,
                0, 0, 1, 0,
                0, 0, 0, 1
            ]);

            // Combine the matrices in the specified order
            const tempMatrix = new Float32Array(16);

            multiplyMatrices(translationMatrix, scalingMatrix, tempMatrix);
            multiplyMatrices(tempMatrix, rotationMatrixX, tempMatrix);
            multiplyMatrices(tempMatrix, rotationMatrixY, tempMatrix);
            multiplyMatrices(tempMatrix, rotationMatrixZ, tempMatrix);

            return new Float32Array(tempMatrix);
        } else {
            // If within the next 5 seconds, reverse the transformation
            const t = (elapsedTime - halfPeriod) / halfPeriod; // Interpolation factor (0 to 1)
            
            // Interpolate translation, scaling, and rotation in reverse order
            const translationX = 0.3 - 0.3 * t;
            const translationY = -0.25 + 0.25 * t;
            
            const scaleX = 1 - 0.5 * t;
            const scaleY = 1 - 0.5 * t;
            
            const rotationX = (30 - 30 * t) * (Math.PI / 180); // Convert degrees to radians
            const rotationY = (45 - 45 * t) * (Math.PI / 180);
            const rotationZ = (60 - 60 * t) * (Math.PI / 180);

            // Create transformation matrices
            const translationMatrix = new Float32Array([
                1, 0, 0, translationX,
                0, 1, 0, translationY,
                0, 0, 1, 0,
                0, 0, 0, 1
            ]);

            const scalingMatrix = new Float32Array([
                scaleX, 0, 0, 0,
                0, scaleY, 0, 0,
                0, 0, 1, 0,
                0, 0, 0, 1
            ]);

            const rotationMatrixX = new Float32Array([
                1, 0, 0, 0,
                0, Math.cos(rotationX), -Math.sin(rotationX), 0,
                0, Math.sin(rotationX), Math.cos(rotationX), 0,
                0, 0, 0, 1
            ]);

            const rotationMatrixY = new Float32Array([
                Math.cos(rotationY), 0, Math.sin(rotationY), 0,
                0, 1, 0, 0,
                -Math.sin(rotationY), 0, Math.cos(rotationY), 0,
                0, 0, 0, 1
            ]);

            const rotationMatrixZ = new Float32Array([
                Math.cos(rotationZ), -Math.sin(rotationZ), 0, 0,
                Math.sin(rotationZ), Math.cos(rotationZ), 0, 0,
                0, 0, 1, 0,
                0, 0, 0, 1
            ]);

            // Combine the matrices in the specified order
            const tempMatrix = new Float32Array(16);

            multiplyMatrices(rotationMatrixZ, rotationMatrixY, tempMatrix);
            multiplyMatrices(tempMatrix, rotationMatrixX, tempMatrix);
            multiplyMatrices(tempMatrix, scalingMatrix, tempMatrix);
            multiplyMatrices(tempMatrix, translationMatrix, tempMatrix);

            return new Float32Array(tempMatrix);
        }
    };
}

// Example usage:
const startTime = performance.now();
const animate = getPeriodicMovement(startTime);

function animateCube() {
    const currentTime = performance.now();
    const transformationMatrix = animate(currentTime);
    
    // Apply the transformationMatrix to the cube or use it in your rendering engine.
    console.log(transformationMatrix);

    // Request the next frame
    requestAnimationFrame(animateCube);
}

animateCube();


