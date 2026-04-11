"use client";

import React, { useEffect, useRef } from 'react';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  highlighted?: boolean;
}

export function ParticleNetwork({ 
  activeAgents = 0,
  totalAgents = 6 
}: { 
  activeAgents?: number,
  totalAgents?: number 
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let particles: Particle[] = [];
    const numParticles = 80;
    const connectionDistance = 80;

    let animationFrameId: number;

    const initParticles = () => {
      particles = [];
      for (let i = 0; i < numParticles; i++) {
        particles.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          vx: (Math.random() - 0.5) * 1.5,
          vy: (Math.random() - 0.5) * 1.5,
          radius: Math.random() * 2 + 1,
          highlighted: i < activeAgents // Simple way to highlight random nodes based on activity
        });
      }
    };

    const resizeCanvas = () => {
      if (!canvas.parentElement) return;
      canvas.width = canvas.parentElement.clientWidth;
      canvas.height = canvas.parentElement.clientHeight;
      initParticles();
    };

    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        
        // Update
        p.x += p.vx;
        p.y += p.vy;

        // Bounce
        if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;

        // Connections
        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const dx = p.x - p2.x;
          const dy = p.y - p2.y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < connectionDistance) {
            ctx.beginPath();
            const opacity = 1 - (distance / connectionDistance);
            
            // If both are highlighted, draw a vibrant red line for data routing effect
            if (p.highlighted && p2.highlighted) {
                ctx.strokeStyle = `rgba(255, 50, 50, ${opacity * 0.8})`;
                ctx.lineWidth = 1.5;
            } else {
                ctx.strokeStyle = `rgba(255, 255, 255, ${opacity * 0.3})`;
                ctx.lineWidth = 0.5;
            }
            
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
          }
        }

        // Draw particle
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius + (p.highlighted ? 1.5 : 0), 0, Math.PI * 2);
        if (p.highlighted) {
           ctx.fillStyle = 'rgba(255, 0, 0, 0.9)';
           ctx.shadowColor = 'rgba(255, 0, 0, 1)';
           ctx.shadowBlur = 10;
        } else {
           ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
           ctx.shadowBlur = 0;
        }
        ctx.fill();
        ctx.shadowBlur = 0; // reset
      }

      animationFrameId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      cancelAnimationFrame(animationFrameId);
    };
  }, [activeAgents]);

  return (
    <div className="w-full h-full absolute inset-0 -z-10 bg-black overflow-hidden rounded-md border border-white/10">
      <canvas ref={canvasRef} className="w-full h-full" />
    </div>
  );
}
