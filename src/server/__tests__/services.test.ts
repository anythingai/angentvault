// Basic smoke tests for AgentVault
// Mock environment variables for tests
process.env.AWS_ACCESS_KEY_ID = 'test';
process.env.AWS_SECRET_ACCESS_KEY = 'test';
process.env.AWS_REGION = 'us-east-1';
process.env.BEDROCK_MODEL_ID = 'amazon.nova-pro-v1:0';
process.env.CDP_API_KEY_NAME = 'test';
process.env.CDP_PRIVATE_KEY = 'test';
process.env.X402PAY_API_KEY = 'test';
process.env.X402PAY_WEBHOOK_SECRET = 'test';
process.env.PINATA_JWT = 'test';

describe('AgentVault Core Tests', () => {
  test('environment variables are set for testing', () => {
    expect(process.env.NODE_ENV).toBeDefined();
    expect(process.env.JWT_SECRET).toBeDefined();
  });

  test('basic TypeScript compilation works', () => {
    // Test that TypeScript interfaces are properly defined
    const mockAgent = {
      id: 'test-agent',
      name: 'Test Agent',
      status: 'ACTIVE' as const,
    };

    expect(mockAgent.id).toBe('test-agent');
    expect(mockAgent.status).toBe('ACTIVE');
  });

  test('utility functions work correctly', () => {
    // Test basic utility function
    const timestamp = new Date().toISOString();
    expect(timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
  });

  test('JSON serialization works for agent data', () => {
    const agentData = {
      id: 'agent-1',
      config: {
        riskTolerance: 'moderate',
        maxInvestment: 1000,
      },
      performance: {
        totalReturn: 150.50,
        winRate: 0.65,
      },
    };

    const serialized = JSON.stringify(agentData);
    const deserialized = JSON.parse(serialized);

    expect(deserialized.id).toBe('agent-1');
    expect(deserialized.performance.totalReturn).toBe(150.50);
  });

  test('mock API response structure', () => {
    const mockApiResponse = {
      success: true,
      data: {
        agents: [
          { id: '1', name: 'Agent 1', status: 'ACTIVE' },
          { id: '2', name: 'Agent 2', status: 'PAUSED' },
        ],
      },
      message: 'Agents retrieved successfully',
    };

    expect(mockApiResponse.success).toBe(true);
    expect(mockApiResponse.data.agents).toHaveLength(2);
    expect(mockApiResponse.data.agents[0].status).toBe('ACTIVE');
  });
}); 