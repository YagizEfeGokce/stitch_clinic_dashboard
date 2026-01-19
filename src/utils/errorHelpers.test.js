import { describe, it, expect } from 'vitest';
import { translateError, getErrorMessage, handleError } from './errorHelpers';

describe('Error Translation', () => {
    describe('translateError', () => {
        it('should translate invalid login credentials', () => {
            const result = translateError('Invalid login credentials');
            expect(result).toBe('E-posta adresi veya şifre hatalı.');
        });

        it('should translate duplicate key error', () => {
            const result = translateError('duplicate key value violates unique constraint');
            expect(result).toBe('Bu kayıt zaten mevcut.');
        });

        it('should translate network error', () => {
            const result = translateError('NetworkError: Failed to fetch');
            expect(result).toBe('Bağlantı hatası. İnternet bağlantınızı kontrol edin.');
        });

        it('should translate JWT expired error', () => {
            const result = translateError('JWT expired');
            expect(result).toBe('Oturum süreniz doldu. Lütfen tekrar giriş yapın.');
        });

        it('should translate email already registered', () => {
            const result = translateError('User already registered');
            expect(result).toBe('Bu e-posta adresi zaten kullanımda.');
        });

        it('should translate foreign key constraint error', () => {
            const result = translateError('foreign key constraint violated');
            expect(result).toBe('Bu kayıt başka kayıtlarla ilişkili olduğu için silinemez.');
        });

        it('should translate row level security error', () => {
            const result = translateError('violates row-level security');
            expect(result).toBe('Bu veriye erişim izniniz yok.');
        });

        it('should translate timeout error', () => {
            const result = translateError('timeout');
            expect(result).toBe('İstek zaman aşımına uğradı. Lütfen tekrar deneyin.');
        });

        it('should return default message for unknown error', () => {
            const result = translateError('Some random unknown error message');
            expect(result).toBe('Bir hata oluştu. Lütfen tekrar deneyin.');
        });

        it('should handle empty string', () => {
            const result = translateError('');
            expect(result).toBe('Bir hata oluştu.');
        });

        it('should handle null/undefined', () => {
            expect(translateError(null)).toBe('Bir hata oluştu.');
            expect(translateError(undefined)).toBe('Bir hata oluştu.');
        });
    });

    describe('getErrorMessage', () => {
        it('should extract message from string', () => {
            const result = getErrorMessage('Simple error message');
            expect(result).toBe('Simple error message');
        });

        it('should extract message from Error object', () => {
            const error = new Error('Error object message');
            const result = getErrorMessage(error);
            expect(result).toBe('Error object message');
        });

        it('should extract message from Supabase-style error', () => {
            const error = { message: 'Supabase error message' };
            const result = getErrorMessage(error);
            expect(result).toBe('Supabase error message');
        });

        it('should extract from error_description field', () => {
            const error = { error_description: 'OAuth error description' };
            const result = getErrorMessage(error);
            expect(result).toBe('OAuth error description');
        });

        it('should return empty string for null/undefined', () => {
            expect(getErrorMessage(null)).toBe('');
            expect(getErrorMessage(undefined)).toBe('');
        });
    });

    describe('handleError', () => {
        it('should return translated error message', () => {
            const result = handleError({ message: 'Invalid login credentials' });
            expect(result).toBe('E-posta adresi veya şifre hatalı.');
        });

        it('should handle string errors', () => {
            const result = handleError('Network error');
            expect(result).toBe('Bağlantı hatası. İnternet bağlantınızı kontrol edin.');
        });

        it('should return generic message for unknown errors', () => {
            const result = handleError('Some unknown error');
            expect(result).toBe('Bir hata oluştu. Lütfen tekrar deneyin.');
        });
    });
});
