export interface Product {
  id: number;
  // ProductResponse fields
  partName?: string;
  brand?: string;
  sku?: string;
  category?: string;
  price?: number;
  description?: string;
  imageUrl?: string;
  color?: string;
  stockQuantity?: number;
  fitmentCategory?: string;
  condition?: string;
  installationGuideUrl?: string;
  sellerId?: number;
  imageUrls?: string[];
  // GarageProductDTO fields
  name?: string;           // GarageProductDTO uses 'name' instead of 'partName'
  garagePrice?: number;    // Discounted price for garage customers
  originalPrice?: number;  // Original price (before garage discount)
  // Legacy aliases used by ProductDetailsScreen for cross-shape compatibility
  deviceName?: string;
  manufacturer?: string;
  fittedVehicles?: any[];
  rating?: number;
  isManualRating?: boolean;
  flagged?: boolean;
  flagReason?: string;
  sellerResponse?: string;
  wholesale?: boolean;
}

export type RootStackParamList = {
  Login: undefined;
  Home: undefined;
  AdminDashboard: undefined;
  SellerDashboard: undefined;
  GarageDashboard: undefined;
  Cart: undefined;
  Checkout: undefined;
  Chat: undefined;
  ProductDetails: { product: Product };
  AddProduct: undefined;
  EditProduct: { product: Product };
  OrderHistory: undefined;
  OrderDetails: { orderId: number };
  CustomerProfile: undefined;
  GarageProfile: undefined;
  AdminOrderManagement: undefined;
  AdminInventoryManagement: undefined;
  AdminVehicleManagement: undefined;
  AdminUserManagement: { roleFilter?: string };
  AdminRequests: undefined;
  AdminSettings: undefined;
  AdminProfile: undefined;
  SellerProfile: undefined;
  SellerInventory: undefined;
  SellerOrderHistory: undefined;
  SellerFlaggedProducts: undefined;
  PartRequest: undefined;
  Wishlist: undefined;
  Address: undefined;
  CompleteProfile: { registrationToken: string };
};

export interface AuthResponse {
  token?: string;
  message: string;
  userId?: number;
  role?: string;
  requiresRegistration?: boolean;
  registrationToken?: string;
}
