import { motion } from 'framer-motion';

const PageTransition = ({ children }) => {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1, transition: { duration: 0.2, ease: "easeOut" } }}
            exit={{ opacity: 0, y: -5, scale: 0.99, transition: { duration: 0.1, ease: "easeIn" } }}
            className="w-full h-full"
        >
            {children}
        </motion.div>
    );
};

export default PageTransition;
