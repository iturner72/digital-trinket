import { useEffect, useState, useRef } from 'react';
import * as THREE from 'three';
import { GUI } from 'dat.gui';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js';
import SceneInit from './lib/SceneInit';
import modelPath from '../assets/trinket/digital_trinket_draco.glb';


function App() {
    const [resetFunc, setResetFunc] = useState(false);
    const loadedTrinketRef = useRef(null);
    const customAxesRef = useRef(null);
    
    // Reset Trinket
    function resetTrinket(){
        if (loadedTrinketRef.current) {
            console.log("Before reset:", loadedTrinketRef.current.scene.quaternion);
            loadedTrinketRef.current.scene.setRotationFromQuaternion(new THREE.Quaternion());
            console.log("After reset:", loadedTrinketRef.current.scene.quaternion);
        }
    }


    useEffect(() => {
        console.log("useEffect triggered");
        let customAxes;
        let targetQuaternion = new THREE.Quaternion();
        let transitioning = false;

        const test = new SceneInit('myThreeJsCanvas');
        test.initialize();
        test.animate();
        
         // Declare variables for color, metalness, and roughness
        let trinketColor = '#33553d';
        let trinketMetalness = 3.1;
        let trinketRoughness = 0.1;
    
        // Create GUI object
        const gui = new GUI();
    
        // Add color variable to GUI
        gui.addColor({ trinketColor }, 'trinketColor').onChange((value) => {
          trinketColor = value;
          updateMaterial();
        });
        // Add metalness variable to GUI
        gui.add({ trinketMetalness }, 'trinketMetalness', 0, 5).onChange((value) => {
          trinketMetalness = value;
          updateMaterial();
        });
        // Add roughness variable to GUI
        gui.add({ trinketRoughness }, 'trinketRoughness', 0, 1).onChange((value) => {
          trinketRoughness = value;
          updateMaterial();
        });       
        
        // Create a mapping of keys to face index
        const keyToFaceMapping = {
            KeyI: 0,
        };

        // Get face indicies
        let currentFaceIndex = 0; 

        function getNextFaceIndex(currentIndex) {
            return (currentIndex + 1) % customAxes.length; // Cycle through the face indicies
        }

        function getQuaternionForFace(axis) {
            const quaternion = new THREE.Quaternion();
            quaternion.setFromAxisAngle(axis, 0) // Angle is zero because the axis itself represents the orientation
            return quaternion;
        }
        
        function updateMaterial() {
            console.log('Updating Material');
            const loadedTrinket = loadedTrinketRef.current;
          if (loadedTrinket) {
            // Access the mesh and change its material based on the variables
            loadedTrinket.scene.traverse(function (child) {
              if (child.isMesh) {
                child.material = new THREE.MeshStandardMaterial({
                  color: trinketColor,
                  roughness: trinketRoughness,
                  metalness: trinketMetalness,
                });
                  child.material.needsUpdate = true;
              }
            });
          }
        }
        
        // Define the golden ratio
        const phi = (1 + Math.sqrt(5)) /2;

        // Define vertices of a dodecahedron
        const vertices = [
            [1, 1, 1], [-1, 1, 1], [-1, -1, 1], [1, -1, 1],
            [0, 1/phi, phi], [0, -1/phi, phi], [0, 1/phi, -phi], [0, -1/phi, -phi],
            [1/phi, phi, 0], [-1/phi, phi, 0], [phi, 0, 1/phi], [-phi, 0, 1/phi],
            [phi, 0, -1/phi], [-phi, 0, -1/phi] [1/phi, -phi, 0], [-1/phi, -phi, 0]
        ];

        // Define faces of a dodecahedron
        const faces = [
            [0, 8, 4, 14, 12], [0, 12, 10, 2, 6], [0, 6, 7, 9, 8],
            [1, 3, 11, 10, 12], [1, 12, 14, 5, 13], [1, 13, 15, 7, 3],
            [2, 10, 11, 3, 7], [2, 7, 15, 13, 5], [2, 5, 14, 4, 6],
            [4, 8, 9, 1, 13], [4, 13, 5, 14, 12], [6, 2, 7, 9, 8]
        ];

        // Compute face normals and convert to quaternions
        const faceQuaternions = faces.map(face => {
            if (vertices[face[0]] && vertices[face[1]] && vertices[face[2]]) {
            const a = new THREE.Vector3(vertices[face[0]][0], vertices[face[0]][1], vertices[face[0]][2]);
            const b = new THREE.Vector3(vertices[face[1]][0], vertices[face[1]][1], vertices[face[1]][2]);
            const c = new THREE.Vector3(vertices[face[2]][0], vertices[face[2]][1], vertices[face[2]][2]);
            
            const normal = new THREE.Vector3();
            normal.crossVectors(
                new THREE.Vector3().subVectors(b, a),
                new THREE.Vector3().subVectors(c, a)
            ).normalize();
            
              return new THREE.Quaternion().setFromAxisAngle(normal, Math.PI / 5);
            } else {
                console.error("Undefined vertix encountered.");
                return new THREE.Quaternion();
            }
        });
        


        function calculateFaceNormals(gltf) {
            const faceNormals = [];

            gltf.scene.traverse((child) => {
                if (child.isMesh) {
                    const geometry = child.geometry;
                    const positionAttribute = geometry.attributes.position;
                    const normalAttribute = geometry.attributes.normal;

                    for (let i = 0; i < positionAttribute.count; i += 3) {
                        const normal = new THREE.Vector3();
                        normal.fromBufferAttribute(normalAttribute, i);
                        faceNormals.push(normal);

                        // Calculate quaternion based on face normal and add to faceQuaternions
                        const quaternion = new THREE.Quaternion();
                        quaternion.setFromAxisAngle(normal, 0); // zero angle means it will align with the normal
                        faceQuaternions.push(quaternion);
                    }
                }
            });

            return faceNormals;
        }
        
        // load hdr background for reflections

        const hdrTextureURL = new URL('../assets/cubemap/puresky_1k.hdr', import.meta.url);
        const loader = new RGBELoader();

        loader.load(hdrTextureURL, function ( texture ) {
            console.log('HDR texture loaded', texture);
            texture.mapping = THREE.EquirectangularReflectionMapping;
            test.scene.background = texture; // set hdr background
            test.scene.environment = texture; // use hdr background for lighting...
            // ... rather than ambient, directional, or point lighting 
            
            // Black background for portfolio
//            test.scene.background = new THREE.Color(0x000000);
            

            // Load DRACO compressed trinket 
            const dracoLoader = new DRACOLoader();
            dracoLoader.setDecoderPath('/draco/');

            // Load trinket and hdr background
            const gltfLoader = new GLTFLoader();
            gltfLoader.setDRACOLoader(dracoLoader);
            gltfLoader.load(modelPath, ( gltf ) => {
                console.log("Inside GLTFLoader callback, GLTF is:", gltf);
                loadedTrinketRef.current = gltf;
                
                // calculateFaceNormals after loading trinket
                const faceNormals = calculateFaceNormals(gltf);
                customAxesRef.current = faceNormals;

                if(customAxes) {
                const customAxis = customAxes[customAxisIndex].clone();
                
                // Define target rotation quaternion
                targetQuaternion = new THREE.Quaternion().setFromAxisAngle(customAxis, 0.51);

                }
                

                // Update material based on variables
                updateMaterial();

                gltf.scene.rotation.z = Math.PI;
                gltf.scene.rotation.x = -Math.PI/2;
                test.scene.add(gltf.scene);
            });
        });
        
        const animate = () => {
            const loadedTrinket = loadedTrinketRef.current;
            customAxes = customAxesRef.current;

            if (loadedTrinket && customAxes) {

                // Calculate centroid
                const box = new THREE.Box3().setFromObject(loadedTrinket.scene);
                const centroid = new THREE.Vector3();
                box.getCenter(centroid);

                // Translate CG trinket to it's centroid 
                loadedTrinket.scene.position.x -= centroid.x;
                loadedTrinket.scene.position.y -= centroid.y;
                loadedTrinket.scene.position.z -= centroid.z;

                let targetIndex = 0; // Index to keep track of the current target quaternion

                if (keyPressed) {
                    // Interpolate between current and target rotation using slerp
                    const currentQuaternion = loadedTrinket.scene.quaternion.clone();

                    if (transitioning) {
                        targetQuaternion = faceQuaternions[targetIndex]; 
                        if (currentQuaternion.angleTo(targetQuaternion) < 0.01) {
                            transitioning = false;
                            targetIndex = (targetIndex + 1) % 12; // Move to the next target quaternion
                        }
                    }
                    const newQuaternion =  currentQuaternion.slerp(targetQuaternion, 0.02);
                    loadedTrinket.scene.setRotationFromQuaternion(newQuaternion);

                if (currentQuaternion.angleTo(targetQuaternion) < 0.22) {
                    keyPressed = false;
                    }
                }
            }
            requestAnimationFrame(animate);
        };

        let keyPressed = false;
        
        // Set up event listener for keyboard input 
        document.addEventListener('keydown', function(event) {
            console.log('Key Pressed', event.code);
            if(typeof axis === "undefined") {
                console.log("axis is undefined");
            } else {
                console.log("axis exists");
            }
            console.log("targetQuaternion:", targetQuaternion);
            const faceIndex = keyToFaceMapping[event.code];
            const customAxes = customAxesRef.current;

            if (faceIndex !== undefined && customAxes) {
                // Update currentFaceIndex and wrap it back to 0 if it exceeds 11
                currentFaceIndex = (currentFaceIndex + 1) % 12;

                // Get the corresponding quaternion from the arry
                targetQuaternion.copy(faceQuaternions[currentFaceIndex]);

                keyPressed = true;
            }
        });

        animate();


        // Visualize axes
        const axesHelper = new THREE.AxesHelper( 32 );
        test.scene.add( axesHelper );

        setResetFunc(() => resetTrinket);
        
        // Destroy the GUI on reload to prevent multiple from appearing
        return () => {
            gui.destroy();
        };


    }, []);
    

  return (
    <div>
      <canvas id="myThreeJsCanvas" />
      <button onClick={resetTrinket}>Reset Trinket</button>
    </div>
  )
}

export default App
