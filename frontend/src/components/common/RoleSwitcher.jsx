import { motion, AnimatePresence } from 'motion/react';
import { ShoppingBag, Store, Crown, Users, X } from 'lucide-react';
import { useState } from 'react';
import Cookies from 'js-cookie';



export function RoleSwitcher() {
  const currentRole = Cookies.get('role');
  const [isOpen, setIsOpen] = useState(false);

  const roles = [
    {
      role: 'customer',
      icon: ShoppingBag,
      title: 'Customer',
      gradient: 'from-blue-500 to-indigo-500',
    },
    {
      role: 'dealer',
      icon: Store,
      title: 'Dealer',
      gradient: 'from-cyan-500 to-blue-500',
    },
    {
      role: 'staff',
      icon: Users,
      title: 'Staff',
      gradient: 'from-emerald-500 to-teal-500',
    },
    {
      role: 'owner',
      icon: Crown,
      title: 'Owner',
      gradient: 'from-purple-500 to-pink-500',
    },
  ];

  const currentRoleData = roles.find((r) => r.role === currentRole);

  return (
    <>
      {/* Floating button */}
      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(true)}
        className="fixed bottom-24 right-6 z-50 w-14 h-14 rounded-full bg-gradient-to-br from-slate-800 to-slate-900 shadow-2xl flex items-center justify-center text-white"
      >
        {currentRoleData && <currentRoleData.icon className="w-6 h-6" />}
      </motion.button>

      {/* Modal */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60]"
            />

            {/* Modal content */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[70] w-[90%] max-w-md"
            >
              <div className="bg-white rounded-3xl p-6 shadow-2xl">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-slate-900 mb-1">Switch Role</h3>
                    <p className="text-slate-600 text-sm">Demo mode - test different user types</p>
                  </div>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="w-10 h-10 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors"
                  >
                    <X className="w-5 h-5 text-slate-600" />
                  </button>
                </div>

                <div className="space-y-3">
                  {roles.map((role) => (
                    <motion.button
                      key={role.role}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => {
                        Cookies.set('role', role.role);
                        setIsOpen(false);
                        window.location.reload();
                      }}
                      className={`w-full rounded-2xl p-4 text-left transition-all ${
                        currentRole === role.role
                          ? 'bg-gradient-to-br ' + role.gradient + ' shadow-lg'
                          : 'bg-slate-50 hover:bg-slate-100'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div
                          className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                            currentRole === role.role
                              ? 'bg-white/20 backdrop-blur-sm'
                              : 'bg-white'
                          }`}
                        >
                          <role.icon
                            className={`w-6 h-6 ${
                              currentRole === role.role ? 'text-white' : 'text-slate-600'
                            }`}
                            strokeWidth={2}
                          />
                        </div>
                        <div className="flex-1">
                          <p
                            className={`${
                              currentRole === role.role ? 'text-white' : 'text-slate-900'
                            }`}
                          >
                            {role.title}
                          </p>
                          {currentRole === role.role && (
                            <p className="text-white/80 text-sm">Current role</p>
                          )}
                        </div>
                      </div>
                    </motion.button>
                  ))}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}