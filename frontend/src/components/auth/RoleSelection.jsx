// import { useNavigate } from 'react-router-dom';
// import { motion } from 'motion/react';
// import { Shield, ShoppingBag, Store, Crown, Users } from 'lucide-react';
// import { useUser } from '../../contexts/UserContext';


// const roles = [
//   {
//     role: 'customer',
//     icon: ShoppingBag,
//     title: 'Customer',
//     description: 'View and manage your product warranties',
//     gradient: 'from-blue-500 to-indigo-500',
//   },
//   {
//     role: 'dealer',
//     icon: Store,
//     title: 'Dealer',
//     description: 'Register products and manage warranties',
//     gradient: 'from-cyan-500 to-blue-500',
//   },
//   {
//     role: 'staff',
//     icon: Users,
//     title: 'Staff',
//     description: 'Handle claims, support tickets and assistance',
//     gradient: 'from-emerald-500 to-teal-500',
//   },
//   {
//     role: 'owner',
//     icon: Crown,
//     title: 'Brand Owner',
//     description: 'Complete system control and analytics',
//     gradient: 'from-purple-500 to-pink-500',
//   },
// ];

// export function RoleSelection() {
//   const navigate = useNavigate();
//   const { setSelectedRole } = useUser();

//   const handleSelectRole = (role) => {
//     setSelectedRole(role);
//     navigate('/login');
//   };
//   return (
//     <div className="flex flex-col min-h-screen p-6 max-w-md mx-auto">
//       <motion.div
//         initial={{ opacity: 0, y: 20 }}
//         animate={{ opacity: 1, y: 0 }}
//         className="flex-1 flex flex-col justify-center space-y-8"
//       >
//         {/* Logo and header */}
//         <div className="text-center space-y-4">
//           <motion.div
//             initial={{ scale: 0 }}
//             animate={{ scale: 1 }}
//             transition={{ type: 'spring', stiffness: 200 }}
//             className="w-20 h-20 mx-auto rounded-3xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-xl"
//           >
//             <Shield className="w-10 h-10 text-white" strokeWidth={2} />
//           </motion.div>
//           <div>
//             <h1 className="text-slate-900">Welcome to eWarranty</h1>
//             <p className="text-slate-600 mt-2">
//               Choose your account type to continue
//             </p>
//           </div>
//         </div>

//         {/* Role cards */}
//         <div className="space-y-4">
//           {roles.map((roleOption, index) => (
//             <motion.button
//               key={roleOption.role}
//               initial={{ opacity: 0, y: 20 }}
//               animate={{ opacity: 1, y: 0 }}
//               transition={{ delay: index * 0.1 + 0.2 }}
//               whileTap={{ scale: 0.97 }}
//               onClick={() => handleSelectRole(roleOption.role)}
//               className="w-full bg-white rounded-2xl p-6 shadow-md hover:shadow-xl transition-all text-left"
//             >
//               <div className="flex items-center gap-4">
//                 <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${roleOption.gradient} flex items-center justify-center shadow-lg flex-shrink-0`}>
//                   <roleOption.icon className="w-8 h-8 text-white" strokeWidth={2} />
//                 </div>
//                 <div className="flex-1">
//                   <h3 className="text-slate-900 mb-1">{roleOption.title}</h3>
//                   <p className="text-slate-600 text-sm">
//                     {roleOption.description}
//                   </p>
//                 </div>
//               </div>
//             </motion.button>
//           ))}
//         </div>
//       </motion.div>
//     </div>
//   );
// }