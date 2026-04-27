export interface Product {
    id: number;
    partName: string;
    brand: string;
    category: string;
    price: number;
    description?: string;
    imageUrl?: string;
    stockQuantity: number;
    condition: string;
    rating: number;
    sku?: string;
    imageUrls?: string[];
    flagged?: boolean;
    flagReason?: string;
    sellerResponse?: string;
    wholesale?: boolean;
    // Garage specific fields
    garagePrice?: number;
    originalPrice?: number;
    // Additional fields from backend
    fitmentCategory?: string;
    color?: string;
    isManualRating?: boolean;
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
