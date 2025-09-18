/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React from 'react';
import { XMarkIcon } from './icons';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center animate-fade-in" onClick={onClose} aria-modal="true" role="dialog">
      <div className="bg-gray-800 border border-gray-700 rounded-2xl shadow-2xl shadow-blue-500/10 w-full max-w-lg m-4 p-6 text-gray-200 relative" onClick={e => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors" aria-label="Close Help">
          <XMarkIcon className="w-6 h-6" />
        </button>

        <h2 className="text-2xl font-bold mb-4">Help</h2>
        
        <p className="text-gray-300">
            For any suggestions or questions <a href="https://github.com/aigem/aice_ps/issues/new/choose" target="_blank" rel="noopener noreferrer" className="font-bold underline text-blue-400 hover:text-blue-300">[ Please submit an ISSUE ]</a>
        </p>
        <p className="text-gray-300">
          Note: If using the official Gemini API, charges will apply. Please use with caution.
        </p>
        <p className="text-gray-300">
           <a href="https://cnb.build/no.1/api/-/issues/2" target="_blank" rel="noopener noreferrer" className="font-bold underline hover:text-cyan-200">Cost-Effective API Platform</a>.
        </p>
        <p className="text-gray-300">
           <a href="https://cnb.build/no.1/api/-/issues/1" target="_blank" rel="noopener noreferrer" className="font-bold underline hover:text-cyan-200">Welcome to communicate and customize</a>.
        </p>
      </div>
    </div>
  );
};

export default HelpModal;
