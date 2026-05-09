import React from "react";
import {
  LayoutDashboard,
  Store,
  Users,
  Ticket,
  ScrollText,
  BarChart3,
  Wallet,
  Search,
  Bell,
  Plus,
  UserCircle,
  Pencil,
  Trash2,
  Eye,
  Power,
  LogOut,
  FileText,
  CreditCard,
  Building2,
  Package,
} from "lucide-react";

const sidebarItems = [
  { label: "Overview", icon: LayoutDashboard },
  { label: "Finance", icon: FileText, section: true },
  { label: "Dealer Ledger", icon: CreditCard, indent: true },
  { label: "Payment Records", icon: CreditCard, indent: true },
  { label: "My Wallet", icon: Wallet },
  { label: "Reports & Analytics", icon: BarChart3 },
  { label: "Products", icon: Package },
  { label: "Dealers", icon: Store, active: true },
  { label: "Staff", icon: Users },
  { label: "View All Customers", icon: Users },
  { label: "Support Tickets", icon: Ticket },
  { label: "Activity Logs", icon: ScrollText },
  { label: "System Settings", icon: Building2 },
];

const mockDealers = [
  {
    dealer_name: "dealer1",
    company: "dealer1",
    city: "—",
    email: "dealer1@gmail.com",
    phone: "1111111111",
    status: "Active",
    joined: "15 Mar 2025",
  },
];

export function AppMockup() {
  return (
    // <div className = "w-full max-w-3xl mx-auto lg:mx-0 pointer-events-none select-none">
    //   <img 
    //   src = "/app-mockup.png"
    //   alt = "E-Warrantify app preview"
    //   className="w-full h-auto rounded-xl block border-15  border-black shadow-2xl pb-4"
    //   />
    //   </div>

    <div className="w-full max-w-3xl mx-auto lg:mx-0 pointer-events-none select-none">
  <div className="bg-black border-2 border-black shadow-2xl pt-3 px-3 pb-4 rounded-xl">
    <img
      src="/app-mockup.png"
      alt="E-Warrantify app preview"
      className="w-full h-auto block"
    />
  </div>
</div>

  )
  
}
