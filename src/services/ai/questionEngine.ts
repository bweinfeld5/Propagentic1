export type FollowUpQuestion = string;

import { ModelMessage } from '../modelContext';

function detectIssueType(messages: ModelMessage[]): string | null {
  const text = messages.map(m => m.content.toLowerCase()).join(' ');
  if (/leak|pipe|faucet|sink|toilet/.test(text)) {
    return 'plumbing';
  }
  if (/electrical|outlet|switch|breaker|power/.test(text)) {
    return 'electrical';
  }
  if (/hvac|heater|ac|air conditioner|temperature/.test(text)) {
    return 'hvac';
  }
  if (/fridge|refrigerator|stove|oven|dishwasher|washer|dryer/.test(text)) {
    return 'appliance';
  }
  if (/wall|door|window|floor|ceiling|roof/.test(text)) {
    return 'structural';
  }
  return null;
}

export function generateFollowUpQuestions(messages: ModelMessage[]): FollowUpQuestion[] {
  const issue = detectIssueType(messages) || 'other';

  const questionBank: Record<string, FollowUpQuestion[]> = {
    plumbing: [
      'Is the leak constant or intermittent?',
      'Can you shut off the water supply to stop the leak?'
    ],
    electrical: [
      'Does the problem affect multiple outlets or just one?',
      'Have you noticed any flickering lights or burning smells?'
    ],
    hvac: [
      'Is the system running but not heating or cooling?',
      'When was the last time the filter was replaced?'
    ],
    appliance: [
      'What is the make and model of the appliance?',
      'Have you seen any error codes or unusual noises?'
    ],
    structural: [
      'Has this issue been getting worse over time?',
      'Could you provide a photo of the affected area?'
    ],
    other: [
      'Could you share more details about the issue?',
      'A photo would help us understand better.'
    ]
  };

  const baseQuestions = questionBank[issue] || questionBank.other;

  return baseQuestions;
}
