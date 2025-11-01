import React from 'react';
import { useTranslation } from 'react-i18next';
import { ShoppingCart, Plus, Minus, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useCart } from '../../hooks/useCart';
import { Button } from '../ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from '../ui/sheet';

export const CartDrawer: React.FC = () => {
  const { i18n } = useTranslation();
  const isArabic = i18n.language === 'ar';
  const { items, removeFromCart, updateQuantity, clearCart, totalItems, totalPrice, isOpen, closeCart } = useCart();

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && closeCart()}>
      <SheetContent side={isArabic ? 'left' : 'right'} className="w-full sm:max-w-lg">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <ShoppingCart className="w-5 h-5" />
            {isArabic ? 'سلة التسوق' : 'Shopping Cart'}
            {totalItems > 0 && (
              <span className="text-sm text-gray-500">
                ({totalItems} {isArabic ? 'منتج' : 'items'})
              </span>
            )}
          </SheetTitle>
        </SheetHeader>

        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center text-center py-6">
            <ShoppingCart className="w-16 h-16 text-gray-300 mb-4" />
            <p className="text-gray-500">
              {isArabic ? 'سلة التسوق فارغة' : 'Your cart is empty'}
            </p>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto px-4 py-6">
              <div className="space-y-4">
                <AnimatePresence mode="popLayout">
                  {items.map((item) => (
                    <motion.div
                      key={item.id}
                      layout
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      className="flex gap-4 p-4 bg-white border border-gray-200 rounded-lg"
                    >
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-20 h-20 object-cover rounded"
                      />
                      <div className="flex-1">
                        <h3 className="font-semibold text-sm mb-1">{item.name}</h3>
                        {item.tastingNotes && (
                          <p className="text-xs text-amber-600 mb-2">{item.tastingNotes}</p>
                        )}
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-amber-600">
                            {item.price.toFixed(3)} {isArabic ? 'ر.ع' : 'OMR'}
                          </span>
                          <div className="flex items-center gap-2">
                            <Button
                              size="icon-sm"
                              variant="outline"
                              onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            >
                              <Minus className="w-3 h-3" />
                            </Button>
                            <span className="w-8 text-center font-medium">{item.quantity}</span>
                            <Button
                              size="icon-sm"
                              variant="outline"
                              onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            >
                              <Plus className="w-3 h-3" />
                            </Button>
                            <Button
                              size="icon-sm"
                              variant="ghost"
                              onClick={() => removeFromCart(item.id)}
                              className="text-red-500 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>

            <SheetFooter className="gap-4 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/75">
              <div className="flex items-center justify-between text-lg font-bold">
                <span>{isArabic ? 'المجموع' : 'Total'}</span>
                <span className="text-amber-600">
                  {totalPrice.toFixed(3)} {isArabic ? 'ر.ع' : 'OMR'}
                </span>
              </div>
              <div className="flex gap-2 w-full">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={clearCart}
                >
                  {isArabic ? 'إفراغ السلة' : 'Clear Cart'}
                </Button>
                <Button
                  className="flex-1 bg-amber-600 hover:bg-amber-700"
                  onClick={() => {
                    // TODO: Implement checkout
                    alert(isArabic ? 'قريباً...' : 'Coming soon...');
                  }}
                >
                  {isArabic ? 'إتمام الطلب' : 'Checkout'}
                </Button>
              </div>
            </SheetFooter>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
};
