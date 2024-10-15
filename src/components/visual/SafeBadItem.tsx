import { Divider } from '@mui/material';
import type { Badlist } from 'components/models/base/badlist';
import type { Safelist } from 'components/models/base/safelist';
import React from 'react';
import { useTranslation } from 'react-i18next';

type SafeBadItemProps = {
  item: Safelist | Badlist | null;
};

const WrappedSafeBadItem: React.FC<SafeBadItemProps> = ({ item }) => {
  const { t } = useTranslation();

  return item ? (
    <div>
      <div>{t('bad_safe_found')}</div>
      <Divider />
      <table style={{ borderSpacing: 0 }}>
        {item.sources.map((s, idx) => (
          <tr key={idx}>
            <td>{s.name}:</td>
            <td>
              {s.reason.map((r, r_idx) => (
                <div key={r_idx}>{r}</div>
              ))}
            </td>
          </tr>
        ))}
      </table>
    </div>
  ) : null;
};

const SafeBadItem = React.memo(WrappedSafeBadItem);
export default SafeBadItem;
