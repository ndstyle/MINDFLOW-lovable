import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

interface Particle {
  id: number;
  x: number;
  size: 'small' | 'medium' | 'large';
  delay: number;
}

interface FloatingParticlesProps {
  showOnHomepage?: boolean;
}

export const FloatingParticles = ({ showOnHomepage = false }: FloatingParticlesProps) => {
  const location = useLocation();
  const isHomepage = location.pathname === '/' && !location.search;
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    // Only show particles on homepage or when explicitly requested
    if ((!showOnHomepage && !isHomepage) || (showOnHomepage && !isHomepage)) {
      return;
    }

    const generateParticles = () => {
      const newParticles: Particle[] = [];
      for (let i = 0; i < 8; i++) { // Reduced from 15 to 8
        newParticles.push({
          id: i,
          x: Math.random() * 100,
          size: Math.random() > 0.7 ? 'large' : Math.random() > 0.4 ? 'medium' : 'small',
          delay: Math.random() * 25, // Increased delay range
        });
      }
      setParticles(newParticles);
    };

    generateParticles();
  }, [showOnHomepage, isHomepage]);

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

  // Don't render if not on homepage and not explicitly shown
  if ((!showOnHomepage && !isHomepage) || (showOnHomepage && !isHomepage)) {
    return null;
  }

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none">
      {particles.map((particle) => (
        <div
          key={particle.id}
          className={getParticleClass(particle.size)}
          style={{
            left: `${particle.x}%`,
            animationDelay: `${particle.delay}s`,
            opacity: '0.3', // Reduced intensity
          }}
        />
      ))}
    </div>
  );
};