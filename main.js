"use strict";

import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { ARButton } from 'three/addons/webxr/ARButton.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import CannonDebugger from 'cannon-es-debugger';
import { threeToCannon, ShapeType } from 'three-to-cannon';

let container, camera, scene, renderer, controller, reticle, hitTestSource = null, hitTestSourceRequested = false;
let stats, movementPlane, clickMarker, raycaster, cubeMesh, sphereMesh;
let world, jointBody, jointConstraint, cubeBody, sphereBody, groundBody;
let cannonDebugger;
const meshes = [], bodies = [], shapes = [];
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
        if (pose_count == 2) {
            console.log("oui");

            camera.updateMatrixWorld();
            let point1 = camera.position.clone();
            let point2 = sphereMesh.position;

            // Calcul du vecteur entre les deux points
            const myVector = {
                x: point2.x - point1.x,
                y: point2.y - point1.y,
                z: point2.z - point1.z
            };

            sphereBody.velocity.y = 7;
            // sphereBody.velocity.z = -7;
            sphereBody.velocity.x = myVector.x;
            sphereBody.velocity.z = myVector.z;


            // camera.updateMatrixWorld();
            // let vector = camera.position.clone();
            // console.log(vector);
            // console.log(sphereMesh.position);
        }

        if (reticle.visible) {
            if (pose_count == 0) {
                // function loadData() {
                //     new GLTFLoader()
                //         .setPath('assets/models/')
                //         .load('cage.glb', gltfReader);
                // }
                // function gltfReader(gltf) {
                // let testModel = null;
                // testModel = gltf.scene;
                // if (testModel != null) {
                //     console.log("Model loaded:  " + testModel);
                //     // reticle.matrix.decompose(gltf.scene.position, gltf.scene.quaternion, gltf.scene.scale);
                //     // gltf.scene.translateX(-0.55);

                //     // Décomposer la matrice de reticle pour obtenir la position et l'orientation
                //     const position = new THREE.Vector3();
                //     const quaternion = new THREE.Quaternion();
                //     reticle.matrix.decompose(position, quaternion, new THREE.Vector3());
                //     // const origine = reticle.matrix;

                //     // Appliquer la position et l'orientation à la cage
                //     gltf.scene.position.copy(position);
                //     gltf.scene.quaternion.copy(quaternion);

                //     gltf.scene.translateX(-0.55);
                //     const axesHelper = new THREE.AxesHelper(5);
                //     // testModel.add( axesHelper );

                //     scene.add(gltf.scene);


                //     const floorShape = new CANNON.Box(new CANNON.Vec3(500, 500, 1))
                //     const floorBody = new CANNON.Body({ mass: 0 })
                //     floorBody.addShape(floorShape)
                //     floorBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0)
                //     world.addBody(floorBody)
                //     floorBody.position.set(0, -2.5, 0)

                //     // Créer des boîtes Cannon à l'emplacement de la cage
                //     const boxShape = new CANNON.Box(new CANNON.Vec3(0.1, 1.3, 0.1));
                //     const boxBody = new CANNON.Body({ mass: 0 });
                //     boxBody.addShape(boxShape);
                //     boxBody.position.copy(position);
                //     boxBody.quaternion.copy(quaternion);

                //     boxBody.position.y += 1.2;
                //     boxBody.position.x += -0.5;
                //     world.addBody(boxBody);
                //     world.scene.add(axesHelper);


                //     const boxShape2 = new CANNON.Box(new CANNON.Vec3(0.1, 1.3, 0.1));
                //     const boxBody2 = new CANNON.Body({ mass: 0 });
                //     boxBody2.addShape(boxShape2);
                //     boxBody2.position.copy(position);
                //     boxBody2.quaternion.copy(quaternion);

                //     // boxBody2.position.y += 1.2;
                //     // boxBody2.position.x += 0.5;
                //     world.addBody(boxBody2);

                //     const boxShape3 = new CANNON.Box(new CANNON.Vec3(0.5, 0.1, 0.1));
                //     const boxBody3 = new CANNON.Body({ mass: 0 });
                //     boxBody3.addShape(boxShape3);
                //     boxBody3.position.copy(position);
                //     boxBody3.position.y += 0.885;
                //     boxBody3.quaternion.copy(quaternion);
                //     world.addBody(boxBody3);

                // } else {
                //     console.log("Load FAILED.  ");
                // }
                // }
                // loadData();

                // Sol
                const floorShape = new CANNON.Box(new CANNON.Vec3(500, 500, 1))
                const floorBody = new CANNON.Body({ mass: 0 })
                floorBody.addShape(floorShape)
                floorBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0)
                world.addBody(floorBody)
                floorBody.position.set(0, -2.5, 0)

                let box = new BoxShape(0.2, 2.5, 0.2)
                shapes.push(box)

                let box2 = new BoxShape(0.2, 2.5, 0.2)
                shapes.push(box2)


                let box3 = new BoxShape(1, 0.2, 0.2)
                shapes.push(box3)

                const position = new THREE.Vector3();
                const quaternion = new THREE.Quaternion();
                reticle.matrix.decompose(position, quaternion, new THREE.Vector3());

                box.setPosition(position.x - 0.6, position.y + 1.3, position.z);
                box.setQuaternion(quaternion.x, quaternion.y, quaternion.z, quaternion.w);

                box2.setPosition(position.x + 0.6, position.y + 1.3, position.z);
                box2.setQuaternion(quaternion.x, quaternion.y, quaternion.z, quaternion.w);

                box3.setPosition(position.x, position.y + 0.885, position.z);
                box3.setQuaternion(quaternion.x, quaternion.y, quaternion.z, quaternion.w);

                pose_count += 1;
            } else if (pose_count == 1) {
                console.log("balle");

                const sphereGeometry = new THREE.SphereGeometry(0.3, 20, 20, 10, 10);
                const sphereMaterial = new THREE.MeshPhongMaterial({ color: 0xa1260c });
                sphereMesh = new THREE.Mesh(sphereGeometry, sphereMaterial);

                meshes.push(sphereMesh);
                scene.add(sphereMesh);

                // Créer un corps pour la sphère
                const sphereShape = new CANNON.Sphere(0.3);
                sphereBody = new CANNON.Body({ mass: 5 });
                sphereBody.addShape(sphereShape);

                const tmp_quat = new THREE.Quaternion();
                const tmp_pos = new THREE.Vector3();
                const tmp_scale = new THREE.Vector3();
                reticle.matrix.decompose(tmp_pos, tmp_quat, tmp_scale);
                sphereBody.position.copy(tmp_pos);
                sphereBody.quaternion.copy(tmp_quat);

                // reticle.matrix.decompose(sphereBody.position, sphereBody.quaternion, sphereBody.scale);
                bodies.push(sphereBody);
                world.addBody(sphereBody);



                pose_count += 1;
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
    // Step the physics world
    world.fixedStep()

    // Sync the three.js meshes with the bodies
    for (let i = 0; i !== meshes.length; i++) {
        meshes[i].position.copy(bodies[i].position)
        meshes[i].quaternion.copy(bodies[i].quaternion)
    }

    for (let i = 0; i !== shapes.length; i++) {
        shapes[i].update();

    }

    cannonDebugger.update();
    renderer.render(scene, camera);

    // camera.updateMatrixWorld();
    // let vector = camera.position.clone();
    // // vector.applyMatrix(camera.matrixWorld);
    // console.log(camera);
}

