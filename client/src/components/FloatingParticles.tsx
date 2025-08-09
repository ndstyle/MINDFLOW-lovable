import { useEffect, useState } from 'react';

interface Particle {
  id: number;
  x: number;
  size: 'small' | 'medium' | 'large';
  delay: number;
}

interface FloatingParticlesProps {
  showOnlyOnHome?: boolean;
}

export const FloatingParticles = ({ showOnlyOnHome = false }: FloatingParticlesProps) => {
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    const generateParticles = () => {
      const newParticles: Particle[] = [];
      const particleCount = showOnlyOnHome ? 8 : 15; // Reduced intensity
      for (let i = 0; i < particleCount; i++) {
        newParticles.push({
          id: i,
          x: Math.random() * 100,
          size: Math.random() > 0.8 ? 'large' : Math.random() > 0.6 ? 'medium' : 'small', // More subtle
          delay: Math.random() * 30, // Slower animation
        });
      }
      setParticles(newParticles);
    };

    generateParticles();
  }, []);

  const getParticleClass = (size: string) => {
    switch (size) {
      case 'small':
        return 'particle particle-3';
      case 'medium':
        return 'particle particle-1';
      case 'large':
        return 'particle particle-2';
      default:
        return 'particle particle-1';
    }
  };

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none">
      {particles.map((particle) => (
        <div
          key={particle.id}
          className={getParticleClass(particle.size)}
          style={{
            left: `${particle.x}%`,
            animationDelay: `${particle.delay}s`,
          }}
        />
      ))}
    </div>
  );
};