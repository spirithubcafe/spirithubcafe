import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useApp } from '../hooks/useApp';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Badge } from '../components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Alert, AlertDescription } from '../components/ui/alert';
import { 
  CreditCard,
  Plus,
  Edit,
  Trash2,
  Shield,
  ArrowLeft,
  Calendar,
  Lock,
  Wallet,
  DollarSign,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { motion } from 'framer-motion';

interface PaymentMethod {
  id: string;
  type: 'card' | 'paypal' | 'apple_pay' | 'google_pay';
  cardNumber?: string;
  cardHolderName?: string;
  expiryDate?: string;
  brand?: 'visa' | 'mastercard' | 'amex';
  isDefault: boolean;
  lastUsed?: string;
}

interface PaymentForm {
  cardNumber: string;
  cardHolderName: string;
  expiryMonth: string;
  expiryYear: string;
  cvv: string;
  isDefault: boolean;
}

export const PaymentPage: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const { t } = useApp();
  const navigate = useNavigate();
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddingCard, setIsAddingCard] = useState(false);
  // const [editingCard, setEditingCard] = useState<string | null>(null);
  const [paymentForm, setPaymentForm] = useState<PaymentForm>({
    cardNumber: '',
    cardHolderName: '',
    expiryMonth: '',
    expiryYear: '',
    cvv: '',
    isDefault: false
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load payment methods from API
  useEffect(() => {
    const fetchPaymentMethods = async () => {
      try {
        setIsLoading(true);
        // TODO: Replace with actual API call
        // const response = await paymentService.getUserPaymentMethods();
        // setPaymentMethods(response.data);
        
        // For now, set empty data
        setPaymentMethods([]);
      } catch (error) {
        console.error('Error fetching payment methods:', error);
        setPaymentMethods([]);
      } finally {
        setIsLoading(false);
      }
    };

    if (isAuthenticated) {
      fetchPaymentMethods();
    } else {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  const handleAddPaymentMethod = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      // TODO: Replace with actual API call
      // const response = await paymentService.addPaymentMethod(paymentForm);
      // setPaymentMethods(prev => [...prev, response.data]);
      
      // Reset form and close dialog
      setPaymentForm({
        cardNumber: '',
        cardHolderName: '',
        expiryMonth: '',
        expiryYear: '',
        cvv: '',
        isDefault: false
      });
      setIsAddingCard(false);
      
      console.log('Payment method added successfully');
    } catch (error) {
      console.error('Error adding payment method:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeletePaymentMethod = async (methodId: string) => {
    try {
      // TODO: Replace with actual API call
      // await paymentService.deletePaymentMethod(methodId);
      setPaymentMethods(prev => prev.filter(method => method.id !== methodId));
      console.log('Payment method deleted successfully');
    } catch (error) {
      console.error('Error deleting payment method:', error);
    }
  };

  const handleSetDefault = async (methodId: string) => {
    try {
      // TODO: Replace with actual API call
      // await paymentService.setDefaultPaymentMethod(methodId);
      setPaymentMethods(prev => 
        prev.map(method => ({
          ...method,
          isDefault: method.id === methodId
        }))
      );
      console.log('Default payment method updated');
    } catch (error) {
      console.error('Error setting default payment method:', error);
    }
  };

  const formatCardNumber = (number: string) => {
    return number.replace(/\d{4}(?=\d)/g, '$&-');
  };

  const maskCardNumber = (number: string) => {
    if (!number) return '';
    return `**** **** **** ${number.slice(-4)}`;
  };

  const getCardBrandIcon = (brand: string) => {
    switch (brand) {
      case 'visa':
        return '💳';
      case 'mastercard':
        return '💳';
      case 'amex':
        return '💳';
      default:
        return '💳';
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 pt-20 px-4">
        <div className="max-w-4xl mx-auto flex items-center justify-center min-h-[60vh]">
          <Card className="w-full max-w-md text-center">
            <CardHeader>
              <CreditCard className="h-16 w-16 text-stone-400 mx-auto mb-4" />
              <CardTitle className="text-2xl">
                {t('auth.loginRequired')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-6">
                {t('payment.loginMessage')}
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
      <div className="max-w-4xl mx-auto px-4 py-8">
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
            <CreditCard className="h-8 w-8 text-stone-700" />
            <h1 className="text-3xl font-bold text-gray-900">
              {t('payment.title')}
            </h1>
          </div>
          <p className="text-gray-600">
            {t('payment.description')}
          </p>
        </motion.div>

        {/* Security Notice */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-6"
        >
          <Alert className="border-green-200 bg-green-50">
            <Shield className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              {t('payment.securityNotice')}
            </AlertDescription>
          </Alert>
        </motion.div>

        {/* Payment Methods */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Wallet className="h-5 w-5" />
                  {t('payment.paymentMethods')}
                </CardTitle>
                <Dialog open={isAddingCard} onOpenChange={setIsAddingCard}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      {t('payment.addCard')}
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle>{t('payment.addNewCard')}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleAddPaymentMethod} className="space-y-4">
                      <div>
                        <Label htmlFor="cardNumber">{t('payment.cardNumber')}</Label>
                        <Input
                          id="cardNumber"
                          value={formatCardNumber(paymentForm.cardNumber)}
                          onChange={(e) => {
                            const value = e.target.value.replace(/\D/g, '');
                            if (value.length <= 16) {
                              setPaymentForm(prev => ({ ...prev, cardNumber: value }));
                            }
                          }}
                          placeholder="1234 5678 9012 3456"
                          maxLength={19}
                          required
                        />
                      </div>

                      <div>
                        <Label htmlFor="cardHolderName">{t('payment.cardHolderName')}</Label>
                        <Input
                          id="cardHolderName"
                          value={paymentForm.cardHolderName}
                          onChange={(e) => setPaymentForm(prev => ({ 
                            ...prev, 
                            cardHolderName: e.target.value 
                          }))}
                          placeholder={t('payment.cardHolderPlaceholder')}
                          required
                        />
                      </div>

                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <Label htmlFor="expiryMonth">{t('payment.month')}</Label>
                          <Input
                            id="expiryMonth"
                            value={paymentForm.expiryMonth}
                            onChange={(e) => {
                              const value = e.target.value.replace(/\D/g, '');
                              if (value.length <= 2 && parseInt(value) <= 12) {
                                setPaymentForm(prev => ({ ...prev, expiryMonth: value }));
                              }
                            }}
                            placeholder="12"
                            maxLength={2}
                            required
                          />
                        </div>
                        
                        <div>
                          <Label htmlFor="expiryYear">{t('payment.year')}</Label>
                          <Input
                            id="expiryYear"
                            value={paymentForm.expiryYear}
                            onChange={(e) => {
                              const value = e.target.value.replace(/\D/g, '');
                              if (value.length <= 4) {
                                setPaymentForm(prev => ({ ...prev, expiryYear: value }));
                              }
                            }}
                            placeholder="2024"
                            maxLength={4}
                            required
                          />
                        </div>
                        
                        <div>
                          <Label htmlFor="cvv">{t('payment.cvv')}</Label>
                          <Input
                            id="cvv"
                            type="password"
                            value={paymentForm.cvv}
                            onChange={(e) => {
                              const value = e.target.value.replace(/\D/g, '');
                              if (value.length <= 4) {
                                setPaymentForm(prev => ({ ...prev, cvv: value }));
                              }
                            }}
                            placeholder="123"
                            maxLength={4}
                            required
                          />
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="isDefault"
                          checked={paymentForm.isDefault}
                          onChange={(e) => setPaymentForm(prev => ({ 
                            ...prev, 
                            isDefault: e.target.checked 
                          }))}
                          className="h-4 w-4"
                          aria-labelledby="isDefault-label"
                          title={t('payment.setAsDefault')}
                        />
                        <Label htmlFor="isDefault" id="isDefault-label">{t('payment.setAsDefault')}</Label>
                      </div>

                      <div className="flex gap-3 pt-4">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setIsAddingCard(false)}
                          className="flex-1"
                        >
                          {t('common.cancel')}
                        </Button>
                        <Button
                          type="submit"
                          disabled={isSubmitting}
                          className="flex-1"
                        >
                          {isSubmitting ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          ) : (
                            <Lock className="h-4 w-4 mr-2" />
                          )}
                          {t('payment.addCard')}
                        </Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-4">
                  {[...Array(2)].map((_, i) => (
                    <div key={i} className="animate-pulse p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-8 bg-gray-300 rounded"></div>
                        <div className="flex-1 space-y-2">
                          <div className="h-4 bg-gray-300 rounded w-1/3"></div>
                          <div className="h-3 bg-gray-300 rounded w-1/4"></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : paymentMethods.length === 0 ? (
                <div className="text-center py-12">
                  <CreditCard className="h-24 w-24 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-700 mb-2">
                    {t('payment.noPaymentMethods')}
                  </h3>
                  <p className="text-gray-500 mb-6">
                    {t('payment.noPaymentMethodsDescription')}
                  </p>
                  <Button onClick={() => setIsAddingCard(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    {t('payment.addFirstCard')}
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {paymentMethods.map((method) => (
                    <div
                      key={method.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:shadow-sm transition-shadow"
                    >
                      <div className="flex items-center gap-4">
                        <div className="text-2xl">
                          {getCardBrandIcon(method.brand || 'card')}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium">
                              {method.cardNumber ? maskCardNumber(method.cardNumber) : method.type}
                            </p>
                            {method.isDefault && (
                              <Badge className="bg-green-500 text-white text-xs">
                                {t('payment.default')}
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-4 text-sm text-gray-500">
                            {method.cardHolderName && (
                              <span>{method.cardHolderName}</span>
                            )}
                            {method.expiryDate && (
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {method.expiryDate}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {!method.isDefault && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleSetDefault(method.id)}
                          >
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            // TODO: Implement edit functionality
                            console.log('Edit payment method:', method.id);
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeletePaymentMethod(method.id)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Billing Information */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-6"
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                {t('payment.billingInfo')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <AlertCircle className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-700 mb-2">
                  {t('payment.noBillingInfo')}
                </h3>
                <p className="text-gray-500 mb-4">
                  {t('payment.noBillingInfoDescription')}
                </p>
                <Button variant="outline">
                  <Edit className="h-4 w-4 mr-2" />
                  {t('payment.addBillingInfo')}
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};