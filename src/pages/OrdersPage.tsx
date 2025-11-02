import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useApp } from '../hooks/useApp';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { 
  ShoppingBag, 
  Package, 
  Clock, 
  CheckCircle, 
  XCircle,
  Eye,
  Calendar,
  DollarSign,
  ArrowLeft
} from 'lucide-react';
import { motion } from 'framer-motion';

interface OrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
}

interface Order {
  id: string;
  date: string;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  total: number;
  items: OrderItem[];
}

const statusConfig = {
  pending: { label: 'Pending', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
  processing: { label: 'Processing', color: 'bg-blue-100 text-blue-800', icon: Package },
  shipped: { label: 'Shipped', color: 'bg-purple-100 text-purple-800', icon: Package },
  delivered: { label: 'Delivered', color: 'bg-green-100 text-green-800', icon: CheckCircle },
  cancelled: { label: 'Cancelled', color: 'bg-red-100 text-red-800', icon: XCircle },
};

export const OrdersPage: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const { t } = useApp();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // Load orders from API
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setIsLoading(true);
        // TODO: Replace with actual API call
        // const response = await ordersService.getUserOrders();
        // setOrders(response.data);
        
        // For now, set empty orders array
        setOrders([]);
      } catch (error) {
        console.error('Error fetching orders:', error);
        setOrders([]);
      } finally {
        setIsLoading(false);
      }
    };

    if (isAuthenticated) {
      fetchOrders();
    } else {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 pt-20 px-4">
        <div className="max-w-4xl mx-auto flex items-center justify-center min-h-[60vh]">
          <Card className="w-full max-w-md text-center">
            <CardHeader>
              <ShoppingBag className="h-16 w-16 text-stone-400 mx-auto mb-4" />
              <CardTitle className="text-2xl">
                {t('auth.loginRequired')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-6">
                {t('orders.loginMessage')}
              </p>
              <Button onClick={() => navigate('/')}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                {t('common.backHome')}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-20">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Page Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3 mb-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(-1)}
              className="p-2"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <ShoppingBag className="h-8 w-8 text-stone-700" />
            <h1 className="text-3xl font-bold text-gray-900">
              {t('orders.title')}
            </h1>
          </div>
          <p className="text-gray-600">
            {t('orders.description')}
          </p>
        </motion.div>

        {/* Loading State */}
        {isLoading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="h-4 bg-gray-300 rounded w-32"></div>
                    <div className="h-6 bg-gray-300 rounded w-24"></div>
                  </div>
                  <div className="h-4 bg-gray-300 rounded w-48 mb-2"></div>
                  <div className="h-4 bg-gray-300 rounded w-24"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <>
            {/* Stats */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8"
            >
              <Card>
                <CardContent className="p-4 text-center">
                  <ShoppingBag className="h-8 w-8 text-stone-700 mx-auto mb-2" />
                  <h3 className="text-2xl font-bold text-gray-900">{orders.length}</h3>
                  <p className="text-gray-600">{t('orders.totalOrders')}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
                  <h3 className="text-2xl font-bold text-gray-900">
                    {orders.filter(order => order.status === 'delivered').length}
                  </h3>
                  <p className="text-gray-600">{t('orders.delivered')}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <Clock className="h-8 w-8 text-blue-500 mx-auto mb-2" />
                  <h3 className="text-2xl font-bold text-gray-900">
                    {orders.filter(order => ['pending', 'processing', 'shipped'].includes(order.status)).length}
                  </h3>
                  <p className="text-gray-600">{t('orders.active')}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <DollarSign className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
                  <h3 className="text-2xl font-bold text-gray-900">
                    ${orders.reduce((sum, order) => sum + order.total, 0).toFixed(2)}
                  </h3>
                  <p className="text-gray-600">{t('orders.totalSpent')}</p>
                </CardContent>
              </Card>
            </motion.div>

            {/* Orders List */}
            {orders.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="text-center py-12"
              >
                <ShoppingBag className="h-24 w-24 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-700 mb-2">
                  {t('orders.empty')}
                </h3>
                <p className="text-gray-500 mb-6">
                  {t('orders.emptyDescription')}
                </p>
                <Button onClick={() => navigate('/products')}>
                  <ShoppingBag className="h-4 w-4 mr-2" />
                  {t('orders.startShopping')}
                </Button>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="space-y-4"
              >
                {orders.map((order, index) => {
                  const statusInfo = statusConfig[order.status];
                  const StatusIcon = statusInfo.icon;
                  
                  return (
                    <motion.div
                      key={order.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 * index }}
                    >
                      <Card className="hover:shadow-lg transition-all duration-300">
                        <CardContent className="p-6">
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-4">
                              <div>
                                <h3 className="font-semibold text-lg text-gray-900">
                                  {t('orders.order')} #{order.id}
                                </h3>
                                <div className="flex items-center gap-2 text-sm text-gray-500">
                                  <Calendar className="h-4 w-4" />
                                  {new Date(order.date).toLocaleDateString()}
                                </div>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-4">
                              <Badge className={statusInfo.color}>
                                <StatusIcon className="h-3 w-3 mr-1" />
                                {t(`orders.status.${order.status}`)}
                              </Badge>
                              <div className="text-right">
                                <p className="text-2xl font-bold text-stone-700">
                                  ${order.total.toFixed(2)}
                                </p>
                                <p className="text-sm text-gray-500">
                                  {order.items.length} {t('orders.items')}
                                </p>
                              </div>
                            </div>
                          </div>

                          {/* Order Items Preview */}
                          <div className="flex items-center gap-4 mb-4">
                            <div className="flex -space-x-2">
                              {order.items.slice(0, 3).map((item) => (
                                <img
                                  key={item.id}
                                  src={item.image}
                                  alt={item.name}
                                  className="w-10 h-10 rounded-full border-2 border-white object-cover"
                                  onError={(e) => {
                                    e.currentTarget.src = '/images/products/default-coffee.jpg';
                                  }}
                                />
                              ))}
                              {order.items.length > 3 && (
                                <div className="w-10 h-10 rounded-full border-2 border-white bg-gray-100 flex items-center justify-center text-xs font-medium text-gray-600">
                                  +{order.items.length - 3}
                                </div>
                              )}
                            </div>
                            
                            <div className="flex-1">
                              <p className="text-sm text-gray-600">
                                {order.items.map(item => item.name).join(', ')}
                              </p>
                            </div>
                            
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedOrder(order)}
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              {t('orders.viewDetails')}
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </motion.div>
            )}
          </>
        )}
      </div>
      
      {/* Order Details Modal would go here */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-2xl max-h-[80vh] overflow-y-auto">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>
                  {t('orders.order')} #{selectedOrder.id}
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedOrder(null)}
                >
                  ✕
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {selectedOrder.items.map((item) => (
                  <div key={item.id} className="flex items-center gap-4 p-4 border rounded-lg">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-16 h-16 rounded-lg object-cover"
                      onError={(e) => {
                        e.currentTarget.src = '/images/products/default-coffee.jpg';
                      }}
                    />
                    <div className="flex-1">
                      <h4 className="font-medium">{item.name}</h4>
                      <p className="text-sm text-gray-500">
                        {t('orders.quantity')}: {item.quantity}
                      </p>
                    </div>
                    <p className="font-semibold">
                      ${(item.price * item.quantity).toFixed(2)}
                    </p>
                  </div>
                ))}
                
                <div className="border-t pt-4">
                  <div className="flex justify-between items-center text-lg font-bold">
                    <span>{t('orders.total')}</span>
                    <span>${selectedOrder.total.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};