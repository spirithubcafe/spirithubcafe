import React from 'react';
import { AramexPickupManagement } from '../components/admin/AramexPickupManagement';
import { Seo } from '../components/seo/Seo';
import { siteMetadata } from '../config/siteMetadata';

export const AramexPickupManagementPage: React.FC = () => {
  return (
    <>
      <Seo
        title={`Aramex Pickup Management - ${siteMetadata.siteName}`}
        description="Manage Aramex pickup requests, view pickup details, and cancel pickups"
      />
      <AramexPickupManagement />
    </>
  );
};
