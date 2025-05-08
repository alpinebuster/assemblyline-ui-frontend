import TableOfContentProvider from 'components/core/TableOfContent/TableOfContent';
import { FormProvider } from 'components/routes/settings/settings.form';
import { SettingsRoute } from 'components/routes/settings/settings.route';

const Settings = () => (
  <TableOfContentProvider>
    <FormProvider>
      <SettingsRoute />
    </FormProvider>
  </TableOfContentProvider>
);

export default Settings;
