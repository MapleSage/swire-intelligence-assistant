const { BedrockAgentRuntimeClient, InvokeAgentCommand } = require('@aws-sdk/client-bedrock-agent-runtime');

const client = new BedrockAgentRuntimeClient({
  region: 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

async function testAgent() {
  try {
    const command = new InvokeAgentCommand({
      agentId: 'XMJHPK00RO',
      agentAliasId: 'TSTALIASID',
      sessionId: `test-session-${Date.now()}`,
      inputText: 'What is Swire Renewable Energy? Tell me about their Formosa Offshore Wind project.',
    });

    console.log('Testing Bedrock Agent with Swire query...');
    const response = await client.send(command);
    
    let fullResponse = '';
    if (response.completion) {
      const decoder = new TextDecoder();
      for await (const chunk of response.completion) {
        if (chunk.chunk && chunk.chunk.bytes) {
          const text = decoder.decode(chunk.chunk.bytes);
          fullResponse += text;
          process.stdout.write(text);
        }
      }
    }
    
    console.log('\n\n--- Test Complete ---');
    console.log('Full Response:', fullResponse);
    
  } catch (error) {
    console.error('Error testing agent:', error);
  }
}

testAgent();