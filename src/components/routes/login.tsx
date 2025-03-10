/* eslint-disable jsx-a11y/anchor-is-valid */
import { Box, Button, CircularProgress, Link, Stack, Typography } from '@mui/material';
import createStyles from '@mui/styles/createStyles';
import makeStyles from '@mui/styles/makeStyles';
import useAppBanner from 'commons/components/app/hooks/useAppBanner';
import useAppBannerVert from 'commons/components/app/hooks/useAppBannerVert';
import useAppLayout from 'commons/components/app/hooks/useAppLayout';
import PageCardCentered from 'commons/components/pages/PageCardCentered';
import useMyAPI from 'components/hooks/useMyAPI';
import useMySnackbar from 'components/hooks/useMySnackbar';
import { OneTimePassLogin } from 'components/routes/login/otp';
import { ResetPassword, ResetPasswordNow } from 'components/routes/login/reset';
import { SecurityTokenLogin } from 'components/routes/login/sectoken';
import { SignUp } from 'components/routes/login/signup';
import { SSOLogin } from 'components/routes/login/sso';
import { UserPassLogin } from 'components/routes/login/userpass';
import TextDivider from 'components/visual/TextDivider';
import { getProvider, getSAMLData } from 'helpers/utils';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';
import { useLocation } from 'react-router-dom';

const useStyles = makeStyles(() =>
  createStyles({
    buttonProgress: {
      position: 'absolute',
      top: '50%',
      left: '50%',
      marginTop: -12,
      marginLeft: -12
    }
  })
);

type LoginScreenProps = {
  allowUserPass: boolean;
  allowSAML: boolean;
  allowSignup: boolean;
  oAuthProviders: string[];
};

