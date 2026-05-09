import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

const connectionString = process.env.DATABASE_URL;
const maskDatabaseUrl = (value) => {
  if (!value) return value;
  try {
    const u = new URL(value);
    if (u.password) u.password = "****";
    return u.toString();
  } catch {
    // Fallback for non-standard strings: mask :password@ in protocol://user:password@host
    return String(value).replace(/:\/\/([^:/@]+):([^@]+)@/g, "://$1:****@");
  }
};

// Print once at startup (masked) to verify env is loaded
const pool = new pg.Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const User = prisma.user;
const Provider = prisma.provider;
const Owner = prisma.provider; // Alias for compatibility with Owner module
const Staff = prisma.staff;
const StaffRole = prisma.staffRole;
const StaffRolePermission = prisma.staffRolePermission;
const ProviderSubscription = prisma.providerSubscription;
const SubscriptionPlan = prisma.subscriptionPlan;
const SubscriptionPlanModule = prisma.subscriptionPlanModule;
const ProviderModuleAccess = prisma.providerModuleAccess;
const Module = prisma.module;
const SubModule = prisma.subModule;
const Franchise = prisma.franchise;
const Category = prisma.category;
const FranchiseInventory = prisma.franchiseInventory;
const FranchiseService = prisma.franchiseService;
const CustomerCategory = prisma.customerCategory;
const ProviderCustomers = prisma.providerCustomers;
const ProviderCustomerVehicle = prisma.providerCustomerVehicle;
const TermsAndConditions = prisma.termsAndConditions;
const FranchiseServicePackage = prisma.franchiseServicePackage;
const ProviderBankDetails = prisma.providerBankDetails;
const PurchaseInvoice = prisma.purchaseInvoice;
const PurchasePart = prisma.purchasePart;
const PurchaseService = prisma.purchaseService;
const PurchasePackage = prisma.purchasePackage;
const PurchaseAdditionalCharges = prisma.purchaseAdditionalCharges;
const PurchaseCustomerVehicle = prisma.purchaseCustomerVehicle;
const PurchaseInvoiceTransactions = prisma.purchaseInvoiceTransactions;
const Expenses = prisma.expenses;
const SalesInvoice = prisma.salesInvoice;
const SalesPart = prisma.salesPart;
const SalesService = prisma.salesService;
const SalesPackage = prisma.salesPackage;
const SalesAdditionalCharges = prisma.salesAdditionalCharges;
const SalesCustomerVehicle = prisma.salesCustomerVehicle;
const SalesInvoiceParty = prisma.salesInvoiceParty;
const SalesInvoiceTransactions = prisma.salesInvoiceTransactions;
const Transaction = prisma.transaction;
const ProviderTax = prisma.providerTax;
const ExpenseCategory = prisma.expenseCategory;
const ProviderDealer = prisma.providerDealer;
const ServiceCenter = prisma.serviceCenter;
const ProviderWarrantyProduct = prisma.providerWarrantyProduct;
const ProviderWarrantySetting = prisma.providerWarrantySetting;
const ProviderProductWarrantyCode = prisma.providerProductWarrantyCode;
const ProviderWarrantyCustomer = prisma.providerWarrantyCustomer;
const FranchiseInventoryTransaction = prisma.franchiseInventoryTransaction;
const PurchaseInvoiceParty = prisma.purchaseInvoiceParty;
const VehicleModel = prisma.vehicleModel;
const VehicleType = prisma.vehicleType;
const ProviderNotification = prisma.providerNotification;
const Lead = prisma.lead;
const Appointment = prisma.appointment;
const AppointmentOccurrence = prisma.appointmentOccurrence;
const BalanceSheet = prisma.balanceSheet;
const Department = prisma.department;
const SupportTicket = prisma.supportTicket;
const SupportTicketHistory = prisma.supportTicketHistory;
const QuickSettings = prisma.quickSettings;
const FranchiseOpenInventory = prisma.franchiseOpenInventory;
const InvoiceSettings = prisma.invoiceSettings;
const Notification = prisma.notification;
const BookingSettings = prisma.bookingSettings;
const Booking = prisma.booking;
const BookingTransactional = prisma.bookingTransactional;
const VehicleBookingOthers = prisma.vehicleBookingOthers;
const CustomerRequirements = prisma.customerRequirements;
const BookingCustomerRequirements = prisma.bookingCustomerRequirements;
const BookingTechnicians = prisma.bookingTechnicians;
const BookingServicePackages = prisma.bookingServicePackages;
const BookingServices = prisma.bookingServices;
const BookingParts = prisma.bookingParts;
const BookingQualityChecks = prisma.bookingQualityChecks;
const BookingWorkDetails = prisma.bookingWorkDetails;
const FranchiseOpenInventoryTransaction = prisma.franchiseOpenInventoryTransaction;
const BookingWorkDetailsTransactions = prisma.bookingWorkDetailsTransactions;
const AuditLog = prisma.auditLog;
const RevokedToken = prisma.revokedToken;
const Dealer = prisma.providerDealer; // Alias for compatibility with Dealer module
const Role = prisma.role;
const SubRole = prisma.subRole;
const UserRole = prisma.userRole;
const WarrantyClaim = prisma.warrantyClaim;
const WarrantyClaimHistory = prisma.warrantyClaimHistory;
const DealerPurchaseOrder = prisma.dealerPurchaseOrder;
const DealerPurchaseItem = prisma.dealerPurchaseItem;
const DealerSalesEntry = prisma.dealerSalesEntry;
const DealerLedger = prisma.dealerLedger;
const StaffDealerAssignment = prisma.staffDealerAssignment;
const ProductMaster = prisma.productMaster;
const WarrantyPolicy = prisma.warrantyPolicy;
const WarrantyBatch = prisma.warrantyBatch;
const Otp = prisma.otp;
const WarrantyTemplateCategory = prisma.warrantyTemplateCategory;
const WarrantyTemplate = prisma.warrantyTemplate;
const WarrantyTemplateField = prisma.warrantyTemplateField;
const WarrantyRegistration = prisma.warrantyRegistration;

