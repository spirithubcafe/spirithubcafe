import React from 'react';
import { useAuth } from '../../hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Spinner } from '../ui/spinner';
import { CheckCircle, XCircle, AlertCircle, RefreshCw } from 'lucide-react';
export const AuthStatusCard: React.FC = () => {
  const { isAuthenticated, user, isLoading, refreshUser } = useAuth();
  const [isRefreshing, setIsRefreshing] = React.useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refreshUser();
    } catch (error) {
      console.error('Failed to refresh user:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  if (isLoading) {
    return (
      <Card className="w-full max-w-md">
        <CardContent className="flex items-center justify-center py-6">
          <Spinner className="mr-2 h-4 w-4" />
          <span>Loading authentication status...</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center">
            {isAuthenticated ? (
              <>
                <CheckCircle className="mr-2 h-5 w-5 text-green-500" />
                Authenticated
              </>
            ) : (
              <>
                <XCircle className="mr-2 h-5 w-5 text-red-500" />
                Not Authenticated
              </>
            )}
          </CardTitle>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing || !isAuthenticated}
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </Button>
        </div>
        
        <CardDescription>
          Current authentication status and user information
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {isAuthenticated && user ? (
          <>
            <div className="space-y-2">
              <h4 className="font-semibold">User Information:</h4>
              <div className="text-sm space-y-1">
                <p><strong>ID:</strong> {user.id}</p>
                <p><strong>Username:</strong> {user.username}</p>
                {user.displayName && (
                  <p><strong>Display Name:</strong> {user.displayName}</p>
                )}
                <p><strong>Status:</strong> 
                  <Badge variant={user.isActive ? 'default' : 'secondary'} className="ml-2">
                    {user.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </p>
                {user.lastLoggedIn && (
                  <p><strong>Last Login:</strong> {new Date(user.lastLoggedIn).toLocaleString()}</p>
                )}
              </div>
            </div>
            
            {user.roles && user.roles.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-semibold">Roles:</h4>
                <div className="flex flex-wrap gap-1">
                  {user.roles.map((role, index) => (
                    <Badge key={index} variant="outline">
                      {role}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="flex items-center text-muted-foreground">
            <AlertCircle className="mr-2 h-4 w-4" />
            <span>Please log in to view user information</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};