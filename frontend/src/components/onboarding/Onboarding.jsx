import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronRight, QrCode, Shield, BarChart3 } from 'lucide-react';
import { Button } from '../ui/button';
import Cookies from 'js-cookie';



const slides = [
  {
    icon: QrCode,
    title: 'Digitize Your Warranty',
    description: 'Generate and manage warranty codes in seconds.',
    color: 'from-[#3A9FE1] to-[#1A7FC1]',
  },
  {
    icon: Shield,
    title: 'Verify with Confidence',
    description: 'Build trust with customers through verified warranties.',
    color: 'from-[#1A7FC1] to-[#0F4E78]',
  },
  {
    icon: BarChart3,
    title: 'Track & Analyze',
    description: 'Monitor activations, verifications, and expiry timelines.',
    color: 'from-indigo-500 to-purple-500',
  },
];

export function Onboarding() {
  const navigate = useNavigate();
  const [currentSlide, setCurrentSlide] = useState(0);

  const handleNext = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(currentSlide + 1);
    } else {
      navigate('/signup');
    }
  };

  useEffect(() => {
    const token = Cookies.get('authToken');
    if (token) {
      navigate('/home');
    }
  }, [navigate]);

  return (
    <div className="flex flex-col items-center justify-between min-h-screen p-6 pb-8 max-w-md mx-auto">
      {/* Skip button */}
      {/* <div className="w-full flex justify-end">
        <button
          onClick={handleSkip}
          className="text-slate-500 hover:text-slate-700 transition-colors"
        >
          Skip
        </button>
      </div> */}

      {/* Slides */}
      <div className="flex-1 flex flex-col items-center justify-center w-full">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col items-center text-center space-y-8"
          >
            {/* Icon with gradient background */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
              className={`w-32 h-32 rounded-full bg-gradient-to-br ${slides[currentSlide].color} flex items-center justify-center shadow-2xl`}
            >
              {(() => {
                const Icon = slides[currentSlide].icon;
                return <Icon className="w-16 h-16 text-white" strokeWidth={1.5} />;
              })()}
            </motion.div>

            {/* Title */}
            <h1 className="text-slate-900 max-w-sm">
              {slides[currentSlide].title}
            </h1>

            {/* Description */}
            <p className="text-slate-600 max-w-sm">
              {slides[currentSlide].description}
            </p>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <div className="w-full space-y-6">
        {/* Dots indicator */}
        <div className="flex justify-center gap-2">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={`h-2 rounded-full transition-all ${
                index === currentSlide
                  ? 'w-8 bg-[#1A7FC1]'
                  : 'w-2 bg-slate-300'
              }`}
            />
          ))}
        </div>

        {/* Action button */}
        {currentSlide === slides.length - 1 ? (
          <Button
            onClick={handleNext}
            className="w-full bg-gradient-to-r from-[#3A9FE1] to-[#1A7FC1] hover:from-[#1A7FC1] hover:to-[#0F4E78] text-white h-14 rounded-2xl shadow-lg"
          >
            Start Your eWarranty Journey
          </Button>
        ) : (
          <Button
            onClick={handleNext}
            className="w-full bg-gradient-to-r from-[#3A9FE1] to-[#1A7FC1] hover:from-[#1A7FC1] hover:to-[#0F4E78] text-white h-14 rounded-2xl shadow-lg"
          >
            Next
            <ChevronRight className="w-5 h-5 ml-2" />
          </Button>
        )}
      </div>
    </div>
  );
}