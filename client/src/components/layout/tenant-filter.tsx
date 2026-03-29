import { MdApartment } from 'react-icons/md';
import { useFinOpsStore } from '@/lib/finops-store';
import { mockTenants, getRegionScale } from '@/lib/mock-data';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export function TenantFilter() {
  const { selectedTenantId, setSelectedTenantId, selectedRegion } = useFinOpsStore();

  const filteredTenants = selectedRegion === 'all'
    ? mockTenants
    : mockTenants.filter(t => getRegionScale(t.id, selectedRegion) > 0);

  return (
    <Select value={selectedTenantId} onValueChange={setSelectedTenantId}>
      <SelectTrigger className="w-[220px] bg-background/50 h-9">
        <div className="flex items-center gap-2 whitespace-nowrap overflow-hidden">
          <MdApartment className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
          <SelectValue placeholder="Select Tenant" />
        </div>
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">
          <div className="flex items-center gap-2">
            <span className="font-medium">All Tenants</span>
            <Badge variant="secondary" className="text-xs">{filteredTenants.length}</Badge>
          </div>
        </SelectItem>
        {filteredTenants.map((tenant) => (
          <SelectItem key={tenant.id} value={tenant.id}>
            <div className="flex items-center justify-between gap-3 w-full whitespace-nowrap">
              <span className="truncate">{tenant.name}</span>
              <span className="text-xs text-muted-foreground flex-shrink-0">{tenant.country}</span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
