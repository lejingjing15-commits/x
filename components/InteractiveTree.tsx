import React, { useMemo, useRef, useLayoutEffect } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { TreeMorphState } from '../types';

interface InteractiveTreeProps {
  treeState: TreeMorphState;
}

// Configuration
const PARTICLE_COUNT = 3000; // Needles
const ORNAMENT_COUNT = 120;
const GIFT_COUNT = 40;
const SPARKLE_COUNT = 300; // Lucky stars
const CAT_COUNT = 25; // Cat ornaments

const TREE_HEIGHT = 8;
const TREE_RADIUS_BASE = 3.5;
const SCATTER_RADIUS = 18;

// --- Helper Functions ---

const randomInSphere = (radius: number) => {
  const u = Math.random();
  const v = Math.random();
  const theta = 2 * Math.PI * u;
  const phi = Math.acos(2 * v - 1);
  const r = Math.cbrt(Math.random()) * radius;
  return new THREE.Vector3(
    r * Math.sin(phi) * Math.cos(theta),
    r * Math.sin(phi) * Math.sin(theta),
    r * Math.cos(phi)
  );
};

const randomInCone = (height: number, radiusBase: number) => {
  const y = Math.random() * height;
  const rAtHeight = (1 - y / height) * radiusBase;
  const theta = Math.random() * Math.PI * 2;
  const r = Math.sqrt(Math.random()) * rAtHeight;
  return new THREE.Vector3(r * Math.cos(theta), y, r * Math.sin(theta));
};

const randomOnConeSurface = (height: number, radiusBase: number, offset = 0) => {
  const y = Math.random() * height;
  const rAtHeight = (1 - y / height) * radiusBase;
  const theta = Math.random() * Math.PI * 2;
  const r = rAtHeight + offset;
  return new THREE.Vector3(r * Math.cos(theta), y, r * Math.sin(theta));
};

