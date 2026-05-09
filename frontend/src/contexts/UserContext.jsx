// import { createContext, useContext, useState, useEffect } from 'react';
// import { getUserDetails } from '../utils/api';
// import Cookies from 'js-cookie';

// const UserContext = createContext(null);

// export function UserProvider({ children }) {
//   const [user, setUser] = useState(null);
//   const [selectedRole, setSelectedRole] = useState(Cookies.get('role'));
//   const [isLoading, setIsLoading] = useState(false);
   
//   useEffect(() => {
//     const fetchUserDetails = async () => {
//       setIsLoading(true);
//       const userDetails = await getUserDetails();
//       console.log("User Details:", userDetails);
//       setUser(userDetails);
//       setSelectedRole(userDetails.role || 'customer');
//       setIsLoading(false);
//     };
//     fetchUserDetails();
//   }, []);

//   // const handleRoleSwitch = (newRole) => {
//   //   if (user) {
//   //     // Update user role while keeping other data
//   //     let name, company;
//   //     switch (newRole) {
//   //       case 'customer':
//   //         name = 'John Doe';
//   //         company = 'N/A';
//   //         break;
//   //       case 'dealer':
//   //         name = 'Jane Smith';
//   //         company = 'Tech Dealers Inc.';
//   //         break;
//   //       case 'owner':
//   //         name = 'Alex Johnson';
//   //         company = 'TechBrand Corp.';
//   //         break;
//   //       case 'staff':
//   //         name = 'Staff Member';
//   //         company = 'TechBrand Corp.';
//   //         break;
//   //       default:
//   //         name = user.fullname;
//   //         company = user.companyname;
//   //     }
      
//   //     setUser({
//   //       ...user,
//   //       role: newRole,
//   //       fullname: name,
//   //       companyname: company,
//   //     });
//   //     setSelectedRole(newRole);
//   //   }
//   // };

//   return (
//     <UserContext.Provider
//       value={{
//         user,
//         isLoading,
//         selectedRole,
//         setSelectedRole,
//         // handleLogin,
//         // handleLogout,
//         // handleRoleSwitch,
//       }}
//     >
//       {children}
//     </UserContext.Provider>
//   );
// }

// export function useUser() {
//   const context = useContext(UserContext);
//   if (!context) {
//     throw new Error('useUser must be used within a UserProvider');
//   }
//   return context;
// }
