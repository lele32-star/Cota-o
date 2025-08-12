// data.js - mock dataset for Hawker 400 Trainer
// Structure: export const QUESTIONS = { limitations: [...], memoryItems: [...] };
// Each limitation question: { id, type, question, options, answer, reference, tolerance }
// type can be 'single', 'multi', 'numeric', or 'text'.
// Each memory item: { id, title, prompt, officialSequence, acceptableKeywords, hint, reference }

export const QUESTIONS = {
  limitations: [
    {
      id: 'lim-n1-max',
      type: 'single',
      question: 'Qual o limite máximo de N1 em operação normal?',
      options: ['100.0%', '101.1%', '102.0%', '98.5%'],
      answer: '101.1%',
      reference: 'AFM Limitations – N1',
    },
    {
      id: 'lim-oat-start',
      type: 'numeric',
      question: 'Temperatura externa máxima para partida (°C)?',
      answer: 52,
      tolerance: 1,
      reference: 'AFM Limitations – OAT',
    },
  ],
  memoryItems: [
    {
      id: 'mem-engine-fire-below-v1',
      title: 'Fogo no motor abaixo da V1',
      prompt: 'Liste a sequência correta do Memory Item.',
      officialSequence: [
        'Thrust levers — IDLE',
        'Brakes — APPLY',
        'Thrust reversers — DEPLOY (se aplicável)',
        'STOP the aircraft',
      ],
      acceptableKeywords: [
        ['thrust', 'idle'],
        ['brake', 'apply'],
        ['reverse', 'deploy'],
        ['stop'],
      ],
      hint: 'Pense: reduzir, frear, reverter, parar.',
      reference: 'QRH – Abnormal/Emergency',
    },
  ],
};
