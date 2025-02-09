import LocomotiveScroll from 'locomotive-scroll';
import * as THREE from 'three';
import gsap from "gsap"
const locomotiveScroll = new LocomotiveScroll();

const scene = new THREE.Scene();
const cameraPos = 600;
const fov = 2 * Math.atan( (window.innerHeight / 2) / cameraPos ) * (180 / Math.PI);
const camera = new THREE.PerspectiveCamera(fov, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({
    canvas: document.querySelector('#canvas'),
    alpha: true
});

renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

const vertexShaderBasic = `
    varying vec2 vUv;
    void main() {
        vUv = uv;
        vec4 modelPosition = modelMatrix * vec4(position, 1.0);
        vec4 viewPosition = viewMatrix * modelPosition;
        vec4 projectedPosition = projectionMatrix * viewPosition;
        gl_Position = projectedPosition;
    }
`;

const fragmentShaderBasic = `
    uniform sampler2D uTexture;
    uniform vec2 uMouse;
    varying vec2 vUv;
    uniform float uHover;
    void main() {
        float blocks = 30.0;
        vec2 blockUv = floor(vUv*blocks) / blocks;
        vec2 mouse = uMouse;
        float distance = length(blockUv - mouse);
        float effect = smoothstep(0.4 , 0.0 , distance);
        vec2 distortion = vec2(0.03) * effect;
        vec4 textureColor = texture2D(uTexture, vUv + (distortion*uHover));
        gl_FragColor = textureColor;
    }
`;

const planes = [];
const imagesData = [];
const images = document.querySelectorAll("img");
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

images.forEach(item => {
    const imageBounds = item.getBoundingClientRect();
    imagesData.push(imageBounds);
    const texture = new THREE.TextureLoader().load(item.src);
    texture.needsUpdate = true;
    const material = new THREE.ShaderMaterial({
        vertexShader: vertexShaderBasic,
        fragmentShader: fragmentShaderBasic,
        uniforms: {
            uTexture: { value: texture },
            uMouse: { value: new THREE.Vector2(0.5, 0.5) },
            uHover: {value: 0}
        }
    }); 
    const geometry = new THREE.PlaneGeometry(imageBounds.width , imageBounds.height);
    const plane = new THREE.Mesh(geometry , material);
    plane.position.set(imageBounds.left - window.innerWidth / 2 + imageBounds.width / 2 , -imageBounds.top + window.innerHeight / 2 - imageBounds.height / 2 , 0);   
    planes.push(plane);
    scene.add(plane);
})
camera.position.z = cameraPos;

function updatePlanePosition(){
    planes.forEach((plane, index) => {
        const image = images[index];
        const imgBound = image.getBoundingClientRect();
        plane.position.set(
            imgBound.left - window.innerWidth / 2 + imgBound.width / 2,
            -imgBound.top + window.innerHeight / 2 - imgBound.height / 2,
            0
        );
    });  
}

function onMouseMove(event) {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(planes);
    
    // Reset all planes' hover state
    planes.forEach(plane => {
        plane.material.uniforms.uHover.value = 0;
    });
    
    if (intersects.length > 0) {
        const intersect = intersects[0];
        const plane = intersect.object;
        const material = plane.material;
        material.uniforms.uMouse.value = intersect.uv;
        material.uniforms.uHover.value = 1;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    updatePlanePosition();
});

document.addEventListener('mousemove', onMouseMove);

function animate() {
    requestAnimationFrame(animate);
    updatePlanePosition();
    renderer.render(scene, camera);
}

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

animate();
locomotiveScroll.on("scroll" , updatePlanePosition)