export default function LoginScreen({ allowUserPass, allowSAML, allowSignup, oAuthProviders }: LoginScreenProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const params = new URLSearchParams(location.search);
  const { t } = useTranslation(['login']);
  const classes = useStyles();
  const { apiCall } = useMyAPI();
  const bannerVert = useAppBannerVert();
  const banner = useAppBanner();
  const { hideMenus } = useAppLayout();
  const provider = getProvider();
  const samlData = getSAMLData();
  const [shownControls, setShownControls] = useState(
    provider ? 'oauth' : params.get('reset_id') ? 'reset_now' : samlData ? 'saml' : 'login'
  );
  const { showErrorMessage, showSuccessMessage } = useMySnackbar();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [avatar, setAvatar] = useState('');
  const [oauthTokenID, setOAuthTokenID] = useState('');
  const [samlTokenID, setSAMLTokenID] = useState('');
  const [oneTimePass, setOneTimePass] = useState('');
  const [webAuthNResponse, setWebAuthNResponse] = useState(null);
  const [buttonLoading, setButtonLoading] = useState(false);

  // Quick login can only be used if there's exactly one external authentication service configured
  const quickSSOLogin = allowSAML && oAuthProviders.length === 0 ? true : !allowSAML && oAuthProviders?.length === 1;

  function reset(event) {
    if ((['oauth'].includes(shownControls) && oauthTokenID) || !['oauth'].includes(shownControls)) {
      setWebAuthNResponse(null);
      setShownControls('login');
      setUsername('');
      setEmail('');
      setPassword('');
      setAvatar('');
      setOAuthTokenID('');
      setSAMLTokenID('');
      setOneTimePass('');
      setButtonLoading(false);
    }
    if (event) {
      event.preventDefault();
    }
  }

  function login(focusTarget) {
    if (buttonLoading) {
      return;
    }

    const data = {
      user: username,
      password,
      otp: oneTimePass,
      webauthn_auth_resp: webAuthNResponse,
      oauth_token_id: oauthTokenID,
      saml_token_id: samlTokenID
    };

    apiCall({
      url: '/api/v4/auth/login/',
      method: 'POST',
      body: data,
      reloadOnUnauthorize: false,
      onEnter: () => setButtonLoading(true),
      onExit: () => setButtonLoading(false),
      onFailure: api_data => {
        if (api_data.api_error_message === 'Wrong OTP token' && shownControls !== 'otp') {
          setShownControls('otp');
        } else if (api_data.api_error_message === 'Wrong Security Token' && shownControls === 'sectoken') {
          setShownControls('otp');
          showErrorMessage(t('securitytoken.error'));
        } else if (api_data.api_error_message === 'Wrong Security Token' && shownControls !== 'sectoken') {
          setShownControls('sectoken');
        } else if (shownControls === 'oauth' || shownControls === 'saml') {
          showErrorMessage(api_data.api_error_message);
          reset(null);
        } else {
          showErrorMessage(api_data.api_error_message);
          if (focusTarget !== null) {
            // eslint-disable-next-line no-prototype-builtins
            if (focusTarget.hasOwnProperty('select')) {
              focusTarget.select();
              focusTarget.focus();
            }
          }
        }
      },
      onSuccess: () => {
        window.location.reload();
      }
    });
  }

  function onSubmit(event) {
    if (event) {
      login(event.target[0]);
      event.preventDefault();
    } else {
      // onSubmit was called manually
      login(null);
    }
  }

  function resetPW(event) {
    setShownControls('reset');
    event.preventDefault();
  }

  function signup(event) {
    setShownControls('signup');
    event.preventDefault();
  }

  useEffect(() => {
    if (webAuthNResponse !== null) {
      login(null);
    } else if (shownControls === 'oauth') {
      apiCall({
        url: `/api/v4/auth/oauth/${
          provider && location.search.indexOf('provider=') === -1
            ? `${location.search}&provider=${provider}`
            : location.search
        }`,
        reloadOnUnauthorize: false,
        onSuccess: api_data => {
          setAvatar(api_data.api_response.avatar);
          setUsername(api_data.api_response.username);
          setEmail(api_data.api_response.email_adr || '');
          setOAuthTokenID(api_data.api_response.oauth_token_id);
        },
        onFailure: api_data => {
          showErrorMessage(api_data.api_error_message);
          setShownControls('login');
        },
        onFinalize: () => {
          if (provider) {
            navigate(localStorage.getItem('nextLocation') || '/');
          }
        }
      });
    } else if (params.get('registration_key')) {
      apiCall({
        url: '/api/v4/auth/signup_validate/',
        method: 'POST',
        body: { registration_key: params.get('registration_key') },
        onSuccess: () => showSuccessMessage(t('signup.completed'), 10000),
        onFinalize: () => navigate('/')
      });
    }
    // eslint-disable-next-line
  }, [webAuthNResponse, shownControls]);

  useEffect(() => {
    if (samlData !== null) {
      if (samlData.error !== null && samlData.error !== undefined) {
        showErrorMessage(samlData.error);
        reset(null);
      } else {
        setUsername(cur_username => samlData.username || cur_username);
        setEmail(cur_email => samlData.email || cur_email);
        setSAMLTokenID(cur_token => samlData.saml_token_id || cur_token);
      }
      navigate(localStorage.getItem('nextLocation') || '/');
    }

    // eslint-disable-next-line
  }, [samlData]);

  useEffect(() => {
    hideMenus();
  }, [hideMenus]);

  return (
    <PageCardCentered>
      <Box sx={{ cursor: 'pointer' }} onClick={reset}>
        {shownControls === 'login' ? bannerVert : banner}
      </Box>
      {
        {
          login: (
            <>
              {allowUserPass ? (
                <Stack spacing={1}>
                  <UserPassLogin
                    onSubmit={onSubmit}
                    buttonLoading={buttonLoading}
                    setPassword={setPassword}
                    setUsername={setUsername}
                  />
                  {allowSignup ? (
                    <>
                      <Typography align="center" variant="caption">
                        {t('signup')}&nbsp;&nbsp;
                        <Link href="#" onClick={signup}>
                          {t('signup.link')}
                        </Link>
                      </Typography>
                      <Typography align="center" variant="caption">
                        {t('reset.desc')}&nbsp;&nbsp;
                        <Link href="#" onClick={resetPW}>
                          {t('reset.link')}
                        </Link>
                      </Typography>
                    </>
                  ) : null}
                </Stack>
              ) : null}
              {(oAuthProviders !== undefined && oAuthProviders.length !== 0) || allowSAML ? (
                <>
                  {allowUserPass ? <TextDivider /> : null}
                  <Stack spacing={3}>
                    {oAuthProviders !== undefined &&
                      oAuthProviders.map((item, idx) => (
                        <Button
                          key={idx}
                          variant="contained"
                          color="primary"
                          disabled={buttonLoading}
                          onClick={() => {
                            localStorage.setItem(
                              'nextLocation',
                              location.pathname === '/logout'
                                ? '/'
                                : `${location.pathname}${location.search}${location.hash}`
                            );
                            setButtonLoading(true);
                          }}
                          href={`/api/v4/auth/login/?oauth_provider=${item}`}
                        >
                          {`${t('button_oauth')} ${item.replace(/_/g, ' ')}`}
                          {buttonLoading && <CircularProgress size={24} className={classes.buttonProgress} />}
                        </Button>
                      ))}
                    {allowSAML && (
                      <Button
                        variant="contained"
                        color="primary"
                        disabled={buttonLoading}
                        onClick={() => {
                          localStorage.setItem(
                            'nextLocation',
                            location.pathname === '/logout'
                              ? '/'
                              : `${location.pathname}${location.search}${location.hash}`
                          );
                          setButtonLoading(true);
                        }}
                        href={'/api/v4/auth/saml/sso/'}
                      >
                        {t('button_saml')}
                        {buttonLoading && <CircularProgress size={24} className={classes.buttonProgress} />}
                      </Button>
                    )}
                  </Stack>
                </>
              ) : null}
            </>
          ),
          signup: <SignUp setButtonLoading={setButtonLoading} buttonLoading={buttonLoading} reset={reset} />,
          reset: <ResetPassword setButtonLoading={setButtonLoading} buttonLoading={buttonLoading} reset={reset} />,
          reset_now: (
            <ResetPasswordNow setButtonLoading={setButtonLoading} buttonLoading={buttonLoading} reset={reset} />
          ),
          oauth: (
            <SSOLogin
              reset={reset}
              tokenID={oauthTokenID}
              avatar={avatar}
              username={username}
              email={email}
              onSubmit={onSubmit}
              buttonLoading={buttonLoading}
              quickLogin={quickSSOLogin}
            />
          ),
          otp: <OneTimePassLogin onSubmit={onSubmit} buttonLoading={buttonLoading} setOneTimePass={setOneTimePass} />,
          sectoken: (
            <SecurityTokenLogin
              setShownControls={setShownControls}
              setWebAuthNResponse={setWebAuthNResponse}
              username={username}
            />
          ),
          saml: (
            <SSOLogin
              reset={reset}
              tokenID={samlTokenID}
              avatar={avatar}
              username={username}
              email={email}
              onSubmit={onSubmit}
              buttonLoading={buttonLoading}
              quickLogin={quickSSOLogin}
            />
          )
        }[shownControls]
      }
    </PageCardCentered>
  );
}
