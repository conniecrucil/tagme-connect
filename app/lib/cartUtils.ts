import { cartDB, type CartItemDB } from './indexedDB';

export interface CartItem {
  productId: string;
  productType: 'basic' | 'core';
  quantity: number;
  configuration?: Record<string, unknown>;
  url?: string;
  price: number;
  id: string;
}

/**
 * Get all cart items, with migration from localStorage if needed
 */
export async function getCart(): Promise<CartItem[]> {
  try {
    // Try to get from IndexedDB
    const items = await cartDB.getAllCartItems();
    
    // If IndexedDB has items, return them
    if (items && items.length > 0) {
      return items as CartItem[];
    }
    
    // Otherwise, try to migrate from localStorage
    const localCart = localStorage.getItem('cart');
    if (localCart) {
      try {
        const parsedCart = JSON.parse(localCart);
        if (Array.isArray(parsedCart) && parsedCart.length > 0) {
          // Migrate items to IndexedDB
          for (const item of parsedCart) {
            await cartDB.addCartItem(item as CartItemDB);
          }
          // Clear localStorage after migration
          localStorage.removeItem('cart');
          return parsedCart as CartItem[];
        }
      } catch (e) {
        console.error('Failed to parse localStorage cart:', e);
        localStorage.removeItem('cart');
      }
    }
    
    return [];
  } catch (error) {
    console.error('Error getting cart:', error);
    return [];
  }
}

/**
 * Add an item to the cart
 */
export async function addToCart(item: CartItem): Promise<void> {
  try {
    await cartDB.addCartItem(item as CartItemDB);
  } catch (error) {
    console.error('Error adding to cart:', error);
    throw error;
  }
}

/**
 * Update cart item quantity
 */
export async function updateCartItemQuantity(itemId: string, quantity: number): Promise<void> {
  try {
    await cartDB.updateCartItem(itemId, { quantity });
  } catch (error) {
    console.error('Error updating cart item:', error);
    throw error;
  }
}

/**
 * Remove item from cart
 */
export async function removeCartItem(itemId: string): Promise<void> {
  try {
    await cartDB.removeCartItem(itemId);
  } catch (error) {
    console.error('Error removing cart item:', error);
    throw error;
  }
}

/**
 * Clear entire cart
 */
export async function clearCart(): Promise<void> {
  try {
    await cartDB.clearCart();
  } catch (error) {
    console.error('Error clearing cart:', error);
    throw error;
  }
}

/**
 * Get cart count (number of items)
 */
export async function getCartCount(): Promise<number> {
  try {
    const items = await cartDB.getAllCartItems();
    return items.reduce((total, item) => total + item.quantity, 0);
  } catch (error) {
    console.error('Error getting cart count:', error);
    return 0;
  }
}
