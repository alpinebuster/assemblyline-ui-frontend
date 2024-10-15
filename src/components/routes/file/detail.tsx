import useAppUser from 'commons/components/app/hooks/useAppUser';
import PageCenter from 'commons/components/pages/PageCenter';
import type { CustomUser } from 'components/models/ui/user';
import ForbiddenPage from 'components/routes/403';
import FileDetail from 'components/visual/FileDetail';
import { useParams } from 'react-router-dom';

type ParamProps = {
  id: string;
};

function FileFullDetail() {
  const { id } = useParams<ParamProps>();
  const { user: currentUser } = useAppUser<CustomUser>();

  return currentUser.roles.includes('submission_view') ? (
    <PageCenter margin={4} width="100%">
      <FileDetail sha256={id} />
    </PageCenter>
  ) : (
    <ForbiddenPage />
  );
}

export default FileFullDetail;
