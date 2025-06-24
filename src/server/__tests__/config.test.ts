import { config } from '../config';

describe('Configuration', () => {
  it('should load environment variables with defaults', () => {
    expect(config.server.port).toBeDefined();
    expect(typeof config.server.port).toBe('number');
    expect(config.aws.region).toBeDefined();
  });
}); 