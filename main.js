"use strict";

import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { ARButton } from 'three/addons/webxr/ARButton.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import CannonDebugger from 'cannon-es-debugger';

let container, camera, scene, renderer, controller, reticle, hitTestSource = null, hitTestSourceRequested = false;
let stats, movementPlane, clickMarker, raycaster, cubeMesh, sphereMesh;
let world, jointBody, jointConstraint, cubeBody, sphereBody, groundBody;
let cannonDebugger;
const meshes = [], bodies = [];
let pose_count = 0;

init();
initCannon();
animate();

function init() {
    container = document.createElement('div');
    document.body.appendChild(container);
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.01, 20);
    const light = new THREE.HemisphereLight(0xffffff, 0xbbbbff, 3);
    light.position.set(0.5, 1, 0.25);
    scene.add(light);
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.xr.enabled = true;
    container.appendChild(renderer.domElement);
    document.body.appendChild(ARButton.createButton(renderer, { requiredFeatures: ['hit-test'] }));

    function onSelect() {
        if (reticle.visible) {
            if (pose_count == 0) {
                function loadData() {
                    new GLTFLoader()
                        .setPath('assets/models/')
                        .load('cage.glb', gltfReader);
                }
                function gltfReader(gltf) {
                    let testModel = null;
                    testModel = gltf.scene;
                    if (testModel != null) {
                        console.log("Model loaded:  " + testModel);
                        reticle.matrix.decompose(gltf.scene.position, gltf.scene.quaternion, gltf.scene.scale);
                        gltf.scene.translateX(-0.55);
                        scene.add(gltf.scene);
                    } else {
                        console.log("Load FAILED.  ");
                    }
                }
                loadData();
                pose_count += 1;
            } else if (pose_count == 1) {
                const sphereGeometry = new THREE.SphereGeometry(0.3, 20, 20, 10, 10);
                const sphereMaterial = new THREE.MeshPhongMaterial({ color: 0xa1260c });
                sphereMesh = new THREE.Mesh(sphereGeometry, sphereMaterial);
                reticle.matrix.decompose(sphereMesh.position, sphereMesh.quaternion, sphereMesh.scale);
                meshes.push(sphereMesh);
                scene.add(sphereMesh);
                pose_count += 1;
            } else {
                console.log("oui");
                sphereBody.velocity.y = 15;
                sphereBody.velocity.x = 15;
            }
        }
    }
    controller = renderer.xr.getController(0);
    controller.addEventListener('select', onSelect);
    scene.add(controller);
    reticle = new THREE.Mesh(new THREE.RingGeometry(0.15, 0.2, 32).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial());
    reticle.matrixAutoUpdate = false;
    reticle.visible = false;
    scene.add(reticle);

    window.addEventListener('resize', onWindowResize);
}

function initCannon() {
    world = new CANNON.World();
    world.gravity.set(0, -10, 0);

    cannonDebugger = new CannonDebugger(scene, world);

    // Créer un sol
    const groundShape = new CANNON.Plane();
    groundBody = new CANNON.Body({ mass: 0 });
    groundBody.addShape(groundShape);
    world.addBody(groundBody);

    // Créer un corps pour la sphère
    const sphereShape = new CANNON.Sphere(0.5);
    sphereBody = new CANNON.Body({ mass: 5 });
    sphereBody.addShape(sphereShape);
    world.addBody(sphereBody);
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
    renderer.setAnimationLoop(render);
}

function render(timestamp, frame) {
    if (frame) {
        const referenceSpace = renderer.xr.getReferenceSpace();
        const session = renderer.xr.getSession();
        if (hitTestSourceRequested === false) {
            session.requestReferenceSpace('viewer').then(function (referenceSpace) {
                session.requestHitTestSource({ space: referenceSpace }).then(function (source) {
                    hitTestSource = source;
                });
            });
            session.addEventListener('end', function () {
                hitTestSourceRequested = false;
                hitTestSource = null;
            });
            hitTestSourceRequested = true;
        }
        if (hitTestSource) {
            const hitTestResults = frame.getHitTestResults(hitTestSource);
            if (hitTestResults.length) {
                const hit = hitTestResults[0];
                reticle.visible = true;
                reticle.matrix.fromArray(hit.getPose(referenceSpace).transform.matrix);
            } else {
                reticle.visible = false;
            }
        }
    }
    cannonDebugger.update();
    renderer.render(scene, camera);
}
