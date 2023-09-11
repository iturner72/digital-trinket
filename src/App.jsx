import { useEffect, useState, useRef } from 'react';
import * as THREE from 'three';
import { GUI } from 'dat.gui';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js';

import SceneInit from './lib/SceneInit';

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
        
        // Generate a random rotation for a face 
        function randomRotation() {
            console.log('Generating random rotation');
            return Math.random() * Math.PI * 2;
        }

        // Create a mapping of keys to face index
        const keyToFaceMapping = {
            KeyO: 0,
            KeyT: 1,
            KeyB: 2,
        };
        
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
        
        // Define normals for rotation
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
            

            // Load trinket and hdr background
            const gltfLoader = new GLTFLoader();
            gltfLoader.load('./../assets/trinket/digital_trinket_final.glb', ( gltf ) => {
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


        let customAxisIndex = 0;
        
        
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


                if (keyPressed) {
                    // Interpolate between current and target rotation using slerp
                    const currentQuaternion = loadedTrinket.scene.quaternion.clone();
                    const newQuaternion =  currentQuaternion.slerp(targetQuaternion, 0.55);
                    loadedTrinket.scene.setRotationFromQuaternion(newQuaternion);

                if (currentQuaternion.angleTo(targetQuaternion) < 0.01) {
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
                console.log("Setting targetQuaternion");
                const axis = customAxes[faceIndex];
                const angle = randomRotation();

                console.log("Debug: ", { axis, targetQuaternion });
                targetQuaternion.setFromAxisAngle(axis, angle);
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
