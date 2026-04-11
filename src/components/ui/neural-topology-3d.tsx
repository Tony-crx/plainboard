"use client";

import React, { useRef, useMemo, useState, useCallback, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Text, Line } from '@react-three/drei';
import * as THREE from 'three';
import { motion, AnimatePresence } from 'framer-motion';
import { LucideIcon, X, Activity, Database, Clock, TrendingUp } from 'lucide-react';

export interface AgentNode3D {
  id: string;
  name: string;
  displayName: string;
  icon: LucideIcon;
  status: 'idle' | 'thinking' | 'executing' | 'handoff' | 'error';
  position: [number, number, number];
  messageCount: number;
}

export interface Connection3D {
  from: string;
  to: string;
  active: boolean;
}

interface NeuralTopology3DProps {
  agents: AgentNode3D[];
  connections?: Connection3D[];
  onAgentClick?: (agentId: string) => void;
}

// Draggable agent node
function DraggableAgentNode({
  agent,
  onClick,
  onDragEnd,
}: {
  agent: AgentNode3D;
  onClick: (id: string) => void;
  onDragEnd: (id: string, position: [number, number, number]) => void;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [clickStartTime, setClickStartTime] = useState(0);
  const timeRef = useRef(0);

  const statusColors = {
    idle: new THREE.Color(0x666666),
    thinking: new THREE.Color(0xff8c00),
    executing: new THREE.Color(0xff0000),
    handoff: new THREE.Color(0x9932cc),
    error: new THREE.Color(0xff0000),
  };

  const color = statusColors[agent.status];
  const baseRadius = 0.5;

  useFrame((state, delta) => {
    timeRef.current += delta;

    if (meshRef.current && !dragging) {
      // Floating animation
      const floatY = Math.sin(timeRef.current * 1.5 + agent.position[0]) * 0.05;
      meshRef.current.position.y = agent.position[1] + floatY;

      // Pulse for active agents
      if (agent.status !== 'idle') {
        const pulse = 1 + Math.sin(timeRef.current * 3) * 0.05;
        meshRef.current.scale.setScalar(pulse);
      }
    }
  });

  const handleClick = useCallback((e: any) => {
    e.stopPropagation();

    const clickDuration = Date.now() - clickStartTime;

    // Double-click to focus camera
    if (clickDuration < 300 && clickDuration > 0) {
      // Focus camera on this agent
      const targetPos = agent.position;
      const controls = e.target?.parent?.__r3f?.root?.__r3f?.controls;
      if (controls) {
        controls.target.set(targetPos[0], targetPos[1], targetPos[2]);
      }
      onClick(agent.id);
    } else {
      setClickStartTime(Date.now());
    }
  }, [agent.id, agent.position, clickStartTime, onClick]);

  const handlePointerDown = useCallback((e: any) => {
    e.stopPropagation();
    setDragging(true);
  }, []);

  const handlePointerUp = useCallback((e: any) => {
    if (dragging && meshRef.current) {
      const newPos: [number, number, number] = [
        meshRef.current.position.x,
        meshRef.current.position.y,
        meshRef.current.position.z,
      ];
      onDragEnd(agent.id, newPos);
    }
    setDragging(false);
  }, [dragging, agent.id, onDragEnd]);

  const handlePointerMove = useCallback((e: any) => {
    if (dragging && meshRef.current) {
      // Update position based on drag
      const intersection = e.intersections?.[0]?.point;
      if (intersection) {
        meshRef.current.position.set(intersection.x, intersection.y, intersection.z);
      }
    }
  }, [dragging]);

  return (
    <group>
      {/* Glow effect */}
      <mesh position={agent.position}>
        <sphereGeometry args={[baseRadius * 1.8, 32, 32]} />
        <meshStandardMaterial
          color={color}
          transparent
          opacity={agent.status !== 'idle' ? 0.25 : 0.1}
          emissive={color}
          emissiveIntensity={agent.status !== 'idle' ? 0.5 : 0.1}
        />
      </mesh>

      {/* Main draggable node */}
      <mesh
        ref={meshRef}
        position={agent.position}
        onClick={handleClick}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerMove={handlePointerMove}
      >
        <sphereGeometry args={[baseRadius, 32, 32]} />
        <meshStandardMaterial
          color={hovered ? color.clone().multiplyScalar(1.4) : color}
          emissive={color}
          emissiveIntensity={agent.status !== 'idle' ? 1 : 0.3}
          roughness={0.2}
          metalness={0.8}
        />
      </mesh>

      {/* Status ring */}
      {agent.status !== 'idle' && (
        <mesh position={agent.position}>
          <torusGeometry args={[baseRadius + 0.15, 0.02, 16, 32]} />
          <meshBasicMaterial color={color} transparent opacity={0.8} />
        </mesh>
      )}

      {/* Agent name */}
      <Text
        position={[agent.position[0], agent.position[1] - 0.9, agent.position[2]]}
        fontSize={0.2}
        color={hovered ? '#ffffff' : '#ff4444'}
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.03}
        outlineColor="#000000"
      >
        {agent.displayName.toUpperCase()}
      </Text>

      {/* Message count badge */}
      {agent.messageCount > 0 && (
        <Text
          position={[agent.position[0] + 0.4, agent.position[1] + 0.4, agent.position[2]]}
          fontSize={0.15}
          color="#ff8888"
          anchorX="center"
          anchorY="middle"
        >
          {agent.messageCount}
        </Text>
      )}
    </group>
  );
}

