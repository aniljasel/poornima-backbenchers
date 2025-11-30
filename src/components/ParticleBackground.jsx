import React, { useRef, useEffect } from 'react';

const ParticleBackground = () => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let width, height;
    let particles = [];
    let animationFrameId;

    // Screen size set karna
    const resize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    // Particles create karna (Same logic as your HTML)
    const initParticles = () => {
      resize();
      particles = [];
      // Particles ki sankhya (40 as per your last code)
      for (let i = 0; i < 40; i++) {
        particles.push({
          x: Math.random() * width,
          y: Math.random() * height,
          vx: (Math.random() - 0.5), // Velocity X
          vy: (Math.random() - 0.5)  // Velocity Y
        });
      }
    };

    // Animation Loop
    const animate = () => {
      ctx.clearRect(0, 0, width, height);
      
      particles.forEach((p, i) => {
        // Movement update
        p.x += p.vx;
        p.y += p.vy;

        // Bounce off edges (Deewaron se takra kar wapas aana)
        if (p.x < 0 || p.x > width) p.vx *= -1;
        if (p.y < 0 || p.y > height) p.vy *= -1;

        // Draw Particle (Circle)
        ctx.beginPath();
        ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
        ctx.fillStyle = '#ffcc00'; // Aapka primary color
        ctx.fill();

        // Draw Lines (Connections)
        particles.forEach((p2, j) => {
          if (i !== j) {
            let dx = p.x - p2.x;
            let dy = p.y - p2.y;
            let distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < 100) {
              ctx.beginPath();
              ctx.moveTo(p.x, p.y);
              ctx.lineTo(p2.x, p2.y);
              // Line opacity distance ke hisab se kam/zyada hogi
              ctx.strokeStyle = `rgba(255, 204, 0, ${1 - distance / 100})`;
              ctx.stroke();
            }
          }
        });
      });

      animationFrameId = requestAnimationFrame(animate);
    };

    // Initial Setup
    initParticles();
    animate();

    window.addEventListener('resize', initParticles);

    return () => {
      window.removeEventListener('resize', initParticles);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: -1,
        opacity: 0.3,
        pointerEvents: 'none'
      }}
    />
  );
};

export default ParticleBackground;