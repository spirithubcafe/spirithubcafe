import { useState, useCallback } from 'react';
import {
  calculateAramexRate,
  getAramexCountries,
  getAramexCities,
  createAramexShipment,
  trackAramexShipment,
  type AramexRateRequest,
  type AramexRateResponse,
} from '../services/aramexService';

export const useAramex = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Calculate shipping rate with Aramex
   */
  const calculateRate = useCallback(async (
    request: AramexRateRequest
  ): Promise<AramexRateResponse> => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await calculateAramexRate(request);
      
      if (!response.success) {
        const errorMessage = response.errors?.join(', ') || 'Failed to calculate rate';
        setError(errorMessage);
      }
      
      return response;
    } catch (err: any) {
      const errorMessage = err.message || 'Error calculating shipping rate';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Get list of countries
   */
  const getCountries = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      return await getAramexCountries();
    } catch (err: any) {
      const errorMessage = err.message || 'Error fetching countries';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Get list of cities for a country
   */
  const getCities = useCallback(async (countryCode: string) => {
    setLoading(true);
    setError(null);
    
    try {
      return await getAramexCities(countryCode);
    } catch (err: any) {
      const errorMessage = err.message || 'Error fetching cities';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Create a new shipment
   */
  const createShipment = useCallback(async (shipmentData: any) => {
    setLoading(true);
    setError(null);
    
    try {
      return await createAramexShipment(shipmentData);
    } catch (err: any) {
      const errorMessage = err.message || 'Error creating shipment';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Track a shipment by AWB number
   */
  const trackShipment = useCallback(async (awbNumber: string) => {
    setLoading(true);
    setError(null);
    
    try {
      return await trackAramexShipment(awbNumber);
    } catch (err: any) {
      const errorMessage = err.message || 'Error tracking shipment';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    calculateRate,
    getCountries,
    getCities,
    createShipment,
    trackShipment,
  };
};