export const InteractiveTree: React.FC<InteractiveTreeProps> = ({ treeState }) => {
  const needlesMesh = useRef<THREE.InstancedMesh>(null);
  const ornamentsMesh = useRef<THREE.InstancedMesh>(null);
  const giftsMesh = useRef<THREE.InstancedMesh>(null);
  const sparklesMesh = useRef<THREE.InstancedMesh>(null);
  const catsMesh = useRef<THREE.InstancedMesh>(null);
  const starMesh = useRef<THREE.Mesh>(null);

  // --- Data Generation ---

  const needleData = useMemo(() => {
    const temp = [];
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const scatterPos = randomInSphere(SCATTER_RADIUS);
      const treePos = randomInCone(TREE_HEIGHT, TREE_RADIUS_BASE);
      const treeRot = new THREE.Euler(
        (Math.random() - 0.5) * 0.5,
        Math.random() * Math.PI * 2,
        (Math.random() - 0.5) * 0.5
      );
      const scatterRot = new THREE.Euler(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
      temp.push({ scatterPos, treePos, scatterRot, treeRot, speed: 0.02 + Math.random() * 0.04 });
    }
    return temp;
  }, []);

  const ornamentData = useMemo(() => {
    const temp = [];
    const colors = [
      new THREE.Color("#ffd700"), // Gold
      new THREE.Color("#ff3366"), // Red
      new THREE.Color("#ffffff"), // Silver
      new THREE.Color("#00ffcc"), // Teal pop
    ];
    for (let i = 0; i < ORNAMENT_COUNT; i++) {
      const scatterPos = randomInSphere(SCATTER_RADIUS);
      const treePos = randomOnConeSurface(TREE_HEIGHT, TREE_RADIUS_BASE, 0.2);
      const color = colors[Math.floor(Math.random() * colors.length)];
      temp.push({ 
        scatterPos, 
        treePos, 
        color, 
        scale: 0.15 + Math.random() * 0.2,
        speed: 0.015 + Math.random() * 0.03 
      });
    }
    return temp;
  }, []);

  const giftData = useMemo(() => {
    const temp = [];
    const colors = [
      new THREE.Color("#880000"), // Deep Red
      new THREE.Color("#0f3d0f"), // Deep Green
      new THREE.Color("#b8860b"), // Dark Goldenrod
    ];
    for (let i = 0; i < GIFT_COUNT; i++) {
      const scatterPos = randomInSphere(SCATTER_RADIUS);
      // Gifts sit lower on the tree or under it
      let treePos;
      if (Math.random() > 0.3) {
        // On the tree surface
        treePos = randomOnConeSurface(TREE_HEIGHT * 0.6, TREE_RADIUS_BASE, 0.3);
      } else {
        // Under the tree
        const r = Math.random() * TREE_RADIUS_BASE * 1.5;
        const theta = Math.random() * Math.PI * 2;
        treePos = new THREE.Vector3(r * Math.cos(theta), 0.2, r * Math.sin(theta));
      }

      const color = colors[Math.floor(Math.random() * colors.length)];
      temp.push({
        scatterPos,
        treePos,
        color,
        scale: 0.25 + Math.random() * 0.2,
        speed: 0.01 + Math.random() * 0.02,
        rotationSpeed: (Math.random() - 0.5) * 2
      });
    }
    return temp;
  }, []);

  const sparkleData = useMemo(() => {
    const temp = [];
    for (let i = 0; i < SPARKLE_COUNT; i++) {
      const scatterPos = randomInSphere(SCATTER_RADIUS);
      const treePos = randomInCone(TREE_HEIGHT + 1, TREE_RADIUS_BASE + 0.5); // Slightly larger volume
      temp.push({
        scatterPos,
        treePos,
        scale: 0.05 + Math.random() * 0.1,
        speed: 0.02 + Math.random() * 0.05,
        phase: Math.random() * Math.PI * 2
      });
    }
    return temp;
  }, []);

  const catData = useMemo(() => {
    const temp = [];
    // A nice Onyx or Obsidian color
    const color = new THREE.Color("#1a1a1a"); 
    for (let i = 0; i < CAT_COUNT; i++) {
        const scatterPos = randomInSphere(SCATTER_RADIUS);
        const treePos = randomOnConeSurface(TREE_HEIGHT, TREE_RADIUS_BASE, 0.35); // Slightly poking out
        
        // Random rotation y for tree state so they face out roughly
        const angle = Math.atan2(treePos.x, treePos.z);
        const treeRot = new THREE.Euler(0, angle + Math.PI, 0); // Face outward
        const scatterRot = new THREE.Euler(Math.random()*Math.PI, Math.random()*Math.PI, Math.random()*Math.PI);

        temp.push({
            scatterPos,
            treePos,
            scatterRot,
            treeRot,
            color,
            scale: 0.15 + Math.random() * 0.1, // Size of cat head
            speed: 0.015 + Math.random() * 0.02,
        });
    }
    return temp;
  }, []);

  // --- Geometry Construction for Cats ---
  const catGeometry = useMemo(() => {
      const shape = new THREE.Shape();
      // Start bottom center
      shape.moveTo(0, -0.4);
      // Right cheek
      shape.bezierCurveTo(0.3, -0.4, 0.5, -0.2, 0.5, 0); 
      // Right Ear
      shape.lineTo(0.6, 0.5); 
      shape.lineTo(0.2, 0.3);
      // Top Head
      shape.bezierCurveTo(0.1, 0.35, -0.1, 0.35, -0.2, 0.3);
      // Left Ear
      shape.lineTo(-0.6, 0.5);
      shape.lineTo(-0.5, 0);
      // Left Cheek
      shape.bezierCurveTo(-0.5, -0.2, -0.3, -0.4, 0, -0.4);
      
      const extrudeSettings = {
          steps: 1,
          depth: 0.2,
          bevelEnabled: true,
          bevelThickness: 0.05,
          bevelSize: 0.05,
          bevelSegments: 2
      };
      
      const geom = new THREE.ExtrudeGeometry(shape, extrudeSettings);
      geom.center(); // Center the geometry
      return geom;
  }, []);


  // --- Animation Loop ---

  const dummy = useMemo(() => new THREE.Object3D(), []);
  const tempVec = useMemo(() => new THREE.Vector3(), []);
  const tempQuat = useMemo(() => new THREE.Quaternion(), []);

  useFrame((state, delta) => {
    const isTree = treeState === TreeMorphState.TREE_SHAPE;
    const time = state.clock.elapsedTime;
    const lerpFactorBase = 60 * delta; // Normalize lerp speed somewhat

    // 1. Needles
    if (needlesMesh.current) {
      needleData.forEach((data, i) => {
        const targetPos = isTree ? data.treePos : data.scatterPos;
        const targetRot = isTree ? data.treeRot : data.scatterRot;

        needlesMesh.current!.getMatrixAt(i, dummy.matrix);
        dummy.matrix.decompose(dummy.position, dummy.quaternion, dummy.scale);

        if (!isTree) {
           tempVec.copy(targetPos).addScalar(Math.sin(time * 0.5 + i) * 0.5); // Float
        } else {
           tempVec.copy(targetPos);
        }

        dummy.position.lerp(tempVec, data.speed * lerpFactorBase);
        
        const targetQuat = new THREE.Quaternion().setFromEuler(targetRot);
        if (!isTree) targetQuat.multiply(tempQuat.setFromAxisAngle(new THREE.Vector3(0,1,0), time * 0.1));
        
        dummy.quaternion.slerp(targetQuat, data.speed * lerpFactorBase);
        dummy.scale.setScalar(isTree ? 1 : 0.01); // Needles disappear to almost nothing when scattered

        dummy.updateMatrix();
        needlesMesh.current!.setMatrixAt(i, dummy.matrix);
      });
      needlesMesh.current.instanceMatrix.needsUpdate = true;
    }

    // 2. Ornaments
    if (ornamentsMesh.current) {
      ornamentData.forEach((data, i) => {
        const targetPos = isTree ? data.treePos : data.scatterPos;
        ornamentsMesh.current!.getMatrixAt(i, dummy.matrix);
        dummy.matrix.decompose(dummy.position, dummy.quaternion, dummy.scale);

        tempVec.copy(targetPos);
        if (isTree) tempVec.y += Math.sin(time * 2 + i) * 0.05; // Gentle bob
        else tempVec.add(new THREE.Vector3(Math.sin(time+i), Math.cos(time+i), 0).multiplyScalar(0.5));

        dummy.position.lerp(tempVec, data.speed * lerpFactorBase);
        dummy.rotation.set(0, time + i, 0); // Always spinning
        
        dummy.updateMatrix();
        ornamentsMesh.current!.setMatrixAt(i, dummy.matrix);
      });
      ornamentsMesh.current.instanceMatrix.needsUpdate = true;
    }

    // 3. Gifts
    if (giftsMesh.current) {
      giftData.forEach((data, i) => {
        const targetPos = isTree ? data.treePos : data.scatterPos;
        giftsMesh.current!.getMatrixAt(i, dummy.matrix);
        dummy.matrix.decompose(dummy.position, dummy.quaternion, dummy.scale);

        tempVec.copy(targetPos);
        if (!isTree) tempVec.addScalar(Math.sin(time * 0.3 + i));

        dummy.position.lerp(tempVec, data.speed * lerpFactorBase);
        dummy.rotation.set(0, time * data.rotationSpeed, 0);
        dummy.scale.setScalar(data.scale * (isTree ? 1 : 0.8));

        dummy.updateMatrix();
        giftsMesh.current!.setMatrixAt(i, dummy.matrix);
      });
      giftsMesh.current.instanceMatrix.needsUpdate = true;
    }

    // 4. Lucky Stars (Sparkles)
    if (sparklesMesh.current) {
      sparkleData.forEach((data, i) => {
        const targetPos = isTree ? data.treePos : data.scatterPos;
        sparklesMesh.current!.getMatrixAt(i, dummy.matrix);
        dummy.matrix.decompose(dummy.position, dummy.quaternion, dummy.scale);

        tempVec.copy(targetPos);
        // Twinkle movement
        tempVec.add(new THREE.Vector3(0, Math.sin(time * 2 + data.phase) * 0.1, 0));

        dummy.position.lerp(tempVec, data.speed * lerpFactorBase);
        // Pulse scale
        const pulse = 1 + Math.sin(time * 3 + data.phase) * 0.3;
        dummy.scale.setScalar(data.scale * pulse);
        dummy.rotation.set(time, time, 0);

        dummy.updateMatrix();
        sparklesMesh.current!.setMatrixAt(i, dummy.matrix);
      });
      sparklesMesh.current.instanceMatrix.needsUpdate = true;
    }

    // 5. Cats
    if (catsMesh.current) {
        catData.forEach((data, i) => {
            const targetPos = isTree ? data.treePos : data.scatterPos;
            const targetRot = isTree ? data.treeRot : data.scatterRot;

            catsMesh.current!.getMatrixAt(i, dummy.matrix);
            dummy.matrix.decompose(dummy.position, dummy.quaternion, dummy.scale);

            tempVec.copy(targetPos);
            // Cats bob slightly
            if (isTree) tempVec.y += Math.sin(time * 1.5 + i) * 0.03;

            dummy.position.lerp(tempVec, data.speed * lerpFactorBase);

            const targetQuat = new THREE.Quaternion().setFromEuler(targetRot);
            // Spin slowly if scattered
            if (!isTree) targetQuat.multiply(tempQuat.setFromAxisAngle(new THREE.Vector3(0,1,0), time * 0.5));
            
            dummy.quaternion.slerp(targetQuat, data.speed * lerpFactorBase);
            dummy.scale.setScalar(data.scale);

            dummy.updateMatrix();
            catsMesh.current!.setMatrixAt(i, dummy.matrix);
        });
        catsMesh.current.instanceMatrix.needsUpdate = true;
    }

    // 6. Main Star
    if (starMesh.current) {
      const targetY = isTree ? TREE_HEIGHT + 0.5 : 25;
      const currentY = starMesh.current.position.y;
      starMesh.current.position.y = THREE.MathUtils.lerp(currentY, targetY, delta * 2);
      starMesh.current.rotation.y += delta * 0.5;
      starMesh.current.rotation.z = Math.sin(time) * 0.1;
      starMesh.current.scale.setScalar(THREE.MathUtils.lerp(starMesh.current.scale.x, isTree ? 1.5 : 0, delta * 3));
    }
  });

  // --- Initial Setup (Colors) ---
  useLayoutEffect(() => {
    // Ornaments
    if (ornamentsMesh.current) {
      ornamentData.forEach((data, i) => {
        dummy.scale.setScalar(data.scale);
        dummy.updateMatrix();
        ornamentsMesh.current!.setMatrixAt(i, dummy.matrix);
        ornamentsMesh.current!.setColorAt(i, data.color);
      });
      ornamentsMesh.current.instanceMatrix.needsUpdate = true;
      ornamentsMesh.current.instanceColor!.needsUpdate = true;
    }
    // Gifts
    if (giftsMesh.current) {
      giftData.forEach((data, i) => {
        dummy.updateMatrix(); // Scale handled in loop
        giftsMesh.current!.setMatrixAt(i, dummy.matrix);
        giftsMesh.current!.setColorAt(i, data.color);
      });
      giftsMesh.current.instanceMatrix.needsUpdate = true;
      giftsMesh.current.instanceColor!.needsUpdate = true;
    }
    // Cats
    if (catsMesh.current) {
        catData.forEach((data, i) => {
            dummy.updateMatrix(); 
            catsMesh.current!.setMatrixAt(i, dummy.matrix);
            catsMesh.current!.setColorAt(i, data.color);
        });
        catsMesh.current.instanceMatrix.needsUpdate = true;
        catsMesh.current.instanceColor!.needsUpdate = true;
    }
    // Needles
    if (needlesMesh.current) {
      needleData.forEach((_, i) => {
        dummy.scale.set(0.1, 0.4, 0.1);
        dummy.updateMatrix();
        needlesMesh.current!.setMatrixAt(i, dummy.matrix);
      });
      needlesMesh.current.instanceMatrix.needsUpdate = true;
    }
  }, [ornamentData, giftData, needleData, catData, dummy]);

  return (
    <group>
      {/* Needles - Deep Emerald */}
      <instancedMesh ref={needlesMesh} args={[undefined, undefined, PARTICLE_COUNT]}>
        <coneGeometry args={[0.2, 1, 4]} />
        <meshStandardMaterial
          color="#023020" // Darker Emerald
          roughness={0.4}
          metalness={0.1}
          emissive="#001a0f"
          emissiveIntensity={0.2}
        />
      </instancedMesh>

      {/* Ornaments - Glossy */}
      <instancedMesh ref={ornamentsMesh} args={[undefined, undefined, ORNAMENT_COUNT]}>
        <sphereGeometry args={[1, 32, 32]} />
        <meshStandardMaterial
          roughness={0.1}
          metalness={0.9}
          envMapIntensity={1.5}
        />
      </instancedMesh>

      {/* Gifts - Boxes with metallic sheen */}
      <instancedMesh ref={giftsMesh} args={[undefined, undefined, GIFT_COUNT]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial
          roughness={0.2}
          metalness={0.6}
          envMapIntensity={1}
        />
      </instancedMesh>

      {/* Cats - Obsidian/Black Gold */}
      <instancedMesh ref={catsMesh} args={[catGeometry, undefined, CAT_COUNT]}>
         <meshStandardMaterial
            color="#000000"
            roughness={0.1}
            metalness={0.9}
            envMapIntensity={2.0}
         />
      </instancedMesh>

      {/* Lucky Stars (Sparkles) - High Emission */}
      <instancedMesh ref={sparklesMesh} args={[undefined, undefined, SPARKLE_COUNT]}>
        <octahedronGeometry args={[1, 0]} />
        <meshStandardMaterial
          color="#ffffdd"
          emissive="#ffffaa"
          emissiveIntensity={4}
          toneMapped={false}
        />
      </instancedMesh>

      {/* The Grand Top Star */}
      <mesh ref={starMesh} position={[0, TREE_HEIGHT + 0.5, 0]}>
        <octahedronGeometry args={[0.8, 0]} />
        <meshStandardMaterial
          color="#ffd700"
          emissive="#ffd700"
          emissiveIntensity={3}
          toneMapped={false}
        />
        <pointLight distance={8} intensity={6} color="#ffd700" decay={2} />
      </mesh>
    </group>
  );
};