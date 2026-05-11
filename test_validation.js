const { isValidStrategicPayload } = require('./app/lib/strategicPresentation.js');

const validBehavioralResponse = {
  internal_narrative: "They believe they are already efficient.",
  perceived_obstacles: "Lack of budget and time.",
  emotional_state: "Anxious about change.",
  identity_conflict: "Professional identity tied to old tools.",
  decision_drivers: "Efficiency and cost-saving.",
  authority_dynamics: "Manager makes final call.",
  cultural_norms: "Standardized processes are valued.",
  informal_influence: "Peer recommendations matter.",
  risk_aversion: "Medium risk tolerance.",
  social_validation: "Look for industry leaders' success.",
  status_quo_bias: "High resistance to new workflows.",
  psychological_safety: "Need to feel safe in reporting errors."
};

const testCases = [
  {
    name: "Payload with all CORE fields but missing OPTIONAL fields",
    payload: {
      main_strategic_problem: "Audience is skeptical of claims",
      business_consequence: "Low conversion rates",
      strategic_alignment_score: { value: 75 },
      behavioral_response: validBehavioralResponse
    }
  },
  {
    name: "Payload missing a CORE field (main_strategic_problem)",
    payload: {
      business_consequence: "Low conversion rates",
      strategic_alignment_score: { value: 75 },
      behavioral_response: validBehavioralResponse
    }
  }
];

testCases.forEach(testCase => {
  console.log('--- Running Test: ' + testCase.name + ' ---');
  // Capture log outputs if needed or just use the returned object
  const result = isValidStrategicPayload(testCase.payload);
  console.log('Validation result (boolean):', result.isValid || result === true || (typeof result === 'object' && !result.failedFields));
  // Based on your previous output, it seems it might return a boolean or object. 
  // Let's print the actual object if it's not simply true.
  if (typeof result === 'object') {
     console.log('Passed:', result.isValid !== false);
     console.log('Failed Fields:', result.failedFields || []);
  } else {
     console.log('Passed:', result);
  }
});
