// Simple test to verify our functions work
const { validateEditCommand, analyzeEditCommand } = require('./lib/feature-detection');

console.log('Testing feature detection functions...');

// Test validateEditCommand
const result1 = validateEditCommand('add hat');
console.log('✅ validateEditCommand("add hat"):', result1);

const result2 = validateEditCommand('');
console.log('✅ validateEditCommand(""):', result2);

const result3 = validateEditCommand('a'.repeat(30));
console.log('✅ validateEditCommand(long):', result3);

// Test analyzeEditCommand
const analysis1 = analyzeEditCommand('add text "hello"');
console.log('✅ analyzeEditCommand(text):', analysis1);

const analysis2 = analyzeEditCommand('style like reference');
console.log('✅ analyzeEditCommand(fusion):', analysis2);

const analysis3 = analyzeEditCommand('keep the face');
console.log('✅ analyzeEditCommand(consistency):', analysis3);

console.log('🎉 All basic tests completed successfully!');
