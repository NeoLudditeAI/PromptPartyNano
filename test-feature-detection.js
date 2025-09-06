// Test our feature detection functions
const { validateEditCommand, analyzeEditCommand } = require('./lib/feature-detection');

console.log('🧪 Testing feature detection functions...');

// Test validateEditCommand
console.log('
✅ Testing validateEditCommand:');
const result1 = validateEditCommand('add hat');
console.log('  "add hat":', result1);

const result2 = validateEditCommand('');
console.log('  "":', result2);

const result3 = validateEditCommand('a'.repeat(30));
console.log('  long command:', result3);

// Test analyzeEditCommand
console.log('
✅ Testing analyzeEditCommand:');
const analysis1 = analyzeEditCommand('add text "hello"');
console.log('  text command:', analysis1);

const analysis2 = analyzeEditCommand('style like reference');
console.log('  fusion command:', analysis2);

const analysis3 = analyzeEditCommand('keep the face');
console.log('  consistency command:', analysis3);

console.log('
🎉 All tests completed successfully!');
