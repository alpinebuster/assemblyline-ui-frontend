import { Tooltip } from '@mui/material';
import type { Verdict } from 'components/models/base/alert';
import type { PossibleColor } from 'components/models/utils/color';
import CustomChip from 'components/visual/CustomChip';
import React from 'react';
import { useTranslation } from 'react-i18next';

const VERDICT_COLOR_MAP: Record<Verdict, PossibleColor> = {
  info: 'default',
  safe: 'success',
  suspicious: 'warning',
  highly_suspicious: 'warning',
  malicious: 'error'
};

type TextVerdictProps = {
  verdict: string;
  variant?: 'outlined' | 'filled';
  size?: 'tiny' | 'small' | 'medium';
  mono?: boolean;
  fullWidth?: boolean;
};

const WrappedTextVerdict: React.FC<TextVerdictProps> = ({
  verdict,
  variant = 'filled',
  size = 'tiny',
  mono = false,
  fullWidth = false
}) => {
  const { t } = useTranslation();
  const color = VERDICT_COLOR_MAP[verdict];

  return (
    <Tooltip title={t(`verdict.${verdict}`)}>
      <span>
        <CustomChip
          type="rounded"
          variant={variant}
          size={size}
          label={t(`verdict.${verdict}.short`)}
          color={color}
          mono={mono}
          fullWidth={fullWidth}
        />
      </span>
    </Tooltip>
  );
};

const TextVerdict = React.memo(WrappedTextVerdict);
export default TextVerdict;
