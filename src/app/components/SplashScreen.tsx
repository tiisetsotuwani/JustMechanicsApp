import { motion } from 'motion/react';
import logoImage from 'figma:asset/1c30baae5d3fbce3a5794ced261ca572667e4dbf.png';

export function SplashScreen() {
  return (
    <div className="h-screen w-full bg-gradient-to-br from-red-700 via-red-600 to-red-700 flex items-center justify-center">
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="flex flex-col items-center"
      >
        <motion.div
          initial={{ y: 20 }}
          animate={{ y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          <img src={logoImage} alt="JustMechanic Logo" className="w-64 h-auto" />
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.5 }}
          className="mt-8"
        >
          <div className="w-12 h-12 border-4 border-white/30 border-t-white rounded-full animate-spin" />
        </motion.div>
      </motion.div>
    </div>
  );
}
