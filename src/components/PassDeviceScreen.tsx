
import React from 'react';

interface PassDeviceScreenProps {
  nextPlayerName: string;
  onContinue: () => void;
}

const PassDeviceScreen: React.FC<PassDeviceScreenProps> = ({ nextPlayerName, onContinue }) => {
  return (
    <div className="card text-center space-y-6">
      <h2 className="text-2xl font-bold">Próximo Jogador</h2>
      <p className="text-lg">Passe o dispositivo para <span className="font-bold text-primary-400">{nextPlayerName}</span>.</p>
      <p className="text-dark-300">Quando estiver pronto, pressione o botão abaixo.</p>
      <button
        onClick={onContinue}
        className="btn-primary text-lg px-8 py-4"
      >
        Estou Pronto
      </button>
    </div>
  );
};

export default PassDeviceScreen;
