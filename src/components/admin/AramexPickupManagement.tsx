import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { 
  PackageCheck, 
  Search,
  AlertCircle,
  CheckCircle,
  Copy,
  Trash2,
  RefreshCw,
  ExternalLink
} from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
} from '../ui/table';
import { motion } from 'framer-motion';
import { getPickupDetails, cancelAramexPickup } from '../../services/aramexService';

interface PickupInfo {
  pickupGUID: string;
  pickupReference: string;
  orderNumber: string;
  shipmentNumber: string;
  status: string;
  createdAt?: string;
}

export const AramexPickupManagement: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [pickupInfo, setPickupInfo] = useState<PickupInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      setError('Please enter a Pickup GUID or Reference');
      return;
    }

    setIsLoading(true);
    setError(null);
    setPickupInfo(null);

    try {
      const response = await getPickupDetails(searchTerm.trim());
      
      if (response.success && response.data) {
        setPickupInfo(response.data);
      } else {
        setError(response.message || 'Pickup not found');
      }
    } catch (err: any) {
      console.error('Error searching pickup:', err);
      setError(err.message || 'Failed to retrieve pickup information');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelPickup = async () => {
    if (!pickupInfo?.pickupGUID) return;

    if (!confirm(`Are you sure you want to cancel pickup ${pickupInfo.pickupReference}?`)) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await cancelAramexPickup(pickupInfo.pickupGUID);
      
      if (response.success) {
        alert('Pickup cancelled successfully!');
        setPickupInfo(null);
        setSearchTerm('');
      } else {
        setError(response.message || 'Failed to cancel pickup');
      }
    } catch (err: any) {
      console.error('Error cancelling pickup:', err);
      setError(err.message || 'Failed to cancel pickup');
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = async (text: string, fieldName: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(fieldName);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-stone-50 to-amber-50/30 pt-24 pb-12">
      <div className="container mx-auto px-4 max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Aramex Pickup Management
            </h1>
            <p className="text-gray-600">
              Search, view, and manage Aramex pickup requests
            </p>
          </div>

          {/* Search Section */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5 text-blue-600" />
                Search Pickup
              </CardTitle>
              <CardDescription>
                Enter a Pickup GUID or Reference number to view details
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4">
                <div className="flex-1">
                  <Label htmlFor="search" className="sr-only">Search</Label>
                  <Input
                    id="search"
                    type="text"
                    placeholder="Enter Pickup GUID or Reference (e.g., PKP-12345678)"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleSearch();
                      }
                    }}
                  />
                </div>
                <Button
                  onClick={handleSearch}
                  disabled={isLoading || !searchTerm.trim()}
                >
                  {isLoading ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Searching...
                    </>
                  ) : (
                    <>
                      <Search className="h-4 w-4 mr-2" />
                      Search
                    </>
                  )}
                </Button>
              </div>

              {error && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                  <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 shrink-0" />
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Pickup Details */}
          {pickupInfo && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card className="border-green-200 bg-green-50/30">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <PackageCheck className="h-5 w-5 text-green-600" />
                      <span>Pickup Details</span>
                    </div>
                    <Badge className="bg-green-100 text-green-800 border-green-200">
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Active
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableBody>
                      <TableRow>
                        <TableHead className="w-1/3">Pickup Reference</TableHead>
                        <TableCell>
                          <div className="flex items-center justify-between">
                            <span className="font-mono font-bold text-lg text-green-700">
                              {pickupInfo.pickupReference}
                            </span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => copyToClipboard(pickupInfo.pickupReference, 'reference')}
                            >
                              {copiedField === 'reference' ? (
                                <CheckCircle className="h-4 w-4 text-green-600" />
                              ) : (
                                <Copy className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>

                      <TableRow>
                        <TableHead>Pickup GUID</TableHead>
                        <TableCell>
                          <div className="flex items-center justify-between">
                            <span className="font-mono text-sm text-gray-600 break-all">
                              {pickupInfo.pickupGUID}
                            </span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => copyToClipboard(pickupInfo.pickupGUID, 'guid')}
                            >
                              {copiedField === 'guid' ? (
                                <CheckCircle className="h-4 w-4 text-green-600" />
                              ) : (
                                <Copy className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>

                      <TableRow>
                        <TableHead>Order Number</TableHead>
                        <TableCell>
                          <span className="font-semibold">{pickupInfo.orderNumber}</span>
                        </TableCell>
                      </TableRow>

                      <TableRow>
                        <TableHead>Shipment Number</TableHead>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className="font-mono">{pickupInfo.shipmentNumber}</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => window.open(`https://www.aramex.com/track/shipments?ShipmentNumber=${pickupInfo.shipmentNumber}`, '_blank')}
                            >
                              <ExternalLink className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>

                      {pickupInfo.createdAt && (
                        <TableRow>
                          <TableHead>Created At</TableHead>
                          <TableCell>
                            {new Date(pickupInfo.createdAt).toLocaleString()}
                          </TableCell>
                        </TableRow>
                      )}

                      <TableRow>
                        <TableHead>Status</TableHead>
                        <TableCell>
                          <Badge className="bg-blue-100 text-blue-800 border-blue-200">
                            {pickupInfo.status || 'Active'}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>

                  <div className="mt-6 flex gap-3">
                    <Button
                      variant="destructive"
                      onClick={handleCancelPickup}
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                          Cancelling...
                        </>
                      ) : (
                        <>
                          <Trash2 className="h-4 w-4 mr-2" />
                          Cancel Pickup
                        </>
                      )}
                    </Button>

                    <Button
                      variant="outline"
                      onClick={() => {
                        setPickupInfo(null);
                        setSearchTerm('');
                      }}
                    >
                      Clear
                    </Button>
                  </div>

                  <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-xs text-blue-800">
                      <strong>Note:</strong> Cancelling a pickup will remove the scheduled collection from Aramex system. 
                      The courier will not visit to collect this shipment.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Information Panel */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <AlertCircle className="h-5 w-5 text-blue-600" />
                  About Pickup Management
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-gray-700">
                <div>
                  <h4 className="font-semibold mb-1">What is a Pickup?</h4>
                  <p>
                    When you create an Aramex shipment, a pickup request is automatically registered. 
                    This schedules an Aramex courier to visit your location and collect the package.
                  </p>
                </div>

                <div>
                  <h4 className="font-semibold mb-1">Pickup Reference vs GUID</h4>
                  <ul className="list-disc list-inside space-y-1 ml-2">
                    <li><strong>Pickup Reference:</strong> Human-readable ID (e.g., PKP-12345678) shown to customers</li>
                    <li><strong>Pickup GUID:</strong> Unique identifier used by Aramex API for operations</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold mb-1">When to Cancel a Pickup?</h4>
                  <ul className="list-disc list-inside space-y-1 ml-2">
                    <li>Order was cancelled before shipment collection</li>
                    <li>Customer changed delivery method</li>
                    <li>Need to reschedule the pickup for a different time</li>
                  </ul>
                </div>

                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <p className="text-xs text-amber-800">
                    <strong>⚠️ Important:</strong> Cancelling a pickup does NOT cancel the shipment itself. 
                    The shipment tracking number will remain active. You may need to cancel or void the shipment separately if needed.
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};
