import React from 'react';
import {
  Trash2,
  Plus,
  Minus,
  ArrowLeft,
  ShoppingBag,
  CreditCard,
  MapPin,
  Leaf
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Product } from './MarketplacePage';
import { CartItem } from '../../App';

interface CartPageProps {
  cartItems: CartItem[];
  onUpdateQuantity: (productId: string, delta: number) => void;
  onRemoveItem: (productId: string) => void;
  onNavigate: (route: any) => void;
}

export const CartPage: React.FC<CartPageProps> = ({
  cartItems,
  onUpdateQuantity,
  onRemoveItem,
  onNavigate
}) => {

  const subtotal = cartItems.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
  const shippingFee = subtotal > 0 ? 50000 : 0; // Phí vận chuyển giả lập
  const total = subtotal + shippingFee;
  const totalCO2 = cartItems.reduce((sum, item) => sum + (item.product.co2_savings_kg * item.quantity), 0);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);
  };

  if (cartItems.length === 0) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center p-4">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="w-32 h-32 bg-slate-100 rounded-full flex items-center justify-center mb-6 text-slate-300"
        >
          <ShoppingBag size={64} />
        </motion.div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Giỏ hàng của bạn đang trống</h2>
        <p className="text-slate-500 mb-8 text-center max-w-md">
          Hãy ghé thăm Sàn Nông Nghiệp để tìm kiếm những phụ phẩm giá trị và góp phần bảo vệ môi trường.
        </p>
        <button
          onClick={() => onNavigate('marketplace')}
          className="px-8 py-3 bg-emerald-600 text-white rounded-full font-medium hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-200"
        >
          Khám phá ngay
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-8 select-none">
      <div className="container mx-auto px-4">
        {/* Breadcrumb / Back */}
        <button
          onClick={() => onNavigate('marketplace')}
          className="flex items-center gap-2 text-slate-500 hover:text-emerald-600 mb-6 transition-colors"
        >
          <ArrowLeft size={18} />
          <span>Tiếp tục mua sắm</span>
        </button>

        <h1 className="text-2xl font-bold text-slate-900 mb-8 flex items-center gap-3">
          Giỏ hàng của bạn
          <span className="text-sm font-normal text-slate-500 bg-slate-200 px-2 py-1 rounded-full">
            {cartItems.length} sản phẩm
          </span>
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Cart Items List */}
          <div className="lg:col-span-2 space-y-4">
            <AnimatePresence mode="popLayout">
              {cartItems.map((item) => (
                <motion.div
                  key={item.product.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -100 }}
                  className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-4 items-start sm:items-center"
                >
                  {/* Image */}
                  <div className="w-24 h-24 shrink-0 bg-slate-100 rounded-xl overflow-hidden">
                    <img
                      src={item.product.image}
                      alt={item.product.title}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap gap-2 mb-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
                        {item.product.category}
                      </span>
                    </div>
                    <h3 className="font-semibold text-slate-900 truncate mb-1" title={item.product.title}>
                      {item.product.title}
                    </h3>
                    <div className="text-sm text-slate-500 flex items-center gap-1 mb-2">
                      <MapPin size={12} /> {item.product.location}
                    </div>
                    <div className="text-emerald-600 font-bold">
                      {formatCurrency(item.product.price)} <span className="text-xs font-normal text-slate-400">/ {item.product.unit}</span>
                    </div>
                  </div>

                  {/* Controls */}
                  <div className="flex items-center gap-6 w-full sm:w-auto justify-between sm:justify-end border-t sm:border-t-0 border-slate-100 pt-3 sm:pt-0">

                    {/* Quantity */}
                    <div className="flex items-center bg-slate-100 rounded-full p-1">
                      <button
                        onClick={() => onUpdateQuantity(item.product.id, -1)}
                        className="w-8 h-8 flex items-center justify-center rounded-full bg-white text-slate-600 shadow-sm hover:text-emerald-600 disabled:opacity-50"
                        disabled={item.quantity <= 1}
                      >
                        <Minus size={14} />
                      </button>
                      <span className="w-10 text-center font-medium text-slate-900 text-sm">{item.quantity}</span>
                      <button
                        onClick={() => onUpdateQuantity(item.product.id, 1)}
                        className="w-8 h-8 flex items-center justify-center rounded-full bg-white text-slate-600 shadow-sm hover:text-emerald-600"
                      >
                        <Plus size={14} />
                      </button>
                    </div>

                    {/* Delete */}
                    <button
                      onClick={() => onRemoveItem(item.product.id)}
                      className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                      title="Xóa sản phẩm"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* Summary Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm sticky top-24">
              <h3 className="font-bold text-slate-900 mb-6 text-lg">Tóm tắt đơn hàng</h3>

              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-slate-600 text-sm">
                  <span>Tạm tính</span>
                  <span className="font-medium text-slate-900">{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex justify-between text-slate-600 text-sm">
                  <span>Vận chuyển (Dự kiến)</span>
                  <span className="font-medium text-slate-900">{formatCurrency(shippingFee)}</span>
                </div>
                <div className="h-px bg-slate-100 my-2"></div>
                <div className="flex justify-between text-base font-bold text-slate-900">
                  <span>Tổng cộng</span>
                  <span className="text-emerald-600">{formatCurrency(total)}</span>
                </div>
              </div>

              {/* Eco Impact Banner */}
              <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-100 rounded-xl p-4 mb-6 flex items-start gap-3">
                <div className="p-2 bg-white rounded-full text-emerald-500 shadow-sm">
                  <Leaf size={18} />
                </div>
                <div>
                  <p className="text-xs font-bold text-emerald-800 uppercase tracking-wide mb-1">Tác động xanh</p>
                  <p className="text-sm text-emerald-900 leading-snug">
                    Đơn hàng này giúp giảm thiểu khoảng <span className="font-bold">{totalCO2} kg CO₂e</span> thải ra môi trường.
                  </p>
                </div>
              </div>

              <button className="w-full bg-slate-900 text-white py-3.5 rounded-xl font-medium hover:bg-emerald-600 transition-all shadow-lg hover:shadow-emerald-500/20 flex items-center justify-center gap-2">
                <CreditCard size={18} />
                Tiến hành thanh toán
              </button>

              <p className="text-center text-xs text-slate-400 mt-4">
                Bảo mật thanh toán bởi Stripe. Hỗ trợ hoàn tiền 100%.
              </p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
