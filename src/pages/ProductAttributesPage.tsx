import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Switch } from '../components/ui/switch';
import { Badge } from '../components/ui/badge';
import { Loader2, Save, ArrowLeft, Coffee, Mountain, Leaf, Award, Info, Globe2, Crown, Sparkles } from 'lucide-react';
import { useApp } from '../hooks/useApp';
import { productService } from '../services/productService';
import type { Product } from '../types/product';
import { Seo } from '../components/seo/Seo';

export const ProductAttributesPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { language } = useApp();
  const isArabic = language === 'ar';
  const [loading, setLoading] = useState(false);
  const [loadingProduct, setLoadingProduct] = useState(true);
  const [product, setProduct] = useState<Product | null>(null);
  const [activeTab, setActiveTab] = useState('basic');

  // Form state
  const [formData, setFormData] = useState({
    // Basic Attributes
    aromaticProfile: '',
    aromaticProfileAr: '',
    intensity: 5,
    compatibility: '',
    compatibilityAr: '',
    uses: '',
    usesAr: '',
    
    // Origin & Process
    origin: '',
    roastLevel: '',
    roastLevelAr: '',
    process: '',
    processAr: '',
    variety: '',
    varietyAr: '',
    altitude: 0,
    farm: '',
    farmAr: '',
    
    // Tasting
    tastingNotes: '',
    tastingNotesAr: '',
    brewingInstructions: '',
    brewingInstructionsAr: '',
    
    // Certifications
    isOrganic: false,
    isFairTrade: false,
    isPremium: false,
    isLimited: false,
    
    // Notes
    notes: '',
    notesAr: '',
  });

  // Load product data
  useEffect(() => {
    const loadProduct = async () => {
      if (!id) return;
      
      setLoadingProduct(true);
      try {
        const productData = await productService.getById(parseInt(id));
        setProduct(productData);
        
        // Update form with product data
        setFormData({
          aromaticProfile: productData.aromaticProfile || '',
          aromaticProfileAr: productData.aromaticProfileAr || '',
          intensity: productData.intensity || 5,
          compatibility: productData.compatibility || '',
          compatibilityAr: productData.compatibilityAr || '',
          uses: productData.uses || '',
          usesAr: productData.usesAr || '',
          origin: productData.origin || '',
          roastLevel: productData.roastLevel || '',
          roastLevelAr: productData.roastLevelAr || '',
          process: productData.process || '',
          processAr: productData.processAr || '',
          variety: productData.variety || '',
          varietyAr: productData.varietyAr || '',
          altitude: productData.altitude || 0,
          farm: productData.farm || '',
          farmAr: productData.farmAr || '',
          tastingNotes: productData.tastingNotes || '',
          tastingNotesAr: productData.tastingNotesAr || '',
          brewingInstructions: productData.brewingInstructions || '',
          brewingInstructionsAr: productData.brewingInstructionsAr || '',
          isOrganic: productData.isOrganic || false,
          isFairTrade: productData.isFairTrade || false,
          isPremium: productData.isPremium || false,
          isLimited: productData.isLimited || false,
          notes: productData.notes || '',
          notesAr: productData.notesAr || '',
        });
      } catch (error) {
        console.error('Error loading product:', error);
      } finally {
        setLoadingProduct(false);
      }
    };

    loadProduct();
  }, [id]);

  const handleSave = async () => {
    if (!product || !id) return;
    
    setLoading(true);
    try {
      // Update only the attributes, keep other product data
      const updateData = {
        ...product,
        ...formData,
        isLimited: formData.isLimited ?? product.isLimited ?? false,
        isPremium: formData.isPremium ?? product.isPremium ?? false,
      };
      await productService.update(parseInt(id), updateData);
      navigate('/admin/products');
    } catch (error) {
      console.error('Error saving attributes:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateField = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (loadingProduct) {
    return (
      <div className="min-h-screen bg-background page-padding-top flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-amber-600" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-background page-padding-top flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Product not found</CardTitle>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate('/admin/products')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Products
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background page-padding-top pb-12">
      <Seo
        title={`Product Attributes - ${product.name}`}
        description="Manage product attributes"
        noindex
        robots="noindex, nofollow"
      />
      
      <div className="container mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={() => navigate('/admin/products')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              {isArabic ? 'رجوع' : 'Back'}
            </Button>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground flex items-center gap-2">
                <Coffee className="w-6 h-6 sm:w-8 sm:h-8 text-amber-600" />
                {isArabic ? 'خصائص المنتج' : 'Product Attributes'}
              </h1>
              <Badge variant="outline" className="mt-2">
                {product.name}
              </Badge>
            </div>
          </div>
          <Button
            onClick={handleSave}
            disabled={loading}
            className="bg-amber-600 hover:bg-amber-700"
            size="lg"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                {isArabic ? 'جاري الحفظ...' : 'Saving...'}
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                {isArabic ? 'حفظ' : 'Save'}
              </>
            )}
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 mb-6">
            <TabsTrigger value="basic" className="flex items-center gap-2">
              <Coffee className="w-4 h-4" />
              <span className="hidden sm:inline">{isArabic ? 'أساسي' : 'Basic'}</span>
            </TabsTrigger>
            <TabsTrigger value="origin" className="flex items-center gap-2">
              <Globe2 className="w-4 h-4" />
              <span className="hidden sm:inline">{isArabic ? 'المنشأ' : 'Origin'}</span>
            </TabsTrigger>
            <TabsTrigger value="tasting" className="flex items-center gap-2">
              <Leaf className="w-4 h-4" />
              <span className="hidden sm:inline">{isArabic ? 'التذوق' : 'Tasting'}</span>
            </TabsTrigger>
            <TabsTrigger value="extra" className="flex items-center gap-2">
              <Award className="w-4 h-4" />
              <span className="hidden sm:inline">{isArabic ? 'إضافي' : 'Extra'}</span>
            </TabsTrigger>
          </TabsList>

          {/* Basic Attributes Tab */}
          <TabsContent value="basic" className="space-y-4">
            <AnimatePresence mode="wait">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-4"
              >
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Info className="w-5 h-5 text-amber-600" />
                      {isArabic ? 'الملف العطري والكثافة' : 'Aromatic Profile & Intensity'}
                    </CardTitle>
                    <CardDescription>
                      {isArabic ? 'وصف الروائح والنكهات الأساسية' : 'Describe the primary aromas and flavors'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="aromaticProfile">
                          {isArabic ? 'الملف العطري (EN)' : 'Aromatic Profile (EN)'}
                        </Label>
                        <Textarea
                          id="aromaticProfile"
                          value={formData.aromaticProfile}
                          onChange={(e) => updateField('aromaticProfile', e.target.value)}
                          placeholder="Chocolate, caramel, nutty..."
                          rows={3}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="aromaticProfileAr">
                          {isArabic ? 'الملف العطري (AR)' : 'Aromatic Profile (AR)'}
                        </Label>
                        <Textarea
                          id="aromaticProfileAr"
                          value={formData.aromaticProfileAr}
                          onChange={(e) => updateField('aromaticProfileAr', e.target.value)}
                          placeholder="شوكولاتة، كراميل، مكسرات..."
                          rows={3}
                          dir="rtl"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="intensity">
                        {isArabic ? 'الكثافة (1-10)' : 'Intensity (1-10)'}
                        <Badge variant="secondary" className="ml-2">{formData.intensity}</Badge>
                      </Label>
                      <Input
                        id="intensity"
                        type="range"
                        min="1"
                        max="10"
                        value={formData.intensity}
                        onChange={(e) => updateField('intensity', parseInt(e.target.value))}
                        className="w-full"
                      />
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>{isArabic ? 'خفيف' : 'Light'}</span>
                        <span>{isArabic ? 'قوي' : 'Strong'}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>{isArabic ? 'التوافق والاستخدامات' : 'Compatibility & Uses'}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="compatibility">
                          {isArabic ? 'التوافق (EN)' : 'Compatibility (EN)'}
                        </Label>
                        <Textarea
                          id="compatibility"
                          value={formData.compatibility}
                          onChange={(e) => updateField('compatibility', e.target.value)}
                          placeholder="Espresso, pour-over, cold brew..."
                          rows={2}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="compatibilityAr">
                          {isArabic ? 'التوافق (AR)' : 'Compatibility (AR)'}
                        </Label>
                        <Textarea
                          id="compatibilityAr"
                          value={formData.compatibilityAr}
                          onChange={(e) => updateField('compatibilityAr', e.target.value)}
                          placeholder="إسبريسو، صب، قهوة باردة..."
                          rows={2}
                          dir="rtl"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="uses">
                          {isArabic ? 'الاستخدامات (EN)' : 'Uses (EN)'}
                        </Label>
                        <Textarea
                          id="uses"
                          value={formData.uses}
                          onChange={(e) => updateField('uses', e.target.value)}
                          placeholder="Morning coffee, dessert pairing..."
                          rows={2}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="usesAr">
                          {isArabic ? 'الاستخدامات (AR)' : 'Uses (AR)'}
                        </Label>
                        <Textarea
                          id="usesAr"
                          value={formData.usesAr}
                          onChange={(e) => updateField('usesAr', e.target.value)}
                          placeholder="قهوة الصباح، مع الحلويات..."
                          rows={2}
                          dir="rtl"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </AnimatePresence>
          </TabsContent>

          {/* Origin & Process Tab */}
          <TabsContent value="origin" className="space-y-4">
            <AnimatePresence mode="wait">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-4"
              >
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Mountain className="w-5 h-5 text-amber-600" />
                      {isArabic ? 'المنشأ والمزرعة' : 'Origin & Farm'}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="origin">
                          {isArabic ? 'المنشأ' : 'Origin'}
                        </Label>
                        <Input
                          id="origin"
                          value={formData.origin}
                          onChange={(e) => updateField('origin', e.target.value)}
                          placeholder="Ethiopia, Colombia, Brazil..."
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="altitude">
                          {isArabic ? 'الارتفاع (متر)' : 'Altitude (meters)'}
                        </Label>
                        <Input
                          id="altitude"
                          type="number"
                          value={formData.altitude}
                          onChange={(e) => updateField('altitude', parseInt(e.target.value) || 0)}
                          placeholder="1500"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="farm">
                          {isArabic ? 'المزرعة (EN)' : 'Farm (EN)'}
                        </Label>
                        <Input
                          id="farm"
                          value={formData.farm}
                          onChange={(e) => updateField('farm', e.target.value)}
                          placeholder="Farm name..."
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="farmAr">
                          {isArabic ? 'المزرعة (AR)' : 'Farm (AR)'}
                        </Label>
                        <Input
                          id="farmAr"
                          value={formData.farmAr}
                          onChange={(e) => updateField('farmAr', e.target.value)}
                          placeholder="اسم المزرعة..."
                          dir="rtl"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="variety">
                          {isArabic ? 'الصنف (EN)' : 'Variety (EN)'}
                        </Label>
                        <Input
                          id="variety"
                          value={formData.variety}
                          onChange={(e) => updateField('variety', e.target.value)}
                          placeholder="Arabica, Robusta..."
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="varietyAr">
                          {isArabic ? 'الصنف (AR)' : 'Variety (AR)'}
                        </Label>
                        <Input
                          id="varietyAr"
                          value={formData.varietyAr}
                          onChange={(e) => updateField('varietyAr', e.target.value)}
                          placeholder="أرابيكا، روبوستا..."
                          dir="rtl"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>{isArabic ? 'التحميص والمعالجة' : 'Roast & Process'}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="roastLevel">
                          {isArabic ? 'مستوى التحميص (EN)' : 'Roast Level (EN)'}
                        </Label>
                        <Input
                          id="roastLevel"
                          value={formData.roastLevel}
                          onChange={(e) => updateField('roastLevel', e.target.value)}
                          placeholder="Light, Medium, Dark..."
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="roastLevelAr">
                          {isArabic ? 'مستوى التحميص (AR)' : 'Roast Level (AR)'}
                        </Label>
                        <Input
                          id="roastLevelAr"
                          value={formData.roastLevelAr}
                          onChange={(e) => updateField('roastLevelAr', e.target.value)}
                          placeholder="خفيف، متوسط، غامق..."
                          dir="rtl"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="process">
                          {isArabic ? 'طريقة المعالجة (EN)' : 'Process (EN)'}
                        </Label>
                        <Input
                          id="process"
                          value={formData.process}
                          onChange={(e) => updateField('process', e.target.value)}
                          placeholder="Washed, Natural, Honey..."
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="processAr">
                          {isArabic ? 'طريقة المعالجة (AR)' : 'Process (AR)'}
                        </Label>
                        <Input
                          id="processAr"
                          value={formData.processAr}
                          onChange={(e) => updateField('processAr', e.target.value)}
                          placeholder="مغسولة، طبيعية، عسلية..."
                          dir="rtl"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </AnimatePresence>
          </TabsContent>

          {/* Tasting Tab */}
          <TabsContent value="tasting" className="space-y-4">
            <AnimatePresence mode="wait">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-4"
              >
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Leaf className="w-5 h-5 text-amber-600" />
                      {isArabic ? 'ملاحظات التذوق' : 'Tasting Notes'}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="tastingNotes">
                          {isArabic ? 'ملاحظات التذوق (EN)' : 'Tasting Notes (EN)'}
                        </Label>
                        <Textarea
                          id="tastingNotes"
                          value={formData.tastingNotes}
                          onChange={(e) => updateField('tastingNotes', e.target.value)}
                          placeholder="Floral, citrus, sweet..."
                          rows={4}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="tastingNotesAr">
                          {isArabic ? 'ملاحظات التذوق (AR)' : 'Tasting Notes (AR)'}
                        </Label>
                        <Textarea
                          id="tastingNotesAr"
                          value={formData.tastingNotesAr}
                          onChange={(e) => updateField('tastingNotesAr', e.target.value)}
                          placeholder="زهري، حمضيات، حلو..."
                          rows={4}
                          dir="rtl"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>{isArabic ? 'تعليمات التحضير' : 'Brewing Instructions'}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="brewingInstructions">
                          {isArabic ? 'تعليمات التحضير (EN)' : 'Brewing Instructions (EN)'}
                        </Label>
                        <Textarea
                          id="brewingInstructions"
                          value={formData.brewingInstructions}
                          onChange={(e) => updateField('brewingInstructions', e.target.value)}
                          placeholder="Use 15g coffee per 250ml water..."
                          rows={4}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="brewingInstructionsAr">
                          {isArabic ? 'تعليمات التحضير (AR)' : 'Brewing Instructions (AR)'}
                        </Label>
                        <Textarea
                          id="brewingInstructionsAr"
                          value={formData.brewingInstructionsAr}
                          onChange={(e) => updateField('brewingInstructionsAr', e.target.value)}
                          placeholder="استخدم 15 جرام قهوة لكل 250 مل ماء..."
                          rows={4}
                          dir="rtl"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </AnimatePresence>
          </TabsContent>

          {/* Extra Tab */}
          <TabsContent value="extra" className="space-y-4">
            <AnimatePresence mode="wait">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-4"
              >
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Award className="w-5 h-5 text-amber-600" />
                      {isArabic ? 'الشهادات' : 'Certifications'}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <Leaf className="w-5 h-5 text-green-600" />
                        <div>
                          <Label htmlFor="isOrganic" className="text-base font-semibold">
                            {isArabic ? 'عضوي' : 'Organic'}
                          </Label>
                          <p className="text-sm text-gray-500">
                            {isArabic ? 'منتج عضوي معتمد' : 'Certified organic product'}
                          </p>
                        </div>
                      </div>
                      <Switch
                        id="isOrganic"
                        checked={formData.isOrganic}
                        onCheckedChange={(checked) => updateField('isOrganic', checked)}
                      />
                    </div>

                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <Award className="w-5 h-5 text-blue-600" />
                        <div>
                          <Label htmlFor="isFairTrade" className="text-base font-semibold">
                            {isArabic ? 'التجارة العادلة' : 'Fair Trade'}
                          </Label>
                          <p className="text-sm text-gray-500">
                            {isArabic ? 'منتج تجارة عادلة معتمد' : 'Certified fair trade product'}
                          </p>
                        </div>
                      </div>
                      <Switch
                        id="isFairTrade"
                        checked={formData.isFairTrade}
                        onCheckedChange={(checked) => updateField('isFairTrade', checked)}
                      />
                    </div>

                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <Crown className="w-5 h-5 text-orange-600" />
                        <div>
                          <Label htmlFor="isPremium" className="text-base font-semibold">
                            {isArabic ? 'بريميوم' : 'Premium'}
                          </Label>
                          <p className="text-sm text-gray-500">
                            {isArabic ? 'منتج بريميوم' : 'Premium product'}
                          </p>
                        </div>
                      </div>
                      <Switch
                        id="isPremium"
                        checked={formData.isPremium}
                        onCheckedChange={(checked) => updateField('isPremium', checked)}
                      />
                    </div>

                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <Sparkles className="w-5 h-5 text-purple-600" />
                        <div>
                          <Label htmlFor="isLimited" className="text-base font-semibold">
                            {isArabic ? 'إصدار محدود' : 'Limited'}
                          </Label>
                          <p className="text-sm text-gray-500">
                            {isArabic ? 'منتج إصدار محدود' : 'Limited edition product'}
                          </p>
                        </div>
                      </div>
                      <Switch
                        id="isLimited"
                        checked={formData.isLimited}
                        onCheckedChange={(checked) => updateField('isLimited', checked)}
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>{isArabic ? 'ملاحظات إضافية' : 'Additional Notes'}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="notes">
                          {isArabic ? 'ملاحظات (EN)' : 'Notes (EN)'}
                        </Label>
                        <Textarea
                          id="notes"
                          value={formData.notes}
                          onChange={(e) => updateField('notes', e.target.value)}
                          placeholder="Additional notes..."
                          rows={4}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="notesAr">
                          {isArabic ? 'ملاحظات (AR)' : 'Notes (AR)'}
                        </Label>
                        <Textarea
                          id="notesAr"
                          value={formData.notesAr}
                          onChange={(e) => updateField('notesAr', e.target.value)}
                          placeholder="ملاحظات إضافية..."
                          rows={4}
                          dir="rtl"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </AnimatePresence>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default ProductAttributesPage;