// Connection line with animation
function AnimatedConnectionLine({
  from,
  to,
  active,
}: {
  from: [number, number, number];
  to: [number, number, number];
  active: boolean;
}) {
  const points = useMemo(() => [from, to], [from, to]);

  return (
    <Line
      points={points}
      color={active ? '#ff0000' : '#440000'}
      lineWidth={active ? 3 : 1}
      transparent
      opacity={active ? 0.9 : 0.2}
      dashed={active}
      dashSize={0.15}
      gapSize={0.08}
    />
  );
}

// Data packet animation
function DataPacket({
  from,
  to,
  active,
}: {
  from: [number, number, number];
  to: [number, number, number];
  active: boolean;
}) {
  const ref = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (ref.current && active) {
      const time = state.clock.elapsedTime % 2.5;
      const t = time / 2.5;
      ref.current.position.lerpVectors(
        new THREE.Vector3(...from),
        new THREE.Vector3(...to),
        t
      );
    }
  });

  if (!active) return null;

  return (
    <mesh ref={ref}>
      <sphereGeometry args={[0.1, 16, 16]} />
      <meshBasicMaterial color="#ff4444" />
    </mesh>
  );
}

// Agent detail panel (HTML overlay)
function AgentDetailPanel({
  agent,
  onClose,
}: {
  agent: AgentNode3D;
  onClose: () => void;
}) {
  if (!agent) return null;

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="absolute top-4 left-4 w-72 glass-panel-strong p-4 z-50"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-black text-red-500 uppercase tracking-widest">
          {agent.displayName}
        </h3>
        <button onClick={onClose} className="text-red-900 hover:text-[#ff1a1a] transition-colors">
          <X size={16} />
        </button>
      </div>

      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Activity size={14} className="text-red-500" />
          <div>
            <div className="text-[8px] text-red-900 uppercase">Status</div>
            <div className="text-xs text-gray-300 font-mono uppercase">{agent.status}</div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Database size={14} className="text-red-500" />
          <div>
            <div className="text-[8px] text-red-900 uppercase">Messages</div>
            <div className="text-xs text-gray-300 font-mono">{agent.messageCount}</div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Clock size={14} className="text-red-500" />
          <div>
            <div className="text-[8px] text-red-900 uppercase">Position</div>
            <div className="text-xs text-gray-300 font-mono">
              ({agent.position[0].toFixed(1)}, {agent.position[1].toFixed(1)}, {agent.position[2].toFixed(1)})
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-red-900/30">
        <div className="text-[8px] text-red-900 uppercase mb-2">Quick Actions</div>
        <div className="grid grid-cols-2 gap-2">
          <button className="px-2 py-1.5 bg-red-950/30 border border-red-900/50 text-[9px] text-red-500 hover:text-[#ff1a1a] hover:border-[#ff1a1a] transition-colors font-mono uppercase">
            View Logs
          </button>
          <button className="px-2 py-1.5 bg-red-950/30 border border-red-900/50 text-[9px] text-red-500 hover:text-[#ff1a1a] hover:border-[#ff1a1a] transition-colors font-mono uppercase">
            Reset
          </button>
        </div>
      </div>
    </motion.div>
  );
}

