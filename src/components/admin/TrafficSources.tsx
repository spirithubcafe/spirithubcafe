import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { TrendingUp, Globe, Share2, RotateCcw } from 'lucide-react';
import { getVisitSources, resetVisitorCount, type VisitSource } from '../../lib/visitorTracking';

interface TrafficSourcesProps {
  isArabic?: boolean;
}

export const TrafficSources: React.FC<TrafficSourcesProps> = ({ isArabic = false }) => {
  const [sources, setSources] = React.useState<VisitSource[]>([]);
  const [refreshKey, setRefreshKey] = React.useState(0);

  React.useEffect(() => {
    setSources(getVisitSources().sort((a, b) => b.count - a.count));
  }, [refreshKey]);

  const handleReset = () => {
    if (confirm(isArabic ? 'هل تريد إعادة تعيين بيانات الزيارات؟' : 'Reset all visit data?')) {
      resetVisitorCount();
      setRefreshKey(prev => prev + 1);
    }
  };

  const totalVisits = sources.reduce((sum, s) => sum + s.count, 0);

  // Categorize sources
  const socialPlatforms = ['Facebook', 'Instagram', 'Twitter/X', 'LinkedIn', 'TikTok', 
                           'YouTube', 'Pinterest', 'Snapchat', 'WhatsApp', 'Telegram'];
  
  const socialMediaSources = sources.filter(s => socialPlatforms.includes(s.source));
  const otherSources = sources.filter(s => !socialPlatforms.includes(s.source));

  const getSourceIcon = (source: string) => {
    if (socialPlatforms.includes(source)) return '📱';
    if (source.includes('Search')) return '🔍';
    if (source === 'Direct') return '🔗';
    return '🌐';
  };

  const renderSourceItem = (source: VisitSource) => {
    const percentage = totalVisits > 0 ? (source.count / totalVisits * 100).toFixed(1) : 0;
    
    return (
      <div key={source.source} className="flex items-center justify-between py-2 border-b last:border-b-0">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <span className="text-lg">{getSourceIcon(source.source)}</span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{source.source}</p>
            <p className="text-xs text-muted-foreground">
              {percentage}% {isArabic ? 'من الزيارات' : 'of visits'}
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-sm font-semibold">{source.count}</p>
          <p className="text-xs text-muted-foreground">
            {isArabic ? 'زيارة' : 'visits'}
          </p>
        </div>
      </div>
    );
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5" />
            {isArabic ? 'مصادر الزيارات' : 'Traffic Sources'}
          </CardTitle>
          <Button onClick={handleReset} variant="ghost" size="sm" title={isArabic ? 'إعادة تعيين' : 'Reset'}>
            <RotateCcw className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {sources.length === 0 ? (
          <div className="h-[200px] flex items-center justify-center border-2 border-dashed rounded-lg">
            <div className="text-center">
              <Globe className="h-12 w-12 mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm text-muted-foreground mb-2">
                {isArabic ? 'لا توجد بيانات متاحة' : 'No data available yet'}
              </p>
              <p className="text-xs text-muted-foreground max-w-xs mx-auto">
                {isArabic 
                  ? 'سيتم تسجيل الزيارات تلقائياً عندما يزور الأشخاص موقعك'
                  : 'Visit tracking starts automatically. Data will appear as visitors arrive from different sources.'}
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Social Media Section */}
            {socialMediaSources.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  {isArabic ? 'وسائل التواصل الاجتماعي' : 'Social Media'}
                </h4>
                <div className="max-h-[200px] overflow-y-auto space-y-1 pr-2">
                  {socialMediaSources.map(renderSourceItem)}
                </div>
              </div>
            )}

            {/* Other Sources Section */}
            {otherSources.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                  <Globe className="h-4 w-4" />
                  {isArabic ? 'مصادر أخرى' : 'Other Sources'}
                </h4>
                <div className="max-h-[200px] overflow-y-auto space-y-1 pr-2">
                  {otherSources.map(renderSourceItem)}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
