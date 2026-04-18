import { useState } from 'react';
import EntropyDemo from '../components/entropy/EntropyDemo';

function PasswordGenerator() {
  const [showGenerator, setShowGenerator] = useState(true);

  return (
    <div className="min-h-screen bg-dark-navy">
      {showGenerator && (
        <EntropyDemo onClose={() => setShowGenerator(false)} />
      )}
      {!showGenerator && (
        <div className="flex items-center justify-center min-h-screen">
          <button
            onClick={() => setShowGenerator(true)}
            className="px-6 py-3 bg-lime text-dark-navy font-mono hover:bg-lime-dim transition-colors"
          >
            Ouvrir le générateur
          </button>
        </div>
      )}
    </div>
  );
}

export default PasswordGenerator;
