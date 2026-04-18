import Header from '../components/Header';
import EntropyDemo from '../components/entropy/EntropyDemo';

function PasswordGenerator() {
  return (
    <div className="min-h-screen bg-dark-navy">
      <Header />
      <EntropyDemo onClose={null} />
    </div>
  );
}

export default PasswordGenerator;
