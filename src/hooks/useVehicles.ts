import { useQuery } from '@tanstack/react-query';
import apiClient from '../services/apiClient';

export interface VehicleSelection {
    make: string;
    model: string;
    year: string;
    fuel: string;
    trim: string;
    engine: string;
}

export const useVehicles = () => {
    const fetchMakes = async () => {
        const res = await apiClient.get('/vehicles/makes');
        return res.data as string[];
    };

    const fetchModels = async (make: string) => {
        if (!make) return [];
        const res = await apiClient.get(`/vehicles/models?make=${encodeURIComponent(make)}`);
        return res.data as string[];
    };

    const fetchYears = async (make: string, model: string) => {
        if (!make || !model) return [];
        const res = await apiClient.get(`/vehicles/years?make=${encodeURIComponent(make)}&model=${encodeURIComponent(model)}`);
        return (res.data as (string | number)[]).map(y => y.toString());
    };

    const fetchFuels = async (make: string, model: string, year: string) => {
        if (!make || !model || !year) return [];
        const res = await apiClient.get(`/vehicles/fuels?make=${encodeURIComponent(make)}&model=${encodeURIComponent(model)}&year=${encodeURIComponent(year)}`);
        return res.data as string[];
    };

    const fetchTrims = async (make: string, model: string, year: string, fuel: string) => {
        if (!make || !model || !year || !fuel) return [];
        const res = await apiClient.get(`/vehicles/trims?make=${encodeURIComponent(make)}&model=${encodeURIComponent(model)}&year=${encodeURIComponent(year)}&fuel=${encodeURIComponent(fuel)}`);
        return res.data as string[];
    };

    const fetchEngines = async (make: string, model: string, year: string, fuel: string, trim: string) => {
        if (!make || !model || !year || !fuel || !trim) return [];
        const res = await apiClient.get(`/vehicles/engines?make=${encodeURIComponent(make)}&model=${encodeURIComponent(model)}&year=${encodeURIComponent(year)}&fuel=${encodeURIComponent(fuel)}&trim=${encodeURIComponent(trim)}`);
        return res.data as string[];
    };

    const STALE_TIME = 24 * 60 * 60 * 1000; // 24 Hours - Vehicle data is static

    return {
        useMakes: () => useQuery({ 
            queryKey: ['makes'], 
            queryFn: fetchMakes,
            staleTime: STALE_TIME
        }),
        useModels: (make: string) => useQuery({ 
            queryKey: ['models', make], 
            queryFn: () => fetchModels(make), 
            enabled: !!make,
            staleTime: STALE_TIME
        }),
        useYears: (make: string, model: string) => useQuery({ 
            queryKey: ['years', make, model], 
            queryFn: () => fetchYears(make, model), 
            enabled: !!make && !!model,
            staleTime: STALE_TIME
        }),
        useFuels: (make: string, model: string, year: string) => useQuery({ 
            queryKey: ['fuels', make, model, year], 
            queryFn: () => fetchFuels(make, model, year), 
            enabled: !!make && !!model && !!year,
            staleTime: STALE_TIME
        }),
        useTrims: (make: string, model: string, year: string, fuel: string) => useQuery({ 
            queryKey: ['trims', make, model, year, fuel], 
            queryFn: () => fetchTrims(make, model, year, fuel), 
            enabled: !!make && !!model && !!year && !!fuel,
            staleTime: STALE_TIME
        }),
        useEngines: (make: string, model: string, year: string, fuel: string, trim: string) => useQuery({ 
            queryKey: ['engines', make, model, year, fuel, trim], 
            queryFn: () => fetchEngines(make, model, year, fuel, trim), 
            enabled: !!make && !!model && !!year && !!fuel && !!trim,
            staleTime: STALE_TIME
        }),
    };
};
