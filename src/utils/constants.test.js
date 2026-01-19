import { describe, it, expect } from 'vitest';
import { ROLES, TIMEOUTS } from './constants';

describe('Application Constants', () => {
    describe('ROLES', () => {
        it('should define all user roles', () => {
            expect(ROLES.OWNER).toBe('owner');
            expect(ROLES.ADMIN).toBe('admin');
            expect(ROLES.DOCTOR).toBe('doctor');
            expect(ROLES.STAFF).toBe('staff');
        });

        it('should have string values', () => {
            expect(typeof ROLES.OWNER).toBe('string');
            expect(typeof ROLES.ADMIN).toBe('string');
            expect(typeof ROLES.DOCTOR).toBe('string');
            expect(typeof ROLES.STAFF).toBe('string');
        });

        it('should have 4 roles defined', () => {
            expect(Object.keys(ROLES)).toHaveLength(4);
        });
    });

    describe('TIMEOUTS', () => {
        it('should define timeout values', () => {
            expect(TIMEOUTS.AUTH_INIT).toBe(5000);
            expect(TIMEOUTS.AUTH_FAILSAFE).toBe(16000);
            expect(TIMEOUTS.LOADING_RETRY).toBe(5000);
        });

        it('should have numeric values', () => {
            expect(typeof TIMEOUTS.AUTH_INIT).toBe('number');
            expect(typeof TIMEOUTS.AUTH_FAILSAFE).toBe('number');
        });
    });
});
