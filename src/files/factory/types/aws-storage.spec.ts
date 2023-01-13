import { AwsStorage } from './aws-storage';

describe('AwsStorage', () => {
  it('should be defined', () => {
    expect(new AwsStorage()).toBeDefined();
  });
});
