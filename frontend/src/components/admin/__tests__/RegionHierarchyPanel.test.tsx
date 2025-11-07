/// <reference types="vitest/globals" />

import '@testing-library/jest-dom/vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach, type Mock } from 'vitest';
import RegionHierarchyPanel from '../../admin/RegionHierarchyPanel';
import { getAdminRegionTree } from '../../../api/admin';

const translate = (_key: string, fallback?: string) => fallback ?? _key;

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: translate,
  }),
}));

vi.mock('../../../api/admin', () => ({
  getAdminRegionTree: vi.fn(),
}));

const mockedGetTree = getAdminRegionTree as unknown as Mock;

describe('RegionHierarchyPanel', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('renders hierarchy nodes and handles selection', async () => {
    mockedGetTree.mockResolvedValue([
      {
        id: 'bih',
        name: 'Bosnia and Herzegovina',
        code: 'BIH',
        level: 1,
        kind: 'state',
        country: 'Bosnia and Herzegovina',
        children: [
          {
            id: 'bih-fbih',
            name: 'Federation of Bosnia and Herzegovina',
            code: 'FBiH',
            level: 2,
            kind: 'entity',
            country: 'Bosnia and Herzegovina',
            children: [
              {
                id: 'bih-fbih-tesanj',
                name: 'Tešanj',
                code: 'TES',
                level: 3,
                kind: 'municipality',
                country: 'Bosnia and Herzegovina',
                children: [],
              },
            ],
          },
        ],
      },
    ]);

    const handleSelect = vi.fn();

    render(
      <RegionHierarchyPanel
        onSelect={handleSelect}
        title="Hierarchy"
        defaultExpandedLevel={2}
      />
    );

    expect(screen.getByText(/Hierarchy/i)).toBeInTheDocument();
    await waitFor(() => expect(mockedGetTree).toHaveBeenCalled());
    await waitFor(() => expect(screen.queryByText('Loading...')).not.toBeInTheDocument());
    expect(await screen.findByText('Bosnia and Herzegovina')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Tešanj'));

    expect(handleSelect).toHaveBeenCalledWith('bih-fbih-tesanj');

    const collapseButtons = screen.getAllByLabelText(/Collapse region/i);
    fireEvent.click(collapseButtons[0]);
    await waitFor(() => {
      expect(screen.queryByTestId('region-node-bih-fbih')).not.toBeInTheDocument();
    });
  });

  it('shows fallback when API fails', async () => {
    mockedGetTree.mockRejectedValue(new Error('boom'));

    render(<RegionHierarchyPanel title="Fallback" />);

    expect(screen.getByText(/Loading/i)).toBeInTheDocument();
    await waitFor(() => expect(mockedGetTree).toHaveBeenCalled());
    await waitFor(() => expect(screen.queryByText('Loading...')).not.toBeInTheDocument());
    await waitFor(() =>
      expect(screen.getByText(/Unable to load region hierarchy/i)).toBeInTheDocument()
    );
  });
});
