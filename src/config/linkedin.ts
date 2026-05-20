export const linkedinConfig = {
  clientId: process.env.LINKEDIN_CLIENT_ID || '',
  clientSecret: process.env.LINKEDIN_CLIENT_SECRET || '',
  redirectUri: process.env.LINKEDIN_REDIRECT_URI || 'http://localhost:8080/api/auth/linkedin/callback',
  authorizationUrl: 'https://www.linkedin.com/oauth/v2/authorization',
  accessTokenUrl: 'https://www.linkedin.com/oauth/v2/accessToken',
  profileUrl: 'https://api.linkedin.com/v2/me',
  emailUrl: 'https://api.linkedin.com/v2/emailAddress?q=members&projection=(elements*(handle~))',
  scope: 'openid profile email',
};

export const generateState = (): string => {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
};

export const generateLinkedInAuthUrl = (state: string): string => {
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: linkedinConfig.clientId,
    redirect_uri: linkedinConfig.redirectUri,
    state,
    scope: linkedinConfig.scope,
  });

  return `${linkedinConfig.authorizationUrl}?${params.toString()}`;
};
