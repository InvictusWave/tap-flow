import React from 'react';
import CardTable from '@/components/admin/CardTable';

export const dynamic = 'force-dynamic';

export default function CardsManagementPage() {
  return (
    <div className="space-y-6">
      <CardTable standalone={true} />
    </div>
  );
}
