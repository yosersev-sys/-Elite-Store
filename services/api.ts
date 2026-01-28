
import { Product, Category, Order } from '../types';

export const ApiService = {
  // المنتجات
  async getProducts(): Promise<Product[]> {
    try {
      const saved = localStorage.getItem('elite_products');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  },

  async addProduct(product: Product): Promise<boolean> {
    try {
      const products = await this.getProducts();
      localStorage.setItem('elite_products', JSON.stringify([product, ...products]));
      return true;
    } catch (e) {
      return false;
    }
  },

  async updateProduct(updatedProduct: Product): Promise<boolean> {
    try {
      const products = await this.getProducts();
      const newProducts = products.map(p => p.id === updatedProduct.id ? updatedProduct : p);
      localStorage.setItem('elite_products', JSON.stringify(newProducts));
      return true;
    } catch (e) {
      return false;
    }
  },

  async deleteProduct(id: string): Promise<boolean> {
    try {
      const products = await this.getProducts();
      localStorage.setItem('elite_products', JSON.stringify(products.filter(p => p.id !== id)));
      return true;
    } catch (e) {
      return false;
    }
  },

  // التصنيفات
  async getCategories(): Promise<Category[]> {
    const saved = localStorage.getItem('elite_categories');
    return saved ? JSON.parse(saved) : [];
  },

  async addCategory(category: Category): Promise<void> {
    const cats = await this.getCategories();
    localStorage.setItem('elite_categories', JSON.stringify([...cats, category]));
  },

  async deleteCategory(id: string): Promise<void> {
    const cats = await this.getCategories();
    localStorage.setItem('elite_categories', JSON.stringify(cats.filter(c => c.id !== id)));
  },

  // الطلبات
  async getOrders(): Promise<Order[]> {
    const saved = localStorage.getItem('elite_orders');
    return saved ? JSON.parse(saved) : [];
  },

  async saveOrder(order: Order): Promise<void> {
    const orders = await this.getOrders();
    localStorage.setItem('elite_orders', JSON.stringify([order, ...orders]));
  }
};