//TODO: define world, scene globally
class BoxShape {

    constructor(w, h, d) {

        this.body;
        this.mesh;

        // Physics
        const halfExtents = new CANNON.Vec3(w * 0.5, h * 0.5, d * 0.5);
        const shape = new CANNON.Box(halfExtents);
        this.body = new CANNON.Body({ mass: 0 });
        this.body.addShape(shape);

        world.addBody(this.body);
        //bodies.push(body);


        // Graphics
        const geometry = new THREE.BoxGeometry(w, h, d);
        const material = new THREE.MeshPhongMaterial({ color: 0xffffff });
        this.mesh = new THREE.Mesh(geometry, material);
        // position and quaternion of the mesh are set by updateMeshPositions...
        this.mesh.castShadow = true;
        this.mesh.receiveShadow = true;

        scene.add(this.mesh);
        //meshes.push(mesh);

    }

    update() {
        // copy Physics to Graphics
        this.mesh.position.copy(this.body.position);
        this.mesh.quaternion.copy(this.body.quaternion);
    }

    setPosition(x, y, z) {
        this.body.position.set(x, y, z);
        this.update();
    }

    setQuaternion(qx, qy, qz, qw) {
        this.body.quaternion.set(qx, qy, qz, qw);
        this.update();
    }

    setEuler(x_rad, y_rad, z_rad) {
        this.body.quaternion.setFromEuler(x, y, z);
        this.update();
    }

};



// TODO

// init

// let box = new BoxShape(...)
// shapes.add(box)

// loop

// Sync the three.js meshes with the bodies
// for (let i = 0; i !== shapes.length; i++) {
//     shapes[i].update();

// }

// const position = new THREE.Vector3();
// const quaternion = new THREE.Quaternion();
// reticle.matrix.decompose(position, quaternion, new THREE.Vector3());
// shape.setPosition(position.x, position.y, position.z);
// shape.setQuaternion(quaternion.x, quaternion.y, quaternion.z, quaternion.w);

