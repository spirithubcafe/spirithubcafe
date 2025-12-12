import React from 'react';
import { useAuth } from '../../hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Trash2, RefreshCw } from 'lucide-react';

export const AuthDebugPanel: React.FC = () => {
  const { user, isAuthenticated, isLoading, isAdmin, hasRole } = useAuth();

  const handleClearAuth = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    window.location.reload();
  };

  const handleRefresh = () => {
    window.location.reload();
  };

  return (
    <Card className="max-w-2xl mx-auto mt-8">
      <CardHeader>
        <CardTitle>Auth Debug Panel</CardTitle>
        <CardDescription>
          Debug authentication state and tokens
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium">Is Authenticated:</label>
            <Badge variant={isAuthenticated ? "default" : "destructive"}>
              {isAuthenticated ? "Yes" : "No"}
            </Badge>
          </div>
          <div>
            <label className="text-sm font-medium">Is Loading:</label>
            <Badge variant={isLoading ? "secondary" : "outline"}>
              {isLoading ? "Loading" : "Ready"}
            </Badge>
          </div>
          <div>
            <label className="text-sm font-medium">Is Admin:</label>
            <Badge variant={isAdmin() ? "default" : "destructive"}>
              {isAdmin() ? "Yes" : "No"}
            </Badge>
          </div>
          <div>
            <label className="text-sm font-medium">Has Admin Role:</label>
            <Badge variant={hasRole('Admin') ? "default" : "destructive"}>
              {hasRole('Admin') ? "Yes" : "No"}
            </Badge>
          </div>
        </div>

        {user && (
          <div className="space-y-2">
            <h4 className="font-medium">User Info:</h4>
            <pre className="bg-gray-100 p-3 rounded text-sm whitespace-pre-wrap break-all max-w-full">
              {JSON.stringify(user, null, 2)}
            </pre>
          </div>
        )}

        <div className="space-y-2">
          <h4 className="font-medium">Local Storage:</h4>
          <div className="grid grid-cols-1 gap-2 text-sm">
            <div>
              <span className="font-medium">Access Token:</span>
              <div className="bg-gray-100 p-2 rounded mt-1 break-all">
                {localStorage.getItem('accessToken') || 'Not found'}
              </div>
            </div>
            <div>
              <span className="font-medium">Refresh Token:</span>
              <div className="bg-gray-100 p-2 rounded mt-1 break-all">
                {localStorage.getItem('refreshToken') || 'Not found'}
              </div>
            </div>
            <div>
              <span className="font-medium">User Data:</span>
              <div className="bg-gray-100 p-2 rounded mt-1 break-all">
                {localStorage.getItem('user') || 'Not found'}
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          <Button onClick={handleRefresh} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh Page
          </Button>
          <Button onClick={handleClearAuth} variant="destructive" size="sm">
            <Trash2 className="h-4 w-4 mr-2" />
            Clear Auth Data
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};