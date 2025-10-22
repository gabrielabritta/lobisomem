import React from 'react';

interface MasterPassScreenProps {
  onContinue: () => void;
}

const MasterPassScreen: React.FC<MasterPassScreenProps> = ({ onContinue }) => {
  return (
    <div className="card text-center space-y-6">
      <div className="text-6xl">🎭</div>
      <h2 className="text-2xl font-bold">Passe o Dispositivo ao Mestre</h2>
      <p className="text-lg text-dark-300">
        Todas as ações noturnas foram registradas.
      </p>
      <p className="text-lg text-dark-300">
        Agora passe o dispositivo para o <span className="font-bold text-primary-400">Mestre</span>.
      </p>
      <p className="text-sm text-dark-400">
        O mestre terá acesso ao resumo completo das ações da noite.
      </p>
      <button
        onClick={onContinue}
        className="btn-primary text-lg px-8 py-4"
      >
        Mestre Pronto
      </button>
    </div>
  );
};

export default MasterPassScreen;
