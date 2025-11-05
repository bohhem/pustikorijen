import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  getGeoStates,
  getGeoRegions,
  getCitiesByRegion,
  getCitiesByState,
  getGeoCity,
} from '../../api/geo';
import type { GeoCity, GeoRegion, GeoState } from '../../types/geo';

interface GeoLocationSelectorProps {
  value?: string;
  onChange: (cityId: string | null, meta?: { city?: GeoCity }) => void;
  error?: string;
  disabled?: boolean;
  title?: string;
  description?: string;
  required?: boolean;
}

type LoadingState = {
  states: boolean;
  regions: boolean;
  cities: boolean;
};

const ENTITY_FBIH_ID = 'bih-fbih';
const STATE_BIH_ID = 'bih';

export default function GeoLocationSelector({
  value,
  onChange,
  error,
  disabled,
  title,
  description,
  required,
}: GeoLocationSelectorProps) {
  const { t } = useTranslation();

  const [states, setStates] = useState<GeoState[]>([]);
  const [regions, setRegions] = useState<GeoRegion[]>([]);
  const [cities, setCities] = useState<GeoCity[]>([]);

  const [selectedStateId, setSelectedStateId] = useState<string>('');
  const [selectedEntityId, setSelectedEntityId] = useState<string>('');
  const [selectedCantonId, setSelectedCantonId] = useState<string>('');
  const [selectedRegionLevel2Id, setSelectedRegionLevel2Id] = useState<string>('');
  const [selectedRegionLevel3Id, setSelectedRegionLevel3Id] = useState<string>('');
  const [selectedCityId, setSelectedCityId] = useState<string>('');

  const [loading, setLoading] = useState<LoadingState>({ states: false, regions: false, cities: false });
  const [initialLoadDone, setInitialLoadDone] = useState(false);

  const isBosnia = selectedStateId === STATE_BIH_ID;

  const entityOptions = isBosnia
    ? regions.filter((region) => region.type === 'entity' || region.type === 'district')
    : [];
  const cantonOptions = isBosnia ? regions.filter((region) => region.type === 'canton') : [];
  const requiresCanton = isBosnia && selectedEntityId === ENTITY_FBIH_ID;

  const level2Options = !isBosnia ? regions.filter((region) => region.type === 'nuts2') : [];
  const level3Options = !isBosnia
    ? regions.filter(
        (region) =>
          region.type === 'nuts3' &&
          (!selectedRegionLevel2Id || region.parentRegionId === selectedRegionLevel2Id),
      )
    : [];

  useEffect(() => {
    let ignore = false;

    const loadStates = async () => {
      setLoading((prev) => ({ ...prev, states: true }));
      try {
        const data = await getGeoStates();
        if (!ignore) {
          setStates(data);
        }
      } catch (err) {
        console.error('Failed to load states', err);
      } finally {
        if (!ignore) {
          setLoading((prev) => ({ ...prev, states: false }));
        }
      }
    };

    loadStates();
    return () => {
      ignore = true;
    };
  }, []);

  useEffect(() => {
    if (!value || initialLoadDone) return;

    let ignore = false;
    const loadInitialCity = async () => {
      try {
        const city = await getGeoCity(value);
        if (!ignore && city) {
          if (city.state?.id) setSelectedStateId(city.state.id);

          if (city.state?.id === STATE_BIH_ID) {
            if (city.entity?.id) setSelectedEntityId(city.entity.id);
            if (city.region?.id && city.region.type === 'canton') setSelectedCantonId(city.region.id);
          } else {
            if (city.region?.type === 'nuts3') {
              setSelectedRegionLevel3Id(city.region.id);
              if (city.region.parentRegionId) {
                setSelectedRegionLevel2Id(city.region.parentRegionId);
              }
            } else if (city.region?.type === 'nuts2') {
              setSelectedRegionLevel2Id(city.region.id);
            }
          }

          setSelectedCityId(city.id);
          setInitialLoadDone(true);
        }
      } catch (err) {
        console.error('Failed to load initial city', err);
      }
    };

    loadInitialCity();
    return () => {
      ignore = true;
    };
  }, [value, initialLoadDone]);

  useEffect(() => {
    if (!selectedStateId) {
      setRegions([]);
      setCities([]);
      return;
    }

    let ignore = false;

    const loadRegions = async () => {
      setLoading((prev) => ({ ...prev, regions: true }));
      try {
        const data = await getGeoRegions(selectedStateId);
        if (!ignore) {
          setRegions(data);
        }
      } catch (err) {
        console.error('Failed to load regions', err);
      } finally {
        if (!ignore) {
          setLoading((prev) => ({ ...prev, regions: false }));
        }
      }
    };

    loadRegions();

    return () => {
      ignore = true;
    };
  }, [selectedStateId]);

  useEffect(() => {
    if (!isBosnia) {
      return;
    }

    let regionId: string | null = null;
    if (requiresCanton) {
      regionId = selectedCantonId || null;
    } else if (selectedEntityId) {
      regionId = selectedEntityId;
    }

    if (!regionId) {
      setCities([]);
      return;
    }

    let ignore = false;
    const loadCities = async () => {
      setLoading((prev) => ({ ...prev, cities: true }));
      try {
        const data = await getCitiesByRegion(regionId!);
        if (!ignore) {
          setCities(data);
        }
      } catch (err) {
        console.error('Failed to load cities', err);
      } finally {
        if (!ignore) {
          setLoading((prev) => ({ ...prev, cities: false }));
        }
      }
    };

    loadCities();
    return () => {
      ignore = true;
    };
  }, [isBosnia, requiresCanton, selectedCantonId, selectedEntityId]);

  useEffect(() => {
    if (!selectedStateId || isBosnia) {
      return;
    }

    let ignore = false;

    const loadCities = async () => {
      setLoading((prev) => ({ ...prev, cities: true }));
      try {
        let data;
        if (selectedRegionLevel3Id) {
          data = await getCitiesByRegion(selectedRegionLevel3Id);
        } else {
          data = await getCitiesByState(selectedStateId);
          if (selectedRegionLevel2Id) {
            data = data.filter(
              (city) =>
                city.region?.parentRegionId === selectedRegionLevel2Id ||
                city.region?.id === selectedRegionLevel2Id,
            );
          }
        }

        if (!ignore) {
          setCities(data);
        }
      } catch (err) {
        console.error('Failed to load cities', err);
      } finally {
        if (!ignore) {
          setLoading((prev) => ({ ...prev, cities: false }));
        }
      }
    };

    loadCities();
    return () => {
      ignore = true;
    };
  }, [isBosnia, selectedRegionLevel2Id, selectedRegionLevel3Id, selectedStateId]);

  useEffect(() => {
    if (!selectedCityId) {
      onChange(null);
      return;
    }

    const city = cities.find((item) => item.id === selectedCityId);
    onChange(selectedCityId, { city });
  }, [cities, onChange, selectedCityId]);

  const handleStateChange = (stateId: string) => {
    setSelectedStateId(stateId);
    setSelectedEntityId('');
    setSelectedCantonId('');
    setSelectedRegionLevel2Id('');
    setSelectedRegionLevel3Id('');
    setSelectedCityId('');
    setCities([]);
  };

  const handleEntityChange = (entityId: string) => {
    setSelectedEntityId(entityId);
    setSelectedCantonId('');
    setSelectedCityId('');
    setCities([]);
  };

  const handleCantonChange = (cantonId: string) => {
    setSelectedCantonId(cantonId);
    setSelectedCityId('');
  };

  const handleRegionLevel2Change = (regionId: string) => {
    setSelectedRegionLevel2Id(regionId);
    setSelectedRegionLevel3Id('');
    setSelectedCityId('');
  };

  const handleRegionLevel3Change = (regionId: string) => {
    setSelectedRegionLevel3Id(regionId);
    setSelectedCityId('');
  };

  const handleCityChange = (cityId: string) => {
    setSelectedCityId(cityId);
  };

  const renderSelect = useCallback(
    (props: {
      id: string;
      label: string;
      value: string;
      onChange: (value: string) => void;
      placeholder?: string;
      options: { value: string; label: string }[];
      loading?: boolean;
      disabled?: boolean;
    }) => (
      <div>
        <label htmlFor={props.id} className="block text-sm font-medium text-gray-700">
          {props.label}
        </label>
        <select
          id={props.id}
          value={props.value}
          onChange={(event) => props.onChange(event.target.value)}
          disabled={props.disabled || props.loading}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 px-4 py-2 border bg-white disabled:bg-gray-50 disabled:text-gray-500"
        >
          <option value="">{props.placeholder ?? t('geoSelector.select')}</option>
          {props.options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
    ),
    [t],
  );

  const stateOptions = states.map((state) => ({ value: state.id, label: state.name }));
  const entitySelectOptions = entityOptions.map((entity) => ({
    value: entity.id,
    label: entity.name,
  }));
  const cantonSelectOptions = cantonOptions.map((region) => ({
    value: region.id,
    label: region.name,
  }));
  const level2SelectOptions = level2Options.map((region) => ({
    value: region.id,
    label: region.name,
  }));
  const level3SelectOptions = level3Options.map((region) => ({
    value: region.id,
    label: region.name,
  }));
  const cityOptions = cities.map((city) => ({
    value: city.id,
    label: city.name,
  }));

  return (
    <div className="space-y-4">
      {title && (
        <div>
          <div className="flex items-center justify-between">
            <span className="block text-sm font-medium text-gray-700">
              {title}
              {required ? ' *' : ''}
            </span>
            {description && <p className="text-xs text-gray-500">{description}</p>}
          </div>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {renderSelect({
          id: 'geo-state',
          label: t('geoSelector.state'),
          value: selectedStateId,
          onChange: handleStateChange,
          options: stateOptions,
          loading: loading.states,
          disabled: disabled,
        })}

        {isBosnia
          ? renderSelect({
              id: 'geo-entity',
              label: t('geoSelector.entity'),
              value: selectedEntityId,
              onChange: handleEntityChange,
              options: entitySelectOptions,
              loading: loading.regions,
              disabled: disabled || !selectedStateId || entitySelectOptions.length === 0,
              placeholder: entitySelectOptions.length
                ? t('geoSelector.selectEntity')
                : t('geoSelector.noEntities'),
            })
          : renderSelect({
              id: 'geo-region-l2',
              label: t('geoSelector.regionLevel2'),
              value: selectedRegionLevel2Id,
              onChange: handleRegionLevel2Change,
              options: level2SelectOptions,
              loading: loading.regions,
              disabled: disabled || !selectedStateId || level2SelectOptions.length === 0,
              placeholder: level2SelectOptions.length
                ? t('geoSelector.selectRegionLevel2')
                : t('geoSelector.noRegions'),
            })}
      </div>

      {requiresCanton && (
        <div className="grid gap-4 md:grid-cols-2">
          {renderSelect({
            id: 'geo-canton',
            label: t('geoSelector.canton'),
            value: selectedCantonId,
            onChange: handleCantonChange,
            options: cantonSelectOptions,
            loading: loading.regions,
            disabled: disabled || !selectedEntityId || cantonSelectOptions.length === 0,
            placeholder: cantonSelectOptions.length ? t('geoSelector.selectCanton') : t('geoSelector.noCantons'),
          })}
        </div>
      )}

      {!isBosnia && level3SelectOptions.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2">
          {renderSelect({
            id: 'geo-region-l3',
            label: t('geoSelector.regionLevel3'),
            value: selectedRegionLevel3Id,
            onChange: handleRegionLevel3Change,
            options: level3SelectOptions,
            loading: loading.regions,
            disabled: disabled || level3SelectOptions.length === 0,
            placeholder: level3SelectOptions.length
              ? t('geoSelector.selectRegionLevel3')
              : t('geoSelector.noRegions'),
          })}
        </div>
      )}

      <div>
        {renderSelect({
          id: 'geo-city',
          label: t('geoSelector.city'),
          value: selectedCityId,
          onChange: handleCityChange,
          options: cityOptions,
          loading: loading.cities,
          disabled: disabled || cityOptions.length === 0,
          placeholder: cityOptions.length ? t('geoSelector.selectCity') : t('geoSelector.noCities'),
        })}
        {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
      </div>
    </div>
  );
}
