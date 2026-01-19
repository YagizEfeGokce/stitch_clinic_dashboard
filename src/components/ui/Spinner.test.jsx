import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Spinner, ButtonSpinner, InlineSpinner, PageSpinner } from './Spinner';

describe('Spinner Components', () => {
    describe('Spinner', () => {
        it('should render with default props', () => {
            render(<Spinner />);
            const spinner = screen.getByRole('status');
            expect(spinner).toBeInTheDocument();
            expect(spinner).toHaveAttribute('aria-label', 'Yükleniyor...');
        });

        it('should apply size classes correctly', () => {
            const { rerender } = render(<Spinner size="sm" />);
            expect(screen.getByRole('status')).toHaveClass('text-sm');

            rerender(<Spinner size="md" />);
            expect(screen.getByRole('status')).toHaveClass('text-xl');

            rerender(<Spinner size="lg" />);
            expect(screen.getByRole('status')).toHaveClass('text-3xl');

            rerender(<Spinner size="xl" />);
            expect(screen.getByRole('status')).toHaveClass('text-4xl');
        });

        it('should apply color classes correctly', () => {
            const { rerender } = render(<Spinner color="primary" />);
            expect(screen.getByRole('status')).toHaveClass('text-primary');

            rerender(<Spinner color="white" />);
            expect(screen.getByRole('status')).toHaveClass('text-white');

            rerender(<Spinner color="muted" />);
            expect(screen.getByRole('status')).toHaveClass('text-slate-400');
        });

        it('should have animate-spin class for animation', () => {
            render(<Spinner />);
            expect(screen.getByRole('status')).toHaveClass('animate-spin');
        });

        it('should accept custom className', () => {
            render(<Spinner className="custom-class" />);
            expect(screen.getByRole('status')).toHaveClass('custom-class');
        });

        it('should contain progress_activity icon text', () => {
            render(<Spinner />);
            expect(screen.getByRole('status')).toHaveTextContent('progress_activity');
        });
    });

    describe('ButtonSpinner', () => {
        it('should render with white color and small size', () => {
            render(<ButtonSpinner />);
            const spinner = screen.getByRole('status');
            expect(spinner).toHaveClass('text-white');
            expect(spinner).toHaveClass('text-sm');
        });
    });

    describe('InlineSpinner', () => {
        it('should render with message', () => {
            render(<InlineSpinner message="Veriler yükleniyor..." />);
            expect(screen.getByText('Veriler yükleniyor...')).toBeInTheDocument();
            expect(screen.getByRole('status')).toBeInTheDocument();
        });

        it('should render without message', () => {
            render(<InlineSpinner />);
            expect(screen.getByRole('status')).toBeInTheDocument();
        });
    });

    describe('PageSpinner', () => {
        it('should render with message', () => {
            render(<PageSpinner message="Sayfa yükleniyor..." />);
            expect(screen.getByText('Sayfa yükleniyor...')).toBeInTheDocument();
            expect(screen.getByRole('status')).toBeInTheDocument();
        });

        it('should render large spinner by default', () => {
            render(<PageSpinner />);
            expect(screen.getByRole('status')).toHaveClass('text-4xl');
        });
    });
});
