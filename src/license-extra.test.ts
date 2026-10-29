import { it, expect } from 'vitest';
import { demoPayload, signLicense, verifyLicense, isEntitled } from './license';
it('rejects expired keys and wrong tiers; free gameplay stays available',async()=>{
  const expired=await signLicense({...demoPayload(1,'expired'),expiresAt:10});
  expect(await verifyLicense(expired,20)).toBeNull();
  expect(await verifyLicense(await signLicense({...demoPayload(1,'wrong'),tier:'paid' as 'creator'}))).toBeNull();
  expect(isEntitled(null,'free')).toBe(true);expect(isEntitled(null,'creator')).toBe(false);
});