// Coins System Models
const CoinPackage = prisma.coinPackage;
const ProviderCoinBalance = prisma.providerCoinBalance;
const CoinTransaction = prisma.coinTransaction;
const ReferralCode = prisma.referralCode;
const Referral = prisma.referral;
const CoinPricing = prisma.coinPricing;
const WarrantyCostConfig = prisma.warrantyCostConfig;
const SuperAdminActivityLog = prisma.superAdminActivityLog;
const PlatformActivityLog = prisma.platformActivityLog;

export {
  prisma,
  User,
  Provider,
  ProviderSubscription,
  SubscriptionPlan,
  SubscriptionPlanModule,
  ProviderModuleAccess,
  Module,
  SubModule,
  Franchise,
  Category,
  FranchiseInventory,
  FranchiseService,
  CustomerCategory,
  ProviderCustomers,
  ProviderCustomerVehicle,
  TermsAndConditions,
  FranchiseServicePackage,
  ProviderBankDetails,
  PurchaseInvoice,
  PurchasePart,
  PurchaseService,
  PurchasePackage,
  PurchaseAdditionalCharges,
  PurchaseCustomerVehicle,
  PurchaseInvoiceTransactions,
  Expenses,
  SalesInvoice,
  SalesPart,
  SalesService,
  SalesPackage,
  SalesAdditionalCharges,
  SalesCustomerVehicle,
  SalesInvoiceParty,
  SalesInvoiceTransactions,
  Transaction,
  ProviderTax,
  Staff,
  ExpenseCategory,
  StaffRole,
  StaffRolePermission,
  ProviderDealer,
  ServiceCenter,
  ProviderWarrantyProduct,
  ProviderWarrantySetting,
  ProviderProductWarrantyCode,
  ProviderWarrantyCustomer,
  BalanceSheet,
  FranchiseInventoryTransaction,
  PurchaseInvoiceParty,
  VehicleModel,
  VehicleType,
  ProviderNotification,
  Lead,
  Appointment,
  AppointmentOccurrence,
  Department,
  SupportTicket,
  SupportTicketHistory,
  QuickSettings,
  FranchiseOpenInventory,
  InvoiceSettings,
  Notification,
  BookingSettings,
  Booking,
  BookingTransactional,
  VehicleBookingOthers,
  CustomerRequirements,
  BookingCustomerRequirements,
  BookingTechnicians,
  BookingServicePackages,
  BookingServices,
  BookingParts,
  BookingQualityChecks,
  BookingWorkDetails,
  FranchiseOpenInventoryTransaction,
  BookingWorkDetailsTransactions,
  AuditLog,
  RevokedToken,
  Owner,
  Dealer,
  Role,
  SubRole,
  UserRole,
  WarrantyClaim,
  WarrantyClaimHistory,
  DealerPurchaseOrder,
  DealerPurchaseItem,
  DealerSalesEntry,
  DealerLedger,
  StaffDealerAssignment,
  ProductMaster,
  WarrantyPolicy,
  WarrantyBatch,
  Otp,
  WarrantyTemplateCategory,
  WarrantyTemplate,
  WarrantyTemplateField,
  WarrantyRegistration,
  // Coins System
  CoinPackage,
  ProviderCoinBalance,
  CoinTransaction,
  ReferralCode,
  Referral,
  CoinPricing,
  WarrantyCostConfig,
  SuperAdminActivityLog,
  PlatformActivityLog,
};