// Main 3D Scene
function Scene({
  agents,
  connections,
  onAgentClick,
  onAgentDragEnd,
  selectedAgent,
}: NeuralTopology3DProps & {
  onAgentDragEnd: (id: string, position: [number, number, number]) => void;
  selectedAgent: AgentNode3D | null;
}) {
  const { camera } = useThree();

  useMemo(() => {
    camera.position.set(0, 2, 7);
    camera.lookAt(0, 0, 0);
  }, [camera]);

  return (
    <>
      <ambientLight intensity={0.4} />
      <pointLight position={[10, 10, 10]} intensity={1.2} color="#ff4444" />
      <pointLight position={[-10, -10, -10]} intensity={0.6} color="#ff0000" />

      {/* Grid */}
      <gridHelper args={[20, 20, 0x330000, 0x110000]} position={[0, -3, 0]} />

      {/* Ambient particles */}
      <Points count={300} />

      {/* Agent nodes */}
      {agents.map((agent) => (
        <DraggableAgentNode
          key={agent.id}
          agent={agent}
          onClick={onAgentClick || (() => { })}
          onDragEnd={onAgentDragEnd}
        />
      ))}

      {/* Connections */}
      {connections?.map((conn, idx) => {
        const fromAgent = agents.find((a) => a.id === conn.from);
        const toAgent = agents.find((a) => a.id === conn.to);
        if (!fromAgent || !toAgent) return null;

        return (
          <React.Fragment key={idx}>
            <AnimatedConnectionLine
              from={fromAgent.position}
              to={toAgent.position}
              active={conn.active}
            />
            <DataPacket
              from={fromAgent.position}
              to={toAgent.position}
              active={conn.active}
            />
          </React.Fragment>
        );
      })}

      <OrbitControls
        enableZoom={true}
        enablePan={true}
        minDistance={3}
        maxDistance={15}
        autoRotate={false}
        autoRotateSpeed={0.5}
      />
    </>
  );
}

// Background points
function Points({ count }: { count: number }) {
  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 18;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 12;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 18;
    }
    return pos;
  }, [count]);

  const ref = useRef<THREE.Points>(null);

  useFrame(() => {
    if (ref.current) {
      ref.current.rotation.y += 0.0003;
    }
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.03}
        color="#ff4444"
        transparent
        opacity={0.4}
        sizeAttenuation
      />
    </points>
  );
}

// Main component
export function NeuralTopology3D({
  agents: initialAgents,
  connections = [],
  onAgentClick,
}: NeuralTopology3DProps) {
  const [agents, setAgents] = useState(initialAgents);
  const [selectedAgent, setSelectedAgent] = useState<AgentNode3D | null>(null);
  const [hasWebGL, setHasWebGL] = useState(true);

  // Update agents when props change
  useEffect(() => {
    setAgents(initialAgents);
  }, [initialAgents]);

  useMemo(() => {
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      if (!gl) setHasWebGL(false);
    } catch (e) {
      setHasWebGL(false);
    }
  }, []);

  const handleAgentClick = useCallback((agentId: string) => {
    const agent = agents.find(a => a.id === agentId);
    if (agent) {
      setSelectedAgent(agent);
      onAgentClick?.(agentId);
    }
  }, [agents, onAgentClick]);

  const handleAgentDragEnd = useCallback((agentId: string, newPosition: [number, number, number]) => {
    setAgents(prev =>
      prev.map(agent =>
        agent.id === agentId
          ? { ...agent, position: newPosition }
          : agent
      )
    );
  }, []);

  if (!hasWebGL) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-black/60">
        <div className="text-center">
          <div className="text-red-500 text-sm font-mono uppercase tracking-widest mb-2">
            WebGL Not Available
          </div>
          <div className="text-red-900 text-xs font-mono">
            Falling back to 2D mode
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full relative">
      <Canvas
        camera={{ fov: 60, near: 0.1, far: 100 }}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: 'high-performance',
        }}
      >
        <Scene
          agents={agents}
          connections={connections}
          onAgentClick={handleAgentClick}
          onAgentDragEnd={handleAgentDragEnd}
          selectedAgent={selectedAgent}
        />
      </Canvas>

      {/* Agent Detail Panel */}
      <AnimatePresence>
        {selectedAgent && (
          <AgentDetailPanel
            agent={selectedAgent}
            onClose={() => setSelectedAgent(null)}
          />
        )}
      </AnimatePresence>

      {/* Instructions */}
      <div className="absolute bottom-4 left-4 text-[9px] text-red-900/50 font-mono uppercase tracking-widest">
        Drag to move agents • Double-click to focus • Scroll to zoom
      </div>
    </div>
  );
}

export default NeuralTopology3D;
