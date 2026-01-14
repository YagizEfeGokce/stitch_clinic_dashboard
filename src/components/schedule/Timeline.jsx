export default function Timeline({ children }) {
    return (
        <div className="relative flex flex-col w-full px-5 py-6 gap-6">
            {children}
        </div>
    );
}
