
import { Product, Category, Order } from '../types';

/**
 * ApiService provides a persistence layer for products, categories, and orders.
 * It uses localStorage to ensure the application state is maintained across sessions.
 */
const STORAGE_KEYS = {
  PRODUCTS: 'elite_products',
  CATEGORIES: 'elite_categories',
  ORDERS: 'elite_orders',
};

const getFromStorage = <T>(key: string, defaultValue: T): T => {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : defaultValue;
  } catch (error) {
    console.error(`Error reading from storage for key ${key}:`, error);
    return defaultValue;
  }
};

const saveToStorage = <T>(key: string, data: T): void => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error(`Error saving to storage for key ${key}:`, error);
  }
};

export const ApiService = {
  /**
   * Retrieves all products from the store.
   */
  getProducts: async (): Promise<Product[]> => {
    return getFromStorage<Product[]>(STORAGE_KEYS.PRODUCTS, []);
  },

  /**
   * Adds a new product to the catalog.
   */
  addProduct: async (product: Product): Promise<void> => {
    const products = await ApiService.getProducts();
    saveToStorage(STORAGE_KEYS.PRODUCTS, [product, ...products]);
  },

  /**
   * Updates existing product details including stock levels.
   */
  updateProduct: async (product: Product): Promise<void> => {
    const products = await ApiService.getProducts();
    const updated = products.map(p => p.id === product.id ? product : p);
    saveToStorage(STORAGE_KEYS.PRODUCTS, updated);
  },

  /**
   * Removes a product from the catalog.
   */
  deleteProduct: async (id: string): Promise<boolean> => {
    const products = await ApiService.getProducts();
    saveToStorage(STORAGE_KEYS.PRODUCTS, products.filter(p => p.id !== id));
    return true;
  },

  /**
   * Retrieves all product categories.
   */
  getCategories: async (): Promise<Category[]> => {
    return getFromStorage<Category[]>(STORAGE_KEYS.CATEGORIES, []);
  },

  /**
   * Adds a new category.
   */
  addCategory: async (category: Category): Promise<void> => {
    const categories = await ApiService.getCategories();
    if (!categories.find(c => c.id === category.id)) {
      saveToStorage(STORAGE_KEYS.CATEGORIES, [...categories, category]);
    }
  },

  /**
   * Removes a category.
   */
  deleteCategory: async (id: string): Promise<void> => {
    const categories = await ApiService.getCategories();
    saveToStorage(STORAGE_KEYS.CATEGORIES, categories.filter(c => c.id !== id));
  },

  /**
   * Retrieves the order history.
   */
  getOrders: async (): Promise<Order[]> => {
    return getFromStorage<Order[]>(STORAGE_KEYS.ORDERS, []);
  },

  /**
   * Persists a new customer order.
   */
  saveOrder: async (order: Order): Promise<void> => {
    const orders = await ApiService.getOrders();
    saveToStorage(STORAGE_KEYS.ORDERS, [order, ...orders]);
  },
};
