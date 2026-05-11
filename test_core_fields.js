const { isValidStrategicPayload } = require('./app/lib/strategicPresentation.js');

const behavioral_response = {
  perceived_message: 'Product is overpriced',
  emotional_state: 'Defensive skepticism',
  likely_objection: 'Why should I trust this?',
  trust_gap: 'No social proof',
  identity_alignment: 'Not for people like me',
  commitment_readiness: 'Low purchase intent',
  resistance_trigger: 'Marketing hype',
  likely_behavior: 'Research competitors',
  curiosity_vs_intent_balance: 'High curiosity, low intent',
  risk_aversion: 'Fear of wasting money',
  confidence_building: 'Need testimonials',
  commitment_pressure: 'Ready to delay'
};

const payload = {
  main_strategic_problem: 'Skeptical audience doubts authenticity',
  business_consequence: 'Low conversion and customer retention',
  strategic_alignment_score: { value: 82 },
  behavioral_response: behavioral_response
};

console.log('--- STARTING VALIDATION TEST ---');
const isValid = isValidStrategicPayload(payload);

console.log('--- FINAL SUMMARY ---');
console.log('Final validation result (passed):', isValid);
// Note: Based on the source code, isValidStrategicPayload returns a boolean.
// To get the failed fields, we'd need to mock console.log or window, 
// but since we want it to PASS (true), failedFields should be empty anyway.
