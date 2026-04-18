import { useState } from 'react';
import PasswordGenerator from '../Generator/PasswordGenerator';

export default function VaultForm({ item, onSubmit, onClose }) {
  const [formData, setFormData] = useState({
    name: item?.name || '',
    username: item?.username || '',
    password: item?.password || '',
    url: item?.url || '',
    notes: item?.notes || ''
  });
  const [loading, setLoading] = useState(false);
  const [showGenerator, setShowGenerator] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await onSubmit(formData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordGenerated = (password) => {
    setFormData(prev => ({ ...prev, password }));
    setShowGenerator(false);
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-mid-navy border-2 border-lime/20 rounded-lg shadow-glow-lg max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-heading text-2xl text-lime uppercase tracking-wider">
              [ {item ? 'Modifier l\'entrée' : 'Nouvelle entrée'} ]
            </h2>
            <button
              onClick={onClose}
              className="p-1 text-grey hover:text-red-400 rounded transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="name" className="block font-mono text-xs text-cyan uppercase tracking-wider mb-2">
                Nom *
              </label>
              <input
                id="name"
                name="name"
                type="text"
                value={formData.name}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-dark-navy border-2 border-cyan/30 rounded text-white font-mono focus:border-cyan focus:outline-none focus:shadow-[0_0_10px_rgba(1,255,255,0.3)] transition-all placeholder-grey"
                placeholder="ex: GitHub"
                required
              />
            </div>

            <div>
              <label htmlFor="username" className="block font-mono text-xs text-cyan uppercase tracking-wider mb-2">
                Identifiant / Email
              </label>
              <input
                id="username"
                name="username"
                type="text"
                value={formData.username}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-dark-navy border-2 border-cyan/30 rounded text-white font-mono focus:border-cyan focus:outline-none focus:shadow-[0_0_10px_rgba(1,255,255,0.3)] transition-all placeholder-grey"
                placeholder="ex: john@email.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block font-mono text-xs text-cyan uppercase tracking-wider mb-2">
                Mot de passe
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full px-4 py-3 pr-24 bg-dark-navy border-2 border-cyan/30 rounded text-white font-mono focus:border-cyan focus:outline-none focus:shadow-[0_0_10px_rgba(1,255,255,0.3)] transition-all placeholder-grey"
                  placeholder="••••••••••••"
                />
                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="p-1.5 text-cyan hover:text-lime rounded transition-colors"
                    title={showPassword ? 'Masquer' : 'Afficher'}
                  >
                    {showPassword ? (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowGenerator(true)}
                    className="p-1.5 text-cyan hover:text-lime rounded transition-colors"
                    title="Générer un mot de passe"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>

            <div>
              <label htmlFor="url" className="block font-mono text-xs text-cyan uppercase tracking-wider mb-2">
                URL
              </label>
              <input
                id="url"
                name="url"
                type="text"
                value={formData.url}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-dark-navy border-2 border-cyan/30 rounded text-white font-mono focus:border-cyan focus:outline-none focus:shadow-[0_0_10px_rgba(1,255,255,0.3)] transition-all placeholder-grey"
                placeholder="ex: github.com"
              />
            </div>

            <div>
              <label htmlFor="notes" className="block font-mono text-xs text-cyan uppercase tracking-wider mb-2">
                Notes
              </label>
              <textarea
                id="notes"
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                rows={3}
                className="w-full px-4 py-3 bg-dark-navy border-2 border-cyan/30 rounded text-white font-mono focus:border-cyan focus:outline-none focus:shadow-[0_0_10px_rgba(1,255,255,0.3)] transition-all resize-none placeholder-grey"
                placeholder="Notes supplémentaires..."
              />
            </div>

            <div className="flex flex-col-reverse sm:flex-row gap-3 pt-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-3 px-4 bg-grey/20 hover:bg-grey/30 text-grey hover:text-white border-2 border-grey/30 font-heading uppercase tracking-wider rounded transition-all"
              >
                [ Annuler ]
              </button>
              <button
                type="submit"
                disabled={loading || !formData.name}
                className="flex-1 bg-lime hover:bg-lime-dim text-dark-navy font-heading uppercase tracking-wider py-3 px-4 rounded transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_15px_rgba(194,254,11,0.4)] hover:shadow-[0_0_25px_rgba(194,254,11,0.6)]"
              >
                {loading ? '[ Enregistrement... ]' : (item ? '[ Modifier ]' : '[ Ajouter ]')}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Password Generator Modal */}
      {showGenerator && (
        <PasswordGenerator
          onSelect={handlePasswordGenerated}
          onClose={() => setShowGenerator(false)}
        />
      )}
    </div>
  );
}
